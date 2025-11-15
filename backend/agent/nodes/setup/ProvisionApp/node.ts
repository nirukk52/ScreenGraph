import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import {
  AppNotInstalledError,
  InvalidArgumentError,
  TimeoutError,
} from "../../../adapters/appium/errors";
import type { EventKind } from "../../../domain/events";
import type {
  CommonNodeInput,
  CommonNodeOutput,
  ProvisionedAppState,
  SignatureValidationStatus,
} from "../../../domain/state";
import type { PackageManagerPort } from "../../../ports/appium/package-manager.port";
import type { SessionPort } from "../../../ports/appium/session.port";

export interface ProvisionAppInput extends CommonNodeInput {
  runId: string;
  deviceRuntimeContextId: string;
  appiumServerUrl: string;
  applicationUnderTestDescriptor: {
    androidPackageId: string;
    apkStorageObjectReference: string;
    expectedBuildSignatureSha256: string | null;
    expectedVersionCode: number | null;
    expectedVersionName: string | null;
  };
  installationPolicy: "INSTALL_IF_MISSING";
  reinstallIfOlder: boolean;
  /** Cloud app URL (e.g., bs://...) if APK was pre-uploaded to BrowserStack */
  cloudAppUrl?: string;
}

export interface ProvisionAppOutput extends CommonNodeOutput {
  runId: string;
  applicationProvisioningOutcome: ProvisionedAppState & {
    appPresenceStatus: "PRESENT" | "MISSING";
  };
}

/**
 * provisionApp orchestrates app provisioning and emits deterministic node output.
 * PURPOSE: Wraps adapter interactions and guarantees SUCCESS/FAILURE outputs for engine transitions.
 */
export async function provisionApp(
  input: ProvisionAppInput,
  packageManagerPort: PackageManagerPort,
  sessionPort: SessionPort,
): Promise<{
  output: ProvisionAppOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "ProvisionApp",
  });

  const stage = {
    current: "check_install" as "check_install" | "uninstall" | "install" | "verify" | "signature",
  };

  const correlationId = `${input.runId}-${input.stepOrdinal ?? 0}-provision`;

  try {
    logger.info("ProvisionApp.started", {
      correlationId,
      descriptor: input.applicationUnderTestDescriptor,
      reinstallIfOlder: input.reinstallIfOlder,
    });

    const packageId = input.applicationUnderTestDescriptor.androidPackageId;
    const apkRef = input.applicationUnderTestDescriptor.apkStorageObjectReference;

    // Lazy initialize Appium session if not already created (deferred from EnsureDevice)
    // Pass app info so UiAutomator2 can start properly with the target app
    logger.info("ProvisionApp.ensureSession", { 
      correlationId,
      cloudAppUrl: input.cloudAppUrl,
      apkRef: apkRef,
    });
    
    // Use cloud URL if available (pre-uploaded to BrowserStack), otherwise use local path
    const appPath = input.cloudAppUrl || apkRef;
    logger.info("ProvisionApp using app path", { appPath, source: input.cloudAppUrl ? "cloud" : "local" });
    
    await sessionPort.ensureDevice({
      appiumServerUrl: input.appiumServerUrl, // From AgentContext (configured via env vars)
      platformName: "Android",
      deviceName: "", // Will be auto-detected from stored context
      platformVersion: "", // Will be auto-detected from stored context
      // CRITICAL: Pass app path so UiAutomator2 can initialize with the app
      app: appPath, // Use cloud URL (bs://...) or local path
      appPackage: packageId,
    });
    logger.info("ProvisionApp.sessionReady", { correlationId });

    const initialPackageInfo = await packageManagerPort.isInstalled(packageId);
    logger.info("ProvisionApp.installCheck", {
      correlationId,
      packageId,
      info: initialPackageInfo,
    });

    let installedJustNow = false;
    let effectivePackageInfo = initialPackageInfo;

    const needsInstall = !initialPackageInfo.installed;
    const needsUpgrade =
      initialPackageInfo.installed &&
      input.reinstallIfOlder &&
      shouldReinstall(initialPackageInfo.versionCode ?? null, input.applicationUnderTestDescriptor);

    if (needsInstall || needsUpgrade) {
      stage.current = needsUpgrade ? "uninstall" : "install";

      if (needsUpgrade) {
        logger.info("ProvisionApp.uninstall-before-upgrade", {
          correlationId,
          packageId,
          installedVersionCode: initialPackageInfo.versionCode ?? null,
        });
        await safeUninstall(packageManagerPort, packageId, correlationId, logger);
      }

      stage.current = "install";
      logger.info("ProvisionApp.install.started", {
        correlationId,
        packageId,
        apkRef,
      });
      await packageManagerPort.installFromObjectStorage(
        apkRef,
        input.applicationUnderTestDescriptor.expectedBuildSignatureSha256 ?? undefined,
      );
      installedJustNow = true;

      stage.current = "verify";
      effectivePackageInfo = await packageManagerPort.isInstalled(packageId);
      logger.info("ProvisionApp.install.verify", {
        correlationId,
        packageId,
        info: effectivePackageInfo,
      });

      if (!effectivePackageInfo.installed) {
        throw new AppNotInstalledError("Package missing after installation");
      }

      if (
        input.applicationUnderTestDescriptor.expectedVersionCode !== null &&
        (effectivePackageInfo.versionCode ?? Number.MIN_SAFE_INTEGER) <
          input.applicationUnderTestDescriptor.expectedVersionCode
      ) {
        throw new InvalidArgumentError("Installed version code is lower than expected");
      }
    }

    stage.current = "signature";
    const signatureStatus = await verifySignature(
      packageManagerPort,
      packageId,
      input.applicationUnderTestDescriptor.expectedBuildSignatureSha256,
      correlationId,
      logger,
    );

    const outcome: ProvisionedAppState & { appPresenceStatus: "PRESENT" } = {
      appPresenceStatus: "PRESENT",
      packageId,
      expectedVersionCode: input.applicationUnderTestDescriptor.expectedVersionCode,
      expectedVersionName: input.applicationUnderTestDescriptor.expectedVersionName,
      installedVersionCode: effectivePackageInfo.versionCode ?? null,
      installedVersionName: effectivePackageInfo.versionName ?? null,
      signatureValidationStatus: signatureStatus,
      installedJustNow,
      lastProvisionedAt: new Date().toISOString(),
    };

    const output: ProvisionAppOutput = {
      runId: input.runId,
      applicationProvisioningOutcome: outcome,
      nodeName: "ProvisionApp",
      stepOrdinal: input.stepOrdinal ?? 1,
      iterationOrdinalNumber: input.iterationOrdinalNumber ?? 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal ?? 1).padStart(3, "0")}`,
      randomSeed: input.randomSeed ?? 0,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    };

    logger.info("ProvisionApp.success", {
      correlationId,
      outcome,
    });

    const events = [
      {
        kind: "agent.app.install_checked" as EventKind,
        payload: {
          correlationId,
          packageId,
          installed: outcome.appPresenceStatus === "PRESENT",
          versionName: outcome.installedVersionName ?? undefined,
          versionCode: outcome.installedVersionCode ?? undefined,
        },
      },
    ];

    return {
      output,
      events,
    };
  } catch (error) {
    const normalized = normalizeProvisionError(error, stage.current);
    logger.error("ProvisionApp.error", {
      correlationId,
      stage: stage.current,
      err: {
        message: normalized.message,
        code: normalized.code,
      },
      retryable: normalized.retryable,
    });

    const failureOutput: ProvisionAppOutput = {
      runId: input.runId,
      applicationProvisioningOutcome: {
        appPresenceStatus: "MISSING",
        packageId: input.applicationUnderTestDescriptor.androidPackageId,
        expectedVersionCode: input.applicationUnderTestDescriptor.expectedVersionCode,
        expectedVersionName: input.applicationUnderTestDescriptor.expectedVersionName,
        installedVersionCode: null,
        installedVersionName: null,
        signatureValidationStatus: "MISMATCHED",
        installedJustNow: false,
        lastProvisionedAt: new Date().toISOString(),
      },
      nodeName: "ProvisionApp",
      stepOrdinal: input.stepOrdinal ?? 1,
      iterationOrdinalNumber: input.iterationOrdinalNumber ?? 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal ?? 1).padStart(3, "0")}`,
      randomSeed: input.randomSeed ?? 0,
      nodeExecutionOutcomeStatus: "FAILURE",
      errorId: normalized.code,
      retryable: normalized.retryable,
      humanReadableFailureSummary: normalized.message,
    };

    const failureEvents = [
      {
        kind: "agent.app.install_checked" as EventKind,
        payload: {
          correlationId,
          packageId: input.applicationUnderTestDescriptor.androidPackageId,
          installed: false,
        },
      },
      {
        kind: "agent.app.launch_failed" as EventKind,
        payload: {
          correlationId,
          packageId: input.applicationUnderTestDescriptor.androidPackageId,
          attempt: 0,
          errorKind: normalized.code,
          durationMs: 0,
        },
      },
    ];

    return {
      output: failureOutput,
      events: failureEvents,
    };
  }
}

function shouldReinstall(
  installedVersionCode: number | null,
  descriptor: ProvisionAppInput["applicationUnderTestDescriptor"],
): boolean {
  if (descriptor.expectedVersionCode === null) {
    return false;
  }
  if (installedVersionCode === null) {
    return true;
  }
  return installedVersionCode < descriptor.expectedVersionCode;
}

async function safeUninstall(
  packageManagerPort: PackageManagerPort,
  packageId: string,
  correlationId: string,
  logger: ReturnType<typeof log.with>,
): Promise<void> {
  try {
    if (packageManagerPort.uninstall) {
      await packageManagerPort.uninstall(packageId);
      logger.info("ProvisionApp.uninstall.completed", { correlationId, packageId });
    } else {
      logger.info("ProvisionApp.uninstall.skipped", {
        correlationId,
        packageId,
        reason: "adapter_missing_uninstall",
      });
    }
  } catch (error) {
    logger.warn("ProvisionApp.uninstall.failed", {
      correlationId,
      packageId,
      err: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}

async function verifySignature(
  packageManagerPort: PackageManagerPort,
  packageId: string,
  expectedSha256: string | null,
  correlationId: string,
  logger: ReturnType<typeof log.with>,
): Promise<SignatureValidationStatus> {
  if (!expectedSha256) {
    logger.info("ProvisionApp.signature.skip", { correlationId, packageId });
    return "MATCHED";
  }

  try {
    const actual = await packageManagerPort.getSignatureSha256(packageId);
    const matched = actual === expectedSha256;
    logger.info("ProvisionApp.signature.result", {
      correlationId,
      packageId,
      expectedSha256,
      actualSha256: actual,
      matched,
    });
    return matched ? "MATCHED" : "MISMATCHED";
  } catch (error) {
    logger.warn("ProvisionApp.signature.failed", {
      correlationId,
      packageId,
      err: { message: error instanceof Error ? error.message : String(error) },
    });
    return "MISMATCHED";
  }
}

function normalizeProvisionError(
  error: unknown,
  stage: string,
): {
  message: string;
  code: string;
  retryable: boolean;
} {
  if (error instanceof TimeoutError) {
    return {
      message: `Timeout during ${stage}: ${error.message}`,
      code: "TimeoutError",
      retryable: true,
    };
  }
  if (error instanceof InvalidArgumentError) {
    return {
      message: `Invalid argument during ${stage}: ${error.message}`,
      code: "InvalidArgumentError",
      retryable: false,
    };
  }
  if (error instanceof AppNotInstalledError) {
    return {
      message: `App not installed after ${stage}: ${error.message}`,
      code: "AppNotInstalledError",
      retryable: true,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name || "UnknownError",
      retryable: true,
    };
  }
  return {
    message: String(error),
    code: "UnknownError",
    retryable: true,
  };
}
