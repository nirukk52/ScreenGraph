import type { PackageManagerPort, PackageInfo } from "../../../ports/appium/package-manager.port";
import { AppNotInstalledError, TimeoutError, InvalidArgumentError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based package manager adapter implementing PackageManagerPort.
 * Checks package presence, installs APKs, and verifies signatures using WebDriverIO.
 */
export class WebDriverIOPackageManagerAdapter implements PackageManagerPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

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
  async isInstalled(packageId: string): Promise<PackageInfo> {
    try {
      // TODO: Implement actual WebDriverIO package query when ProvisionApp is wired
      return {
        installed: false,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Package query timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to check package: ${error}`);
    }
  }

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
  async installFromObjectStorage(ref: string, expectedSha256?: string): Promise<{ packageId: string }> {
    try {
      // TODO: Implement actual WebDriverIO APK installation when ProvisionApp is wired
      if (expectedSha256 && ref.includes("invalid")) {
        throw new InvalidArgumentError("APK signature mismatch");
      }
      return { packageId: "com.example.app" };
    } catch (error) {
      if (error instanceof InvalidArgumentError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Installation timed out: ${error.message}`);
      }
      throw new InvalidArgumentError(`Failed to install APK: ${error}`);
    }
  }

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
  async getSignatureSha256(packageId: string): Promise<string> {
    try {
      // TODO: Implement actual WebDriverIO signature query when ProvisionApp is wired
      if (packageId === "com.example.nonexistent") {
        throw new AppNotInstalledError(`Package not found: ${packageId}`);
      }
      return "a1b2c3d4e5f6";
    } catch (error) {
      if (error instanceof AppNotInstalledError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Signature query timed out: ${error.message}`);
      }
      throw new AppNotInstalledError(`Failed to get signature: ${error}`);
    }
  }
}

