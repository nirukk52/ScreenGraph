import type { ScreenshotData, UiHierarchyData } from "../../../domain/perception";
import type { PerceptionPort } from "../../../ports/appium/perception.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based perception adapter implementing PerceptionPort.
 * Captures screenshots and UI hierarchy using W3C WebDriver commands.
 *
 * PURPOSE:
 * --------
 * Implements PerceptionPort using W3C WebDriver commands for UI capture.
 * Returns raw data (domain will handle storage/lazy loading of artifacts in MVP).
 */
export class WebDriverPerceptionAdapter implements PerceptionPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Capture a full-screen screenshot using W3C command.
   *
   * Returns:
   *   ScreenshotData with base64 PNG image and dimensions
   *
   * Raises:
   *   TimeoutError: If capture timed out
   */
  async captureScreenshot(): Promise<ScreenshotData> {
    try {
      const screenshot = await this.context.driver.takeScreenshot();
      const size = await this.context.driver.getWindowSize();

      return {
        base64Image: screenshot,
        format: "png",
        widthPx: size.width,
        heightPx: size.height,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new TimeoutError(`Screenshot capture timed out: ${error.message}`);
        }
        if (error.message.includes("ECONNREFUSED") || error.message.includes("ECONNRESET")) {
          throw new Error(`Device offline: ${error.message}`);
        }
      }
      throw new TimeoutError(`Failed to capture screenshot: ${error}`);
    }
  }

  /**
   * Capture UI hierarchy as XML using W3C command.
   *
   * Returns:
   *   UiHierarchyData with XML string and capture timestamp
   *
   * Raises:
   *   TimeoutError: If capture timed out
   */
  async dumpUiHierarchy(): Promise<UiHierarchyData> {
    try {
      const pageSource = await this.context.driver.getPageSource();
      const captureTimestampMs = Date.now();

      return {
        xmlContent: pageSource,
        captureTimestampMs,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Page source capture timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to dump UI hierarchy: ${error}`);
    }
  }
}
