import log from "encore.dev/log";
import { APPIUM_PORT, ENABLE_MOBILE_MCP } from "../../../../config/env";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { EventKind } from "../../../domain/events";
import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { DeviceConfiguration } from "../../../ports/appium/session.port";
import type { SessionPort } from "../../../ports/appium/session.port";
import type { DeviceAllocationRequest, DeviceInfo, DeviceSession } from "../../../../mobile/types";
import { createMobileDeviceSession, closeMobileDeviceSession } from "../../../adapters/mobile/session.adapter";
import { checkAppiumHealth, startAppium } from "./appium-lifecycle";
import { checkDevicePrerequisites } from "./device-check";
import {
  createAppiumHealthCheckCompletedEvent,
  createAppiumHealthCheckStartedEvent,
  createAppiumReadyEvent,
  createAppiumStartFailedEvent,
  createAppiumStartingEvent,
  createDeviceCheckCompletedEvent,
  createDeviceCheckFailedEvent,
  createDeviceCheckStartedEvent,
} from "./lifecycle-events";

export interface EnsureDeviceInput extends CommonNodeInput {
  runId: string;
  iterationOrdinalNumber: number;
  deviceConfiguration: DeviceConfiguration;
  driverReusePolicy: "REUSE_OR_CREATE";
}

export interface EnsureDeviceOutput extends CommonNodeOutput {
  runId: string;
  deviceRuntimeContextId: string;
  mobileSessionId?: string | null;
  mobileDeviceId?: string | null;
}

/**
 * Maps session device configuration to mobile service allocation request.
 * PURPOSE: Normalizes platform naming and optional filters for mobile-mcp.
 */
function buildMobileAllocation(config: DeviceConfiguration): DeviceAllocationRequest {
  const normalizedPlatform = config.platformName?.toLowerCase() ?? "android";
  const platform: DeviceAllocationRequest["platform"] =
    normalizedPlatform.includes("ios") ? "ios" : "android";

  const normalizedDeviceName = config.deviceName?.toLowerCase() ?? "";
  const deviceType = normalizedDeviceName.includes("simulator")
    ? ("simulator" as const)
    : normalizedDeviceName.includes("emulator")
      ? ("emulator" as const)
      : normalizedDeviceName.includes("device")
        ? ("real" as const)
        : undefined;

  return {
    platform,
    provider: "local",
    ...(deviceType ? { deviceType } : {}),
    ...(config.platformVersion ? { version: config.platformVersion } : {}),
  };
}

/**
 * Extracts DeviceInfo metadata from mobile session payload when available.
 * PURPOSE: Allows agent to reuse detected platform/version without additional queries.
 */
function extractDeviceInfo(metadata: Record<string, unknown> | undefined): Partial<DeviceInfo> | null {
  if (!metadata) {
    return null;
  }

  const candidate = metadata.deviceInfo;
  if (candidate && typeof candidate === "object") {
    return candidate as Partial<DeviceInfo>;
  }

  return null;
}

/**
 * ensureDevice orchestrates session acquisition via SessionPort and emits deterministic node output.
 * PURPOSE: Wraps adapter interactions and guarantees SUCCESS/FAILURE outputs for engine transitions.
 */
export async function ensureDevice(
  input: EnsureDeviceInput,
  sessionPort: SessionPort,
  generateId: () => string,
): Promise<{
  output: EnsureDeviceOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "EnsureDevice",
  });
  logger.info("EnsureDevice INPUT", { input });

  const events: Array<{ kind: EventKind; payload: Record<string, unknown> }> = [];
  let sequence = 0;
  const appId = (input.deviceConfiguration as { appId?: string }).appId ?? "unknown";
  const deviceConfiguration = {
    ...input.deviceConfiguration,
  } as DeviceConfiguration & { appId?: string };
  let mobileSession: DeviceSession | null = null;

  try {
    if (ENABLE_MOBILE_MCP) {
      const allocation = buildMobileAllocation(deviceConfiguration);
      mobileSession = await createMobileDeviceSession(allocation);

      deviceConfiguration.deviceName = mobileSession.deviceId;

      const deviceInfo = extractDeviceInfo(mobileSession.metadata);
      if (deviceInfo?.version && !deviceConfiguration.platformVersion) {
        deviceConfiguration.platformVersion = deviceInfo.version;
      }
      if (deviceInfo?.platform) {
        deviceConfiguration.platformName =
          deviceInfo.platform === "ios" ? "iOS" : "Android";
      }

      logger.info("using mobile-mcp allocated device", {
        sessionId: mobileSession.sessionId,
        deviceId: mobileSession.deviceId,
        allocation,
      });
    }

    // Pre-flight check 1: Device prerequisites
    logger.info("checking device prerequisites", {
      appId,
      deviceId: deviceConfiguration.deviceName,
    });

    events.push(
      createDeviceCheckStartedEvent(
        input.runId,
        sequence++,
        appId,
        deviceConfiguration.deviceName,
      ),
    );

    const deviceCheck = await checkDevicePrerequisites({
      appId,
      deviceId: deviceConfiguration.deviceName,
      platform: deviceConfiguration.platformName?.toLowerCase().includes("ios")
        ? "ios"
        : "android",
    });

    if (!deviceCheck.isOnline) {
      logger.error("device offline", { error: deviceCheck.error });
      events.push(
        createDeviceCheckFailedEvent(
          input.runId,
          sequence++,
          deviceCheck.error || "Device offline",
          appId,
        ),
      );

      const offlineError = new Error(deviceCheck.error || "Device offline");
      offlineError.name = "DeviceOfflineError";
      throw offlineError;
    }

    logger.info("device online", { deviceId: deviceCheck.deviceId });
    events.push(
      createDeviceCheckCompletedEvent(
        input.runId,
        sequence++,
        true,
        deviceCheck.deviceId ?? deviceConfiguration.deviceName,
      ),
    );

    // Pre-flight check 2: Appium health check
    logger.info("checking appium health", { port: APPIUM_PORT });
    events.push(createAppiumHealthCheckStartedEvent(input.runId, sequence++, APPIUM_PORT));

    const healthCheck = await checkAppiumHealth(APPIUM_PORT);

    if (healthCheck.isHealthy) {
      logger.info("appium already running and healthy - reusing", { port: APPIUM_PORT });
      events.push(
        createAppiumHealthCheckCompletedEvent(input.runId, sequence++, true, APPIUM_PORT, true),
      );
    } else {
      logger.info("appium not healthy - starting fresh instance", {
        port: APPIUM_PORT,
        error: healthCheck.error,
      });
      events.push(
        createAppiumHealthCheckCompletedEvent(input.runId, sequence++, false, APPIUM_PORT, false),
      );

      // Start Appium
      events.push(createAppiumStartingEvent(input.runId, sequence++, APPIUM_PORT));

      const startTime = Date.now();
      try {
        const appiumProcess = await startAppium(APPIUM_PORT);
        const startDurationMs = Date.now() - startTime;

        logger.info("appium started successfully", {
          pid: appiumProcess.pid,
          port: APPIUM_PORT,
          startDurationMs,
        });

        events.push(
          createAppiumReadyEvent(
            input.runId,
            sequence++,
            appiumProcess.pid,
            APPIUM_PORT,
            startDurationMs,
          ),
        );
      } catch (error) {
        const timeoutMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        logger.error("appium start failed", { error: errorMessage, timeoutMs });
        events.push(
          createAppiumStartFailedEvent(
            input.runId,
            sequence++,
            errorMessage,
            APPIUM_PORT,
            timeoutMs,
          ),
        );

        const timeoutError = new Error(errorMessage);
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
    }

    // Lifecycle checks passed - proceed with session creation
    const ctx = await sessionPort.ensureDevice(deviceConfiguration);
    logger.info("DeviceRuntimeContext received", { ctx });

    const contextId = ctx.deviceRuntimeContextId || generateId();
    logger.info("Resolved contextId", { contextId });

    const output: EnsureDeviceOutput = {
      runId: input.runId,
      deviceRuntimeContextId: contextId,
      nodeName: "EnsureDevice",
      stepOrdinal: 0,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-000`,
      randomSeed: 987654,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      mobileSessionId: mobileSession?.sessionId ?? null,
      mobileDeviceId: mobileSession?.deviceId ?? deviceConfiguration.deviceName ?? null,
    };

    logger.info("EnsureDevice OUTPUT", { output });

    return {
      output,
      events,
    };
  } catch (error) {
    logger.error("EnsureDevice failure", { error });

    if (ENABLE_MOBILE_MCP && mobileSession) {
      try {
        await closeMobileDeviceSession(mobileSession.sessionId);
        logger.info("cleaned up mobile session after failure", {
          sessionId: mobileSession.sessionId,
        });
      } catch (cleanupError) {
        const cleanupMessage =
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        logger.warn("failed to cleanup mobile session after failure", {
          sessionId: mobileSession.sessionId,
          error: cleanupMessage,
        });
      }
      mobileSession = null;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error && error.name ? error.name : "UnknownError";
    const isRetryable = errorName === "DeviceOfflineError" || errorName === "TimeoutError";

    const failureOutput: EnsureDeviceOutput = {
      runId: input.runId,
      deviceRuntimeContextId: "",
      nodeName: "EnsureDevice",
      stepOrdinal: 0,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-000`,
      randomSeed: 987654,
      nodeExecutionOutcomeStatus: "FAILURE",
      errorId: errorName,
      retryable: isRetryable,
      humanReadableFailureSummary: errorMessage,
      mobileSessionId: null,
      mobileDeviceId: null,
    };

    logger.info("EnsureDevice FAILURE OUTPUT", { failureOutput });

    return {
      output: failureOutput,
      events,
    };
  }
}
