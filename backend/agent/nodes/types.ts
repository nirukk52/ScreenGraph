import type { DeviceConfiguration } from "../ports/appium/session.port";
import type { SessionPort } from "../ports/appium/session.port";
import type { AppLifecyclePort } from "../ports/appium/app-lifecycle.port";
import type { IdleDetectorPort } from "../ports/appium/idle-detector.port";
import type { PackageManagerPort } from "../ports/appium/package-manager.port";
import type { PerceptionPort } from "../ports/appium/perception.port";
import type { DeviceInfoPort } from "../ports/appium/device-info.port";
import type { StoragePort } from "../ports/storage";
import type { LLMPort } from "../ports/llm";

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
  | "ChooseAction"
  | "SwitchPolicy"
  | "RestartApp"
  | "Stop";

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
    installOrRestart: "INSTALL" | "RESTART";
  };
  perceive: {
    captureDirectives: {
      includeScreenshotPng: boolean;
      includeUiHierarchyXml: boolean;
      delayBeforeCaptureMs: number;
    };
  };
  waitIdle: {
    idleHeuristicsConfiguration: {
      minQuietMillis: number;
      maxWaitMillis: number;
    };
  };
  policy: {
    switchPolicy: {
      currentStrategyConfiguration: {
        strategyName: string;
        policyVersion: number;
      };
      requestedStrategyConfiguration: {
        strategyName: string;
        policyVersion: number;
      };
      reasonPlaintext: string;
    };
  };
  terminal: {
    intendedTerminalDisposition: "SUCCEEDED" | "FAILED";
    terminalizationBasis: string;
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
  perceptionPort: PerceptionPort;
  deviceInfoPort: DeviceInfoPort;
  storagePort: StoragePort;
  llmPort: LLMPort;
}
