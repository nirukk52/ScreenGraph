/**
 * DeviceInfoPort: Device State Query Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for querying device information (screen size, readiness).
 * Enables device capability checks and screen dimension queries.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - None (basic DTOs defined inline)
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface DeviceInfoPort {
  /**
   * Get current screen size in pixels.
   *
   * Returns:
   *   Object with widthPx and heightPx
   *
   * Raises:
   *   TimeoutError: If query timed out
   */
  getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }>;

  /**
   * Check if device is connected and responsive.
   *
   * Returns:
   *   True if device is ready, False otherwise
   *
   * Raises:
   *   DeviceOfflineError: If device is permanently offline
   */
  isDeviceReady(): Promise<boolean>;
}
