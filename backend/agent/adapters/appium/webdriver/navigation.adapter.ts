import type { NavigationPort } from "../../../ports/appium/navigation.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based navigation adapter implementing NavigationPort.
 * Performs system-level navigation (back, home) using W3C WebDriver commands.
 *
 * PURPOSE:
 * --------
 * Implements NavigationPort using W3C commands and Appium mobile extensions.
 * Direct protocol access without WebDriverIO helper methods.
 */
export class WebDriverNavigationAdapter implements NavigationPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Navigate back (hardware or software back button) using W3C command.
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
   * Go to home screen using Appium mobile extension (Android KEYCODE_HOME = 3).
   *
   * Raises:
   *   TimeoutError: If navigation timed out
   */
  async pressHome(): Promise<void> {
    try {
      // Android keycode 3 = KEYCODE_HOME
      await this.context.driver.execute("mobile: pressKey", { keycode: 3 });
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Home navigation timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to press home: ${error}`);
    }
  }
}
