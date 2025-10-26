import type { DeviceInfoPort } from "../../../ports/appium/device-info.port";
import { DeviceOfflineError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based device info adapter implementing DeviceInfoPort.
 * Queries device information (screen size, readiness) using WebDriverIO.
 */
export class WebDriverIODeviceInfoAdapter implements DeviceInfoPort {
  constructor(private context: SessionContext) {}

  /**
   * Get current screen size in pixels.
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
   * Check if device is connected and responsive.
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
      if (error instanceof Error && (error.message.includes("ECONNREFUSED") || error.message.includes("ECONNRESET"))) {
        throw new DeviceOfflineError(`Device is offline: ${error.message}`);
      }
      return false;
    }
  }
}

