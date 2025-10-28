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
 *
 * IMMUTABILITY:
 * - Config is frozen at construction
 * - No mutable state except connection handle
 *
 * TIMEOUTS:
 * - All operations have bounded timeouts (default 10s, max 30s)
 */
export class WebDriverIOSessionAdapter implements SessionPort {
  private context: SessionContext | null = null;
  private readonly timeoutMs: number;
  private readonly maxTimeoutMs: number;

  constructor(timeoutMs = 10000, maxTimeoutMs = 30000) {
    this.timeoutMs = Math.min(timeoutMs, maxTimeoutMs);
    this.maxTimeoutMs = maxTimeoutMs;
  }

  /**
   * Get the current session context.
   *
   * Returns:
   *   SessionContext with driver and capabilities, or null if not connected
   */
  getContext(): SessionContext | null {
    return this.context;
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
    logger.info("WebDriverIOSessionAdapter.ensureDevice - Config", { config });

    try {
      // If already connected, return existing context
      if (this.context?.driver) {
        const sessionId = this.context.driver.sessionId || "unknown";
        const existingContext = {
          deviceRuntimeContextId: this.context.deviceRuntimeContextId,
          deviceId: config.deviceName,
          capabilitiesEcho: (this.context.capabilities as Record<string, unknown>) || {},
          healthProbeStatus: "HEALTHY" as const,
        };
        logger.info("WebDriverIOSessionAdapter.ensureDevice - Reusing existing context", {
          existingContext,
        });
        return existingContext;
      }

      logger.info("WebDriverIOSessionAdapter.ensureDevice - Creating new WebDriverIO session");

      // Create new WebDriverIO session
      const driver = await remote({
        hostname: this.extractHostname(config.appiumServerUrl),
        port: this.extractPort(config.appiumServerUrl),
        path: "/",
        capabilities: {
          platformName: config.platformName,
          "appium:deviceName": config.deviceName,
          "appium:platformVersion": config.platformVersion,
          "appium:automationName": "UiAutomator2",
          "appium:noReset": true,
          "appium:fullReset": false,
          "appium:autoGrantPermissions": true,
          "appium:ignoreHiddenApiPolicyError": true,
          "appium:disableWindowAnimation": true,
        },
        connectionRetryCount: 5,
        connectionRetryTimeout: this.timeoutMs,
      });
      const sessionId = driver.sessionId || "unknown";
      logger.info("WebDriverIOSessionAdapter.ensureDevice - New session created", { sessionId });

      const capabilities = {
        platformName: config.platformName,
        "appium:deviceName": config.deviceName,
        "appium:platformVersion": config.platformVersion,
        "appium:automationName": "UiAutomator2",
      };

      const deviceRuntimeContextId = `wdio-${sessionId}`;

      this.context = {
        driver,
        capabilities,
        deviceRuntimeContextId,
      };

      const newContext = {
        deviceRuntimeContextId,
        deviceId: config.deviceName,
        capabilitiesEcho: capabilities as Record<string, unknown>,
        healthProbeStatus: "HEALTHY" as const,
      };

      logger.info("WebDriverIOSessionAdapter.ensureDevice - New context", { newContext });
      return newContext;
    } catch (error) {
      logger.error("WebDriverIOSessionAdapter.ensureDevice - Error", { error });
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("ECONNRESET")) {
          throw new DeviceOfflineError(`Cannot connect to device: ${error.message}`);
        }
        if (error.message.includes("timeout")) {
          throw new TimeoutError(`Connection timeout: ${error.message}`);
        }
      }
      throw new DeviceOfflineError(`Failed to ensure device: ${error}`);
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
