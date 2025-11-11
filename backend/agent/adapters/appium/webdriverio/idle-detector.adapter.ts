import type { IdleDetectorPort } from "../../../ports/appium/idle-detector.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based idle detector adapter implementing IdleDetectorPort.
 * Detects UI stability/idle state using heuristics.
 */
export class WebDriverIOIdleDetectorAdapter implements IdleDetectorPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Wait for UI to become idle (no activity detected).
   *
   * TEMPORARY FIX: Hardcoded 2-second delay to allow UI to settle before transition.
   * TODO: Replace with proper stability detection when UI heuristics are available.
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
    // HARDCODED: Wait exactly 2 seconds then proceed to Stop node
    const IDLE_WAIT_MS = 2000;
    console.log(`[IDLE DETECTOR] START waitIdle (2s hardcoded)`);
    await new Promise((resolve) => setTimeout(resolve, IDLE_WAIT_MS));
    console.log(`[IDLE DETECTOR] COMPLETE waitIdle (returning ${IDLE_WAIT_MS}ms)`);
    return IDLE_WAIT_MS;
  }
}
