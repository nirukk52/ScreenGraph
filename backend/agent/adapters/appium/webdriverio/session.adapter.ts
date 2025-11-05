import { remote } from "webdriverio";
import type { DeviceRuntimeContext } from "../../../domain/entities";
import type { SessionPort, DeviceConfiguration } from "../../../ports/appium/session.port";
import { DeviceOfflineError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../logging/logger";

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
 * - Default timeout: 30s for session creation
 * - Max timeout: 60s
 */
export class WebDriverIOSessionAdapter implements SessionPort {
  private context: SessionContext | null = null;
  private readonly timeoutMs: number;
  private readonly maxTimeoutMs: number;

  constructor(timeoutMs = 20000, maxTimeoutMs = 30000) {
    this.timeoutMs = Math.min(timeoutMs, maxTimeoutMs);
    this.maxTimeoutMs = maxTimeoutMs;
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
    if (this.context?.driver && this.context.driver.sessionId) {
      logger.info("Session already initialized, reusing", { 
        sessionId: this.context.driver.sessionId 
      });
      return this.context;
    }

    // Use config values, letting Appium handle device detection if empty
    const deviceName = config.deviceName || "";
    const platformVersion = config.platformVersion || "";
    const platformName = config.platformName;

    logger.info("Creating Appium session", {
      deviceName: deviceName || "(auto-detect)",
      platformVersion: platformVersion || "(auto-detect)",
      platformName,
    });

    try {
      // Create new WebDriverIO session - Appium handles device detection
      const driver = await remote({
        hostname: this.extractHostname(config.appiumServerUrl),
        port: this.extractPort(config.appiumServerUrl),
        path: "/",
        capabilities: {
          platformName,
          "appium:automationName": "UiAutomator2",
          // Let Appium detect device if not provided
          ...(deviceName && { "appium:deviceName": deviceName }),
          ...(platformVersion && { "appium:platformVersion": platformVersion }),
          // App context (if provided)
          ...(config.app && { "appium:app": config.app }),
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
      throw new DeviceOfflineError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
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
      const errorDetails = error instanceof Error 
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
      throw new DeviceOfflineError(`Failed to ensure device: ${error instanceof Error ? error.message : String(error)}`);
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
      return parsed.port ? Number.parseInt(parsed.port, 10) : 4723;
    } catch {
      return 4723;
    }
  }
}
