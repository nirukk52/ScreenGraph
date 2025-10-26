import type { NavigationPort } from "../../../ports/appium/navigation.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based navigation adapter implementing NavigationPort.
 * Performs system-level navigation (back, home) using WebDriverIO.
 */
export class WebDriverIONavigationAdapter implements NavigationPort {
  constructor(private context: SessionContext) {}

  /**
   * Navigate back (hardware or software back button).
   * 
   * Raises:
   *   TimeoutError: If navigation timed out
   */
  async performBack(): Promise<void> {
    try {
      await this.context.driver.back();
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Back navigation timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform back: ${error}`);
    }
  }

  /**
   * Go to home screen.
   * 
   * Raises:
   *   TimeoutError: If navigation timed out
   */
  async pressHome(): Promise<void> {
    try {
      await this.context.driver.pressKeyCode(3); // KEYCODE_HOME
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Home navigation timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to press home: ${error}`);
    }
  }
}

