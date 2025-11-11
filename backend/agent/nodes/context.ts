import type { AgentContext } from "./types";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

/**
 * Builds AgentContext from run job configuration.
 * PURPOSE: Extracts node-specific config from job parameters for agent execution.
 */
export function buildAgentContext(params: {
  runId: string;
  appiumServerUrl: string;
  packageName: string;
  apkPath: string;
  appActivity?: string;
}): AgentContext {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: params.runId,
  });
  logger.info("buildAgentContext - Parameters", { params });

  const context: AgentContext = {
    ensureDevice: {
      deviceConfiguration: {
        platformName: "Android",
        deviceName: "",
        platformVersion: "",
        appiumServerUrl: params.appiumServerUrl,
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    },
    provisionApp: {
      installationPolicy: "INSTALL_IF_MISSING",
      reinstallIfOlder: true,
      applicationUnderTestDescriptor: {
        androidPackageId: params.packageName,
        apkStorageObjectReference: params.apkPath,
        expectedBuildSignatureSha256: null, // Skip signature check for local dev
        expectedVersionCode: null,
        expectedVersionName: null,
      },
    },
    launchOrAttach: {
      applicationUnderTestDescriptor: {
        androidPackageId: params.packageName,
      },
      launchAttachMode: "LAUNCH_OR_ATTACH",
      installOrRestart: "RESTART",
    },
    perceive: {
      captureDirectives: {
        includeScreenshotPng: true,
        includeUiHierarchyXml: true,
        delayBeforeCaptureMs: 500,
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
          strategyName: "baseline",
          policyVersion: 1,
        },
        requestedStrategyConfiguration: {
          strategyName: "baseline",
          policyVersion: 1,
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
