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
      applicationUnderTestDescriptor: {
        androidPackageId: appConfig.packageName,
        apkStorageObjectReference: appConfig.apkPath,
        expectedBuildSignatureSha256: "default-sha256",
      },
    },
    launchOrAttach: {
      applicationUnderTestDescriptor: {
        androidPackageId: appConfig.packageName,
      },
      launchAttachMode: "LAUNCH_OR_ATTACH",
    },
    waitIdle: {
      idleHeuristicsConfiguration: {
        minQuietMillis: 400,
        maxWaitMillis: 5000,
      },
    },
  };

  logger.info("buildAgentContext - Built Context", { context });

  return context;
}
