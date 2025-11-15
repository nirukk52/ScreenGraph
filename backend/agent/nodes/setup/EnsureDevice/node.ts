import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { EventKind } from "../../../domain/events";
import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { DeviceConfiguration } from "../../../ports/appium/session.port";
import type { SessionPort } from "../../../ports/appium/session.port";
import { checkAppiumHealth, getBrowserStackUrl } from "./appium-lifecycle";
import {
  createAppiumHealthCheckCompletedEvent,
  createAppiumHealthCheckStartedEvent,
  createDeviceCheckCompletedEvent,
  createDeviceCheckStartedEvent,
  createDeviceCheckFailedEvent,
} from "./lifecycle-events";

export interface EnsureDeviceInput extends CommonNodeInput {
  runId: string;
  iterationOrdinalNumber: number;
  deviceConfiguration: DeviceConfiguration;
  driverReusePolicy: "REUSE_OR_CREATE";
  /** Cloud app URL (e.g., bs://...) if APK was pre-uploaded to BrowserStack */
  cloudAppUrl?: string;
}

export interface EnsureDeviceOutput extends CommonNodeOutput {
  runId: string;
  deviceRuntimeContextId: string;
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

  try {
    // Device check - BrowserStack cloud device availability tied to hub health
    logger.info("checking browserstack hub availability");
    events.push(
      createDeviceCheckStartedEvent(
        input.runId,
        sequence++,
        input.deviceConfiguration.appId,
        input.deviceConfiguration.deviceName,
      ),
    );
    events.push(createAppiumHealthCheckStartedEvent(input.runId, sequence++, 443)); // HTTPS port

    const healthCheck = await checkAppiumHealth();

    if (!healthCheck.isHealthy) {
      logger.error("browserstack hub not available", { error: healthCheck.error });
      events.push(
        createAppiumHealthCheckCompletedEvent(input.runId, sequence++, false, 443, false),
      );
      events.push(
        createDeviceCheckFailedEvent(
          input.runId,
          sequence++,
          healthCheck.error || "BrowserStack hub not available",
          input.deviceConfiguration.appId,
        ),
      );

      const hubError = new Error(healthCheck.error || "BrowserStack hub not available");
      hubError.name = "BrowserStackUnavailableError";
      throw hubError;
    }

        logger.info("browserstack hub healthy");
        events.push(
          createAppiumHealthCheckCompletedEvent(input.runId, sequence++, true, 443, true),
        );
        events.push(
          createDeviceCheckCompletedEvent(
            input.runId,
            sequence++,
            true,
            input.deviceConfiguration.deviceName,
          ),
        );

        // Proceed with session creation using context's appiumServerUrl (configured in buildAgentContext)
        logger.info("proceeding with device management", {
          platformName: input.deviceConfiguration.platformName,
          cloudAppUrl: input.cloudAppUrl,
        });

        // Pass cloud app URL to session if available (required for BrowserStack)
        const deviceConfig: DeviceConfiguration = {
          ...input.deviceConfiguration,
          ...(input.cloudAppUrl && { app: input.cloudAppUrl }),
        };

        const ctx = await sessionPort.ensureDevice(deviceConfig);
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
    };

    logger.info("EnsureDevice OUTPUT", { output });

    return {
      output,
      events,
    };
  } catch (error) {
    logger.error("EnsureDevice failure", { error });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error && error.name ? error.name : "UnknownError";
    const isRetryable = errorName === "BrowserStackUnavailableError" || errorName === "TimeoutError" || errorName === "DeviceOfflineError";

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
    };

    logger.info("EnsureDevice FAILURE OUTPUT", { failureOutput });

    return {
      output: failureOutput,
      events,
    };
  }
}
