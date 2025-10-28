import type { IdleDetectorPort } from "../../../ports/appium/idle-detector.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based idle detector adapter implementing IdleDetectorPort.
 * Detects UI stability/idle state using page source change heuristics.
 *
 * PURPOSE:
 * --------
 * Implements IdleDetectorPort using simple page source polling.
 * Domain layer controls all timing budgets; no implicit waits in adapter.
 */
export class WebDriverIdleDetectorAdapter implements IdleDetectorPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Wait for UI to become idle by detecting stable page source.
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

        // Small delay before next check (domain controls timing)
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
