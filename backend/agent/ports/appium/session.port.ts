import type { DeviceRuntimeContext } from "../../domain/entities";

export interface DeviceConfiguration {
  platformName: string;
  deviceName: string;
  platformVersion: string;
  appiumServerUrl: string;
  // Optional app context for session initialization
  app?: string;         // Path to APK file
  appPackage?: string;  // Android package ID
}

/**
 * SessionPort: Device Connection and Session Management Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for establishing and managing Appium driver sessions.
 * Enables EnsureDeviceNode to create device connections.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - domain types (DeviceConfiguration, DeviceRuntimeContext)
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 * - NO network/socket code
 */
export interface SessionPort {
  /**
   * Ensure device is connected and ready.
   * Creates a new Appium session if one doesn't exist.
   *
   * Args:
   *   config: Device configuration (platform, device name, Appium server URL)
   *
   * Returns:
   *   DeviceRuntimeContext with session ID and device capabilities
   *
   * Raises:
   *   DeviceOfflineError: If device is permanently offline
   *   TimeoutError: If connection timeout exceeded
   */
  ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext>;

  /**
   * Close the current driver session.
   * Cleans up resources and releases the device connection.
   *
   * Raises:
   *   DeviceOfflineError: If driver is already disconnected
   */
  closeSession(): Promise<void>;
}
