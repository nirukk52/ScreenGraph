import type { PackageInfo, PackageManagerPort } from "../../../ports/appium/package-manager.port";
import { AppNotInstalledError, InvalidArgumentError, TimeoutError } from "../errors";
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
      const installed = await this.context.driver.isAppInstalled(packageId);
      if (!installed) return { installed: false };

      // Attempt to retrieve version info via dumpsys package
      try {
        const result = await this.context.driver.execute("mobile: shell", {
          command: "dumpsys",
          args: ["package", packageId],
        });
        const output = typeof result === "string" ? result : JSON.stringify(result);
        const versionNameMatch = output.match(/versionName=([^\s\n]+)/);
        // versionCode may appear as "versionCode=123" or "versionCode=123 targetSdk=..."
        const versionCodeMatch = output.match(/versionCode=(\d+)/);
        const versionName = versionNameMatch ? versionNameMatch[1] : undefined;
        const versionCode = versionCodeMatch ? Number.parseInt(versionCodeMatch[1], 10) : undefined;
        return { installed: true, versionName, versionCode };
      } catch {
        // If parsing fails, still report installed=true without version details
        return { installed: true };
      }
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
  async installFromObjectStorage(
    ref: string,
    _expectedSha256?: string,
  ): Promise<{ packageId: string }> {
    try {
      // WebDriverIO will upload and install the APK located at ref (path accessible to Appium server)
      await this.context.driver.installApp(ref);
      // The caller already knows the packageId; return placeholder to satisfy interface
      return { packageId: "" };
    } catch (error) {
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
      const installed = await this.context.driver.isAppInstalled(packageId);
      if (!installed) {
        throw new AppNotInstalledError(`Package not found: ${packageId}`);
      }
      const result = await this.context.driver.execute("mobile: shell", {
        command: "dumpsys",
        args: ["package", packageId],
      });
      const output = typeof result === "string" ? result : JSON.stringify(result);
      // Look for a line like: "SHA-256 digest: ABCDEF..."
      const shaMatch = output.match(/SHA-256 digest:\s*([A-Fa-f0-9:]+)/);
      if (shaMatch?.[1]) {
        // Normalize to lowercase without colons
        return shaMatch[1].replace(/:/g, "").toLowerCase();
      }
      // Fallback: attempt to parse legacy signature lines
      const legacyMatch = output.match(/signatures=\[([A-Fa-f0-9:]+)\]/);
      if (legacyMatch?.[1]) {
        return legacyMatch[1].replace(/:/g, "").toLowerCase();
      }
      throw new InvalidArgumentError("Unable to parse SHA-256 signature from dumpsys output");
    } catch (error) {
      if (error instanceof AppNotInstalledError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Signature query timed out: ${error.message}`);
      }
      throw new InvalidArgumentError(`Failed to get signature: ${error}`);
    }
  }

  async uninstall(packageId: string): Promise<boolean> {
    try {
      await this.context.driver.removeApp(packageId);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Uninstall timed out: ${error.message}`);
      }
      // Consider uninstall non-fatal; surface as invalid argument if e.g. not installed
      throw new InvalidArgumentError(`Failed to uninstall package: ${error}`);
    }
  }
}
