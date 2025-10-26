import type { IdleDetectorPort } from "../../../ports/appium/idle-detector.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based idle detector adapter implementing IdleDetectorPort.
 * Detects UI stability/idle state using heuristics.
 */
export class WebDriverIOIdleDetectorAdapter implements IdleDetectorPort {
  constructor(private context: SessionContext) {}

  /**
   * Wait for UI to become idle (no activity detected).
   * 
   * Args:
   *   minQuietMillis: Minimum milliseconds of quiet window required
   *   maxWaitMillis: Maximum milliseconds to wait before timing out
   * 
   * Returns:
   *   Number of milliseconds of quiet window observed
   * 
   * Raises:
   *   TimeoutError: If maxWaitMillis exceeded
   */
  async waitIdle(minQuietMillis: number, maxWaitMillis: number): Promise<number> {
    const startTime = Date.now();
    let lastChangeTime = startTime;
    let lastPageSource = "";

    while (Date.now() - startTime < maxWaitMillis) {
      try {
        const currentPageSource = await this.context.driver.getPageSource();

        if (currentPageSource !== lastPageSource) {
          lastChangeTime = Date.now();
          lastPageSource = currentPageSource;
        }

        const quietWindow = Date.now() - lastChangeTime;
        if (quietWindow >= minQuietMillis) {
          return quietWindow;
        }

        // Small delay before next check
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        if (error instanceof Error && error.message.includes("timeout")) {
          throw new TimeoutError(`Idle detection timed out: ${error.message}`);
        }
        // Continue checking despite errors
      }
    }

    throw new TimeoutError(`UI did not become idle within ${maxWaitMillis}ms`);
  }
}

