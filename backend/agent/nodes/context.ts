import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../logging/logger";
import {
  BROWSERSTACK_ACCESS_KEY,
  BROWSERSTACK_HUB_URL,
  BROWSERSTACK_USERNAME,
} from "../../config/env";
import type { AgentContext } from "./types";
import { BrowserStackAppUploadAdapter } from "../adapters/browserstack/app-upload.adapter";

/**
 * Builds AgentContext from run job configuration.
 * PURPOSE: Extracts node-specific config from job parameters for agent execution.
 * NOTE: Appium URL always comes from backend env vars (BROWSERSTACK_* or fallback to localhost).
 * If BrowserStack is configured, pre-uploads APK to avoid session creation failures.
 * In CI environments, APK pre-upload is skipped to avoid timeouts.
 */
export async function buildAgentContext(params: {
  runId: string;
  packageName: string;
  apkPath: string;
  appActivity?: string;
}): Promise<AgentContext> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: params.runId,
  });
  logger.info("buildAgentContext - Parameters", { params });

  // ALWAYS use backend env vars for Appium URL (never trust frontend input)
  let appiumServerUrl: string;
  let cloudAppUrl: string | undefined;
  const isCI = process.env.CI === "true";
  
  if (BROWSERSTACK_USERNAME && BROWSERSTACK_ACCESS_KEY) {
    const url = new URL(BROWSERSTACK_HUB_URL);
    url.username = BROWSERSTACK_USERNAME;
    url.password = BROWSERSTACK_ACCESS_KEY;
    appiumServerUrl = url.toString();
    logger.info("Using BrowserStack for device management", { hub: BROWSERSTACK_HUB_URL, isCI });

    // Pre-upload APK to BrowserStack (required for session creation)
    // Skip in CI to avoid timeouts - tests use pre-uploaded APKs instead
    if (!isCI) {
      logger.info("Pre-uploading APK to BrowserStack", { apkPath: params.apkPath });
      try {
        const uploader = new BrowserStackAppUploadAdapter(
          BROWSERSTACK_USERNAME,
          BROWSERSTACK_ACCESS_KEY,
        );
        const uploadResult = await uploader.uploadApp(params.apkPath);
        cloudAppUrl = uploadResult.cloudUrl;
        logger.info("APK pre-uploaded successfully", { 
          cloudUrl: cloudAppUrl,
          customId: uploadResult.customId,
        });
      } catch (uploadErr) {
        logger.error("Failed to pre-upload APK to BrowserStack", {
          error: uploadErr instanceof Error ? uploadErr.message : String(uploadErr),
          apkPath: params.apkPath,
        });
        throw uploadErr;
      }
    } else {
      logger.info("Skipping APK pre-upload in CI environment");
    }
  } else {
    // Fallback to localhost for local development
    appiumServerUrl = "http://127.0.0.1:4723/";
    logger.warn("BrowserStack credentials not configured, using localhost Appium", {
      url: appiumServerUrl,
    });
  }

  const context: AgentContext = {
    ensureDevice: {
      deviceConfiguration: {
        platformName: "Android",
        deviceName: "",
        platformVersion: "",
        appiumServerUrl,
      },
      driverReusePolicy: "REUSE_OR_CREATE",
      cloudAppUrl, // Pass pre-uploaded cloud URL to EnsureDevice
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
      cloudAppUrl, // Pass pre-uploaded cloud URL to ProvisionApp (skip re-upload)
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
