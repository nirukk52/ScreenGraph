import log from "encore.dev/log";
import { remote } from "webdriverio";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { DeviceRuntimeContext } from "../../../domain/entities";
import type { DeviceConfiguration, SessionPort } from "../../../ports/appium/session.port";
import type { CloudStoragePort } from "../../../ports/cloud-storage.port";
import { BrowserStackAppUploadAdapter } from "../../browserstack/app-upload.adapter";
import { DeviceOfflineError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

interface RemoteOptions {
  hostname: string;
  port: number;
  path: string;
  capabilities: Record<string, unknown>;
  connectionRetryCount?: number;
  connectionRetryTimeout?: number;
  logLevel?: string;
}

/**
 * WebDriverIO-based session adapter implementing SessionPort.
 * Creates and manages Appium driver sessions using WebDriverIO.
 *
 * PURPOSE:
 * --------
 * Implements SessionPort interface using WebDriverIO WebDriver.
 * Wraps existing Appium tooling and maps to clean architecture contracts.
 *
 * RESPONSIBILITIES:
 * -----------------
 * - Implement all SessionPort methods
 * - Map WebDriverIO exceptions to domain errors
 * - Add retry logic for transient failures
 * - Return domain types, not SDK types
 * - Lazy session initialization (defer until app context is available)
 *
 * IMMUTABILITY:
 * - Config is frozen at construction
 * - No mutable state except connection handle
 *
 * TIMEOUTS:
 * - Default timeout: 60s for BrowserStack (typically completes in ~40s)
 * - Max timeout: 90s for edge cases
 */
export class WebDriverIOSessionAdapter implements SessionPort {
  private context: SessionContext | null = null;
  private readonly timeoutMs: number;
  private readonly maxTimeoutMs: number;
  private cloudStoragePort: CloudStoragePort | null = null;

  constructor(
    timeoutMs = 60000, // 60s sufficient for BrowserStack (typically ~40s)
    maxTimeoutMs = 90000, // 90s max for slow provisioning edge cases
    cloudStoragePort?: CloudStoragePort,
  ) {
    this.timeoutMs = Math.min(timeoutMs, maxTimeoutMs);
    this.maxTimeoutMs = maxTimeoutMs;
    this.cloudStoragePort = cloudStoragePort || null;
  }

  /**
   * Get the current session context synchronously.
   *
   * Returns:
   *   SessionContext with driver and capabilities, or null if not connected
   */
  getContext(): SessionContext | null {
    return this.context;
  }

  /**
   * Lazily initialize the Appium session if not already created.
   *
   * PURPOSE:
   * --------
   * Create the actual WebDriverIO session on first use (not during EnsureDevice).
   * Defers session creation until app context is available in ProvisionApp.
   *
   * Args:
   *   config: Device configuration (needed for session creation)
   *
   * Returns:
   *   SessionContext with active WebDriverIO driver
   *
   * Raises:
   *   DeviceOfflineError: If session creation fails
   *   TimeoutError: If session creation times out
   */
  private async ensureSessionInitialized(config: DeviceConfiguration): Promise<SessionContext> {
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
    });

    // If we already have a real driver, return existing context
    if (this.context?.driver?.sessionId) {
      logger.info("Session already initialized, reusing", {
        sessionId: this.context.driver.sessionId,
      });
      return this.context;
    }

    // Use config values, letting Appium handle device detection if empty
    const deviceName = config.deviceName || "";
    const platformVersion = config.platformVersion || "";
    const platformName = config.platformName;
    
    // BrowserStack requires deviceName capability even if empty
    // Use default device name for BrowserStack (must match their device inventory)
    const isBrowserStack = config.appiumServerUrl.includes("browserstack.com");
    // Use Samsung Galaxy S20 (verified available via BrowserStack devices API)
    const effectiveDeviceName = deviceName || (isBrowserStack ? "Samsung Galaxy S20" : "");
    const effectivePlatformVersion = platformVersion || (isBrowserStack ? "10.0" : "");

    logger.info("Creating Appium session", {
      deviceName: effectiveDeviceName || "(auto-detect)",
      platformVersion: effectivePlatformVersion || "(auto-detect)",
      platformName,
      isBrowserStack,
    });

    try {
      // Handle BrowserStack app upload if needed
      let effectiveAppPath = config.app;
      if (
        isBrowserStack &&
        config.app &&
        !config.app.startsWith("bs://") &&
        !config.app.startsWith("http")
      ) {
        logger.info("Local app detected for BrowserStack, uploading...", {
          localPath: config.app,
        });

        // Initialize cloudStoragePort if not provided
        if (!this.cloudStoragePort) {
          const username = this.extractUsername(config.appiumServerUrl);
          const password = this.extractPassword(config.appiumServerUrl);
          if (username && password) {
            this.cloudStoragePort = new BrowserStackAppUploadAdapter(username, password);
            logger.info("Initialized BrowserStack upload adapter");
          } else {
            throw new Error(
              "BrowserStack credentials not found in URL. Cannot upload app.",
            );
          }
        }

        // Upload app to BrowserStack
        const uploadResult = await this.cloudStoragePort.uploadApp(config.app);
        effectiveAppPath = uploadResult.cloudUrl;

        logger.info("App uploaded to BrowserStack", {
          cloudUrl: effectiveAppPath,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        });
      }

      // Create new WebDriverIO session - BrowserStack handles device provisioning
      const username = this.extractUsername(config.appiumServerUrl);
      const password = this.extractPassword(config.appiumServerUrl);
      
      const driver = await remote({
        hostname: this.extractHostname(config.appiumServerUrl),
        port: this.extractPort(config.appiumServerUrl),
        path: this.extractPath(config.appiumServerUrl),
        protocol: this.extractProtocol(config.appiumServerUrl),
        // BrowserStack/Sauce Labs/etc require credentials as separate fields
        ...(username && { user: username }),
        ...(password && { key: password }),
        capabilities: {
          platformName,
          "appium:automationName": "UiAutomator2",
          // BrowserStack requires deviceName
          ...(effectiveDeviceName && { "appium:deviceName": effectiveDeviceName }),
          ...(effectivePlatformVersion && { "appium:platformVersion": effectivePlatformVersion }),
          // App context (use uploaded cloud URL if BrowserStack)
          ...(effectiveAppPath && { "appium:app": effectiveAppPath }),
          ...(config.appPackage && { "appium:appPackage": config.appPackage }),
          // Session behavior
          "appium:noReset": true,
          "appium:fullReset": false,
          "appium:autoGrantPermissions": true,
          "appium:ignoreHiddenApiPolicyError": true,
          "appium:disableWindowAnimation": true,
        },
        connectionRetryCount: 3,
        connectionRetryTimeout: this.timeoutMs,
        logLevel: "info",
      });

      const sessionId = driver.sessionId || "unknown";
      logger.info("Appium session created successfully", { sessionId });

      const capabilities = {
        platformName,
        "appium:automationName": "UiAutomator2",
        ...(deviceName && { "appium:deviceName": deviceName }),
        ...(platformVersion && { "appium:platformVersion": platformVersion }),
      };

      const deviceRuntimeContextId = `wdio-${sessionId}`;

      this.context = {
        driver,
        capabilities,
        deviceRuntimeContextId,
      };

      return this.context;
    } catch (error) {
      logger.error("Failed to create Appium session", {
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("timeout")) {
          throw new TimeoutError(`Session creation timeout: ${error.message}`);
        }
      }
      throw new DeviceOfflineError(
        `Failed to create session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure device is connected and ready.
   * Creates a new Appium session if one doesn't exist.
   *
   * Args:
   *   config: Device configuration (platform, device name, Appium server URL)
   *
   * Returns:
   *   DeviceRuntimeContext with session ID and device capabilities
   *
   * Raises:
   *   DeviceOfflineError: If device is permanently offline
   *   TimeoutError: If connection timeout exceeded
   */
  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext> {
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      nodeName: "EnsureDevice",
    });
    logger.info("WebDriverIOSessionAdapter.ensureDevice", { config });

    try {
      // If we already have a real driver, return existing context
      if (this.context?.driver?.sessionId) {
        const sessionId = this.context.driver.sessionId;
        logger.info("Reusing existing session", { sessionId });
        return {
          deviceRuntimeContextId: this.context.deviceRuntimeContextId,
          deviceId: config.deviceName || "auto-detected",
          capabilitiesEcho: (this.context.capabilities as Record<string, unknown>) || {},
          healthProbeStatus: "HEALTHY" as const,
        };
      }

      // If context exists but driver is null, initialize session now (lazy initialization)
      if (this.context?.driver === null || (this.context && !this.context.driver.sessionId)) {
        logger.info("Lazy initialization: creating Appium session");
        await this.ensureSessionInitialized(config);

        if (!this.context) {
          throw new DeviceOfflineError("Session initialization failed");
        }

        return {
          deviceRuntimeContextId: this.context.deviceRuntimeContextId,
          deviceId: config.deviceName || "auto-detected",
          capabilitiesEcho: this.context.capabilities as Record<string, unknown>,
          healthProbeStatus: "HEALTHY" as const,
        };
      }

      // First call: return lightweight context without creating session yet
      // Session will be created later when ProvisionApp calls ensureDevice() again
      logger.info("Deferring session creation until app context is available");

      const deviceRuntimeContextId = `pending-${Date.now()}`;

      // Store minimal context for later
      const capabilities = {
        platformName: config.platformName,
        "appium:automationName": "UiAutomator2",
      };

      this.context = {
        driver: null as unknown as WebdriverIO.Browser, // Will be created later
        capabilities,
        deviceRuntimeContextId,
      };

      return {
        deviceRuntimeContextId,
        deviceId: config.deviceName || "auto-detect",
        capabilitiesEcho: capabilities as Record<string, unknown>,
        healthProbeStatus: "HEALTHY" as const,
      };
    } catch (error) {
      const errorDetails =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error);

      logger.error("ensureDevice failed", { error: errorDetails, config });

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("econnrefused") || errorMsg.includes("econnreset")) {
          throw new DeviceOfflineError(`Cannot connect to Appium server: ${error.message}`);
        }
        if (errorMsg.includes("timeout") || error.name === "TimeoutError") {
          throw new TimeoutError(`Connection timeout: ${error.message}`);
        }
      }
      throw new DeviceOfflineError(
        `Failed to ensure device: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Close the current driver session.
   * Cleans up resources and releases the device connection.
   *
   * Raises:
   *   DeviceOfflineError: If driver is already disconnected
   */
  async closeSession(): Promise<void> {
    if (!this.context?.driver) {
      throw new DeviceOfflineError("No active session to close");
    }

    try {
      await this.context.driver.deleteSession();
      this.context = null;
    } catch (error) {
      throw new DeviceOfflineError(`Failed to close session: ${error}`);
    }
  }

  /**
   * Extract hostname from Appium server URL.
   */
  private extractHostname(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return "localhost";
    }
  }

  /**
   * Extract port from Appium server URL.
   */
  private extractPort(url: string): number {
    try {
      const parsed = new URL(url);
      if (parsed.port) {
        return Number.parseInt(parsed.port, 10);
      }
      // Default ports based on protocol
      return parsed.protocol === "https:" ? 443 : 4723;
    } catch {
      return 4723;
    }
  }

  /**
   * Extract path from Appium server URL.
   */
  private extractPath(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname || "/wd/hub";
    } catch {
      return "/wd/hub";
    }
  }

  /**
   * Extract protocol from Appium server URL.
   */
  private extractProtocol(url: string): "http" | "https" {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" ? "https" : "http";
    } catch {
      return "http";
    }
  }

  /**
   * Extract username from Appium server URL (for cloud providers like BrowserStack).
   */
  private extractUsername(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      return parsed.username || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract password from Appium server URL (for cloud providers like BrowserStack).
   */
  private extractPassword(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      return parsed.password || undefined;
    } catch {
      return undefined;
    }
  }
}
