import type { ApplicationForegroundContext } from "../../domain/entities";
import type { AppLifecyclePort } from "../../ports/appium/app-lifecycle.port";

/**
 * Fake implementation of AppLifecyclePort for testing.
 * Provides predictable mock behavior without requiring a real app.
 */
export class FakeAppLifecyclePort implements AppLifecyclePort {
  async launchApp(packageId: string): Promise<ApplicationForegroundContext> {
    return {
      currentPackageId: packageId,
      currentActivityName: `${packageId}.HomeActivity`,
      appBroughtToForegroundTimestamp: new Date().toISOString(),
    };
  }

  async restartApp(packageId: string): Promise<boolean> {
    return true;
  }

  async getCurrentApp(): Promise<string> {
    return "com.android.launcher";
  }
}
