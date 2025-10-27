import type { SetupPhaseContext } from "../types";
import type { RunRecord } from "../../../ports/db-ports/run-db.port";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../logging/logger";

/**
 * Builds SetupPhaseContext from run app config.
 * PURPOSE: Extracts phase-specific config from run record without parsing JSON in registry.
 */
export function buildSetupContext(run: RunRecord): SetupPhaseContext {
  const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.ORCHESTRATOR, runId: run.runId });
  logger.info("buildSetupContext - RunRecord", { run });
  
  const appConfig = JSON.parse(run.appConfigId) as {
    appiumServerUrl: string;
    packageName: string;
    apkPath: string;
    appActivity?: string;
  };
  
  logger.info("buildSetupContext - Parsed AppConfig", { appConfig });

  const context: SetupPhaseContext = {
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
  };
  
  logger.info("buildSetupContext - Built Context", { context });
  
  return context;
}

