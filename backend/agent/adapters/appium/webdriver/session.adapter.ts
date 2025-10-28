import { remote } from "webdriverio";
import type { DeviceRuntimeContext } from "../../../domain/entities";
import type { SessionPort, DeviceConfiguration } from "../../../ports/appium/session.port";
import { DeviceOfflineError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../logging/logger";

/**
 * WebDriver-based session adapter implementing SessionPort.
 * Creates and manages Appium driver sessions using the standalone WebDriver client.
 *
 * PURPOSE:
 * --------
 * Implements SessionPort interface using the thin WebDriver client from WDIO monorepo.
 * Provides direct W3C WebDriver protocol access without WebDriverIO testrunner.
 * Enables deterministic timing and retry control in the domain layer.
 *
 * RESPONSIBILITIES:
 * -----------------
 * - Create/destroy Appium sessions via WebDriver
 * - Map WebDriver exceptions to domain errors
 * - No implicit retries/timeouts (domain controls these)
 * - Return domain types, not SDK types
 *
 * IMMUTABILITY:
 * - Config is frozen at construction
 * - No mutable state except connection handle
 *
 * TIMEOUTS:
 * - Pass-through to WebDriver config
 * - Domain layer enforces budgets via AgentState
 */
export class WebDriverSessionAdapter implements SessionPort {
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
    logger.info("WebDriverSessionAdapter.ensureDevice - Config", { config });

    try {
      // If already connected, return existing context
      if (this.context?.driver) {
        const existingContext = {
          deviceRuntimeContextId: this.context.deviceRuntimeContextId,
          deviceId: config.deviceName,
          capabilitiesEcho: (this.context.capabilities as Record<string, unknown>) || {},
          healthProbeStatus: "HEALTHY" as const,
        };
        logger.info("WebDriverSessionAdapter.ensureDevice - Reusing existing context", {
          existingContext,
        });
        return existingContext;
      }

      logger.info("WebDriverSessionAdapter.ensureDevice - Creating new WebDriver session");

      // Create new WebDriver session
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
      logger.info("WebDriverSessionAdapter.ensureDevice - New session created", { sessionId });

      const capabilities = {
        platformName: config.platformName,
        "appium:deviceName": config.deviceName,
        "appium:platformVersion": config.platformVersion,
        "appium:automationName": "UiAutomator2",
      };

      const deviceRuntimeContextId = `wd-${sessionId}`;

      this.context = {
        driver,
        capabilities,
        deviceRuntimeContextId,
      };

      const newContext = {
        deviceId: config.deviceName,
        capabilitiesEcho: capabilities as Record<string, unknown>,
        healthProbeStatus: "HEALTHY" as const,
        deviceRuntimeContextId,
      };

      logger.info("WebDriverSessionAdapter.ensureDevice - New context", { newContext });
      return newContext;
    } catch (error) {
      logger.error("WebDriverSessionAdapter.ensureDevice - Error", { error });
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
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      nodeName: "EnsureDevice",
    });

    if (!this.context?.driver) {
      throw new DeviceOfflineError("No active session to close");
    }

    try {
      const sessionId = this.context.driver.sessionId;
      await this.context.driver.deleteSession();
      this.context = null;
      logger.info("WebDriverSessionAdapter.closeSession - Session closed", { sessionId });
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
