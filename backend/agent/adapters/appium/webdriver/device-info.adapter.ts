import type { DeviceInfoPort } from "../../../ports/appium/device-info.port";
import { DeviceOfflineError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based device info adapter implementing DeviceInfoPort.
 * Queries device information (screen size, readiness) using W3C WebDriver commands.
 *
 * PURPOSE:
 * --------
 * Implements DeviceInfoPort using W3C WebDriver commands for device state queries.
 * Enables screen dimension checks and device health verification.
 */
export class WebDriverDeviceInfoAdapter implements DeviceInfoPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Get current screen size in pixels using W3C command.
   *
   * Returns:
   *   Object with widthPx and heightPx
   *
   * Raises:
   *   TimeoutError: If query timed out
   */
  async getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }> {
    try {
      const size = await this.context.driver.getWindowSize();
      return {
        widthPx: size.width,
        heightPx: size.height,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Screen size query timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to get screen dimensions: ${error}`);
    }
  }

  /**
   * Check if device is connected and responsive using page source health check.
   *
   * Returns:
   *   True if device is ready, False otherwise
   *
   * Raises:
   *   DeviceOfflineError: If device is permanently offline
   */
  async isDeviceReady(): Promise<boolean> {
    try {
      // Try to get current context as a health check
      await this.context.driver.getPageSource();
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("ECONNREFUSED") || error.message.includes("ECONNRESET"))
      ) {
        throw new DeviceOfflineError(`Device is offline: ${error.message}`);
      }
      return false;
    }
  }
}
