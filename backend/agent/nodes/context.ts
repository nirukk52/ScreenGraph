import type { AgentContext } from "./types";
import type { RunRecord } from "../ports/db-ports/run-db.port";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

/**
 * Builds AgentContext from run app config.
 * PURPOSE: Extracts node-specific config from run record without parsing JSON in registry.
 */
export function buildAgentContext(run: RunRecord): AgentContext {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: run.runId,
  });
  logger.info("buildAgentContext - RunRecord", { run });

  const appConfig = JSON.parse(run.appConfigId) as {
    appiumServerUrl: string;
    packageName: string;
    apkPath: string;
    appActivity?: string;
    perceiveDelayMs?: number;
    expectedVersionCode?: number;
    expectedVersionName?: string;
    expectedBuildSignatureSha256?: string;
    strategyName?: string;
    policyVersion?: number;
  };

  logger.info("buildAgentContext - Parsed AppConfig", { appConfig });

  const context: AgentContext = {
    ensureDevice: {
      deviceConfiguration: {
        platformName: "Android",
        deviceName: "",
        platformVersion: "",
        appiumServerUrl: appConfig.appiumServerUrl,
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    },
    provisionApp: {
      installationPolicy: "INSTALL_IF_MISSING",
      reinstallIfOlder: true,
      applicationUnderTestDescriptor: {
        androidPackageId: appConfig.packageName,
        apkStorageObjectReference: appConfig.apkPath,
        expectedBuildSignatureSha256: appConfig.expectedBuildSignatureSha256 ?? "default-sha256",
        expectedVersionCode: appConfig.expectedVersionCode ?? null,
        expectedVersionName: appConfig.expectedVersionName ?? null,
      },
    },
    launchOrAttach: {
      applicationUnderTestDescriptor: {
        androidPackageId: appConfig.packageName,
      },
      launchAttachMode: "LAUNCH_OR_ATTACH",
      installOrRestart: "RESTART",
    },
    perceive: {
      captureDirectives: {
        includeScreenshotPng: true,
        includeUiHierarchyXml: true,
        delayBeforeCaptureMs: appConfig.perceiveDelayMs ?? 500,
      },
    },
    waitIdle: {
      idleHeuristicsConfiguration: {
        minQuietMillis: 400,
        maxWaitMillis: 5000,
      },
    },
    policy: {
      switchPolicy: {
        currentStrategyConfiguration: {
          strategyName: appConfig.strategyName ?? "baseline",
          policyVersion: appConfig.policyVersion ?? 1,
        },
        requestedStrategyConfiguration: {
          strategyName: appConfig.strategyName ?? "baseline",
          policyVersion: appConfig.policyVersion ?? 1,
        },
        reasonPlaintext: "Initial splash capture complete",
      },
    },
    terminal: {
      intendedTerminalDisposition: "SUCCEEDED",
      terminalizationBasis: "splash_capture_complete",
    },
  };

  logger.info("buildAgentContext - Built Context", { context });

  return context;
}
