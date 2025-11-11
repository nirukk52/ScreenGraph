import type { PackageInfo, PackageManagerPort } from "../../ports/appium/package-manager.port";

/**
 * Fake implementation of PackageManagerPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakePackageManagerAdapter implements PackageManagerPort {
  private installedPackages: Record<string, PackageInfo> = {};

  constructor() {
    // Pre-populate with some common packages
    this.installedPackages["com.android.launcher"] = {
      installed: true,
      versionName: "1.0.0",
      versionCode: 1,
    };
  }

  async isInstalled(packageId: string): Promise<PackageInfo> {
    return this.installedPackages[packageId] || { installed: false };
  }

  async installFromObjectStorage(
    ref: string,
    expectedSha256?: string,
  ): Promise<{ packageId: string }> {
    // Extract package ID from ref (mock implementation)
    const packageId = ref.split("/").pop()?.replace(".apk", "") || "com.example.app";
    this.installedPackages[packageId] = {
      installed: true,
      versionName: "1.0.0",
      versionCode: 1,
    };
    return { packageId };
  }

  async getSignatureSha256(packageId: string): Promise<string> {
    if (!this.installedPackages[packageId]?.installed) {
      throw new Error(`Package not installed: ${packageId}`);
    }
    return "fake-signature-hash";
  }
}
