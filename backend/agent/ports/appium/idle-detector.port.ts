/**
 * IdleDetectorPort: UI Stability Detection Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for detecting UI stability/idle state.
 * Enables WaitIdleNode to determine when UI has settled.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - None
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface IdleDetectorPort {
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
  waitIdle(minQuietMillis: number, maxWaitMillis: number): Promise<number>;
}
