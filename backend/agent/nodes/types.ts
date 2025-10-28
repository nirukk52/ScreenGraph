import type { DeviceConfiguration } from "../ports/appium/session.port";
import type { SessionPort } from "../ports/appium/session.port";
import type { AppLifecyclePort } from "../ports/appium/app-lifecycle.port";
import type { IdleDetectorPort } from "../ports/appium/idle-detector.port";
import type { PackageManagerPort } from "../ports/appium/package-manager.port";

/**
 * AgentNodeName enumerates all nodes available in the agent execution graph.
 * PURPOSE: Drives typed routing for node execution and transitions across all phases.
 */
export type AgentNodeName =
  | "EnsureDevice"
  | "ProvisionApp"
  | "LaunchOrAttach"
  | "WaitIdle"
  | "Perceive"
  | "SwitchPolicy"
  | "RestartApp";

/**
 * AgentContext captures all configuration inputs needed by nodes across the agent graph.
 * PURPOSE: Supplies non-state inputs (e.g., device config, APK descriptor) without encoding phase boundaries.
 */
export interface AgentContext {
  ensureDevice: {
    deviceConfiguration: DeviceConfiguration;
    driverReusePolicy: "REUSE_OR_CREATE";
  };
  provisionApp: {
    installationPolicy: "INSTALL_IF_MISSING";
    reinstallIfOlder: boolean;
    applicationUnderTestDescriptor: {
      androidPackageId: string;
      apkStorageObjectReference: string;
      expectedBuildSignatureSha256: string | null;
      expectedVersionCode: number | null;
      expectedVersionName: string | null;
    };
  };
  launchOrAttach: {
    applicationUnderTestDescriptor: {
      androidPackageId: string;
    };
    launchAttachMode: "LAUNCH_OR_ATTACH";
  };
  waitIdle: {
    idleHeuristicsConfiguration: {
      minQuietMillis: number;
      maxWaitMillis: number;
    };
  };
}

/**
 * AgentPorts encapsulates external side-effectful adapters required by agent nodes.
 * PURPOSE: Centralizes allowed IO (e.g., Appium session) for dependency injection across nodes.
 */
export interface AgentPorts {
  sessionPort: SessionPort;
  appLifecyclePort: AppLifecyclePort;
  idleDetectorPort: IdleDetectorPort;
  packageManagerPort: PackageManagerPort;
}
