import type { SetupPhaseContext } from "../types";
import type { RunRecord } from "../../../ports/db-ports/run-db.port";

/**
 * Builds SetupPhaseContext from run app config.
 * PURPOSE: Extracts phase-specific config from run record without parsing JSON in registry.
 */
export function buildSetupContext(run: RunRecord): SetupPhaseContext {
  const appConfig = JSON.parse(run.appConfigId) as {
    appiumServerUrl: string;
    packageName: string;
    apkPath: string;
    appActivity?: string;
  };

  return {
    ensureDevice: {
      deviceConfiguration: {
        platformName: "Android",
        deviceName: "Android Device",
        platformVersion: "11.0",
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
}

