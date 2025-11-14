/**
 * PackageManagerPort: APK Installation and Signature Verification Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for checking package presence, installing APKs, and verifying signatures.
 * Enables ProvisionApp node to prepare apps for launch.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - None (basic types)
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */

export interface PackageInfo {
  installed: boolean;
  versionName?: string;
  versionCode?: number;
}

export interface PackageManagerPort {
  /**
   * Check if a package is installed on the device.
   *
   * Args:
   *   packageId: Android package name (e.g., com.example.app)
   *
   * Returns:
   *   PackageInfo with installation status and version details
   *
   * Raises:
   *   TimeoutError: If query timed out
   */
  isInstalled(packageId: string): Promise<PackageInfo>;

  /**
   * Install APK from object storage reference.
   *
   * Args:
   *   ref: Object storage reference to APK file
   *   expectedSha256: Optional expected SHA-256 signature for validation
   *
   * Returns:
   *   Package ID of installed app
   *
   * Raises:
   *   TimeoutError: If installation timed out
   *   InvalidArgumentError: If APK is invalid or corrupted
   */
  installFromObjectStorage(ref: string, expectedSha256?: string): Promise<{ packageId: string }>;

  /**
   * Uninstall package from device if present.
   *
   * Args:
   *   packageId: Android package name
   *
   * Returns:
   *   True if uninstall attempt completed
   *
   * Raises:
   *   TimeoutError: If uninstall timed out
   */
  uninstall?(packageId: string): Promise<boolean>;

  /**
   * Get SHA-256 signature of installed package.
   *
   * Args:
   *   packageId: Android package name
   *
   * Returns:
   *   SHA-256 signature string
   *
   * Raises:
   *   AppNotInstalledError: If package not found
   *   TimeoutError: If query timed out
   */
  getSignatureSha256(packageId: string): Promise<string>;
}
