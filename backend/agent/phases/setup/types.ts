import type { DeviceConfiguration } from "../../ports/appium/session.port";

/**
 * SetupPhaseContext captures the configuration inputs needed by setup nodes.
 * PURPOSE: Supplies non-state inputs (e.g., device config, APK descriptor) to setup phase.
 */
export interface SetupPhaseContext {
  ensureDevice: {
    deviceConfiguration: DeviceConfiguration;
    driverReusePolicy: "REUSE_OR_CREATE";
  };
  provisionApp: {
    installationPolicy: "INSTALL_IF_MISSING";
    applicationUnderTestDescriptor: {
      androidPackageId: string;
      apkStorageObjectReference: string;
      expectedBuildSignatureSha256: string;
    };
  };
}

/**
 * SetupPhasePorts encapsulates external side-effectful adapters required by setup nodes.
 * PURPOSE: Centralizes allowed IO (e.g., Appium session) for dependency injection.
 */
export interface SetupPhasePorts {
  sessionPort: {
    ensureDevice(config: DeviceConfiguration): Promise<unknown>;
  };
}

/**
 * SetupNodeName enumerates the setup phase nodes.
 * PURPOSE: Drives typed routing for setup node execution and transitions.
 */
export type SetupNodeName = "EnsureDevice" | "ProvisionApp" | "LaunchOrAttach" | "WaitIdle";

