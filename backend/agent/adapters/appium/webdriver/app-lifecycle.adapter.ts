import type { ApplicationForegroundContext } from "../../../domain/entities";
import type { AppLifecyclePort } from "../../../ports/appium/app-lifecycle.port";
import { AppNotInstalledError, AppCrashedError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based app lifecycle adapter implementing AppLifecyclePort.
 * Launches, restarts, and manages app lifecycles using Appium mobile extensions.
 *
 * PURPOSE:
 * --------
 * Implements AppLifecyclePort using Appium mobile commands for Android.
 * iOS support will be added in MVP phase (XCUITest scaffolding).
 */
export class WebDriverAppLifecycleAdapter implements AppLifecyclePort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Launch app by package name using Appium mobile extension.
   *
   * Args:
   *   packageId: Android package name (e.g., com.example.app)
   *
   * Returns:
   *   ApplicationForegroundContext with current package, activity, and timestamp
   *
   * Raises:
   *   AppNotInstalledError: If package not found
   *   AppCrashedError: If app crashed on launch
   *   TimeoutError: If launch timed out
   */
  async launchApp(packageId: string): Promise<ApplicationForegroundContext> {
    try {
      // Android: activate app via mobile extension
      await this.context.driver.execute("mobile: activateApp", { appId: packageId });

      // Get current package and activity via mobile extension
      const currentPackage = await this.context.driver.execute("mobile: getCurrentPackage", {});
      const currentActivity = await this.context.driver.execute("mobile: getCurrentActivity", {});

      return {
        currentPackageId: (currentPackage as string) || packageId,
        currentActivityName: (currentActivity as string) || `${packageId}.MainActivity`,
        appBroughtToForegroundTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("not installed")) {
          throw new AppNotInstalledError(`App not installed: ${packageId}`);
        }
        if (error.message.includes("crash") || error.message.includes("stopped")) {
          throw new AppCrashedError(`App crashed on launch: ${packageId}`);
        }
        if (error.message.includes("timeout")) {
          throw new TimeoutError(`App launch timed out: ${error.message}`);
        }
      }
      throw new AppNotInstalledError(`Failed to launch app: ${error}`);
    }
  }

  /**
   * Force stop and relaunch app using Appium mobile extensions.
   *
   * Args:
   *   packageId: Package name
   *
   * Returns:
   *   True if restart succeeded
   *
   * Raises:
   *   AppCrashedError: If app crashed on restart
   *   TimeoutError: If restart timed out
   */
  async restartApp(packageId: string): Promise<boolean> {
    try {
      // Android: terminate and activate via mobile extensions
      await this.context.driver.execute("mobile: terminateApp", { appId: packageId });
      await this.context.driver.execute("mobile: activateApp", { appId: packageId });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("crash") || error.message.includes("stopped")) {
          throw new AppCrashedError(`App crashed on restart: ${packageId}`);
        }
        if (error.message.includes("timeout")) {
          throw new TimeoutError(`App restart timed out: ${error.message}`);
        }
      }
      throw new AppCrashedError(`Failed to restart app: ${error}`);
    }
  }

  /**
   * Get foreground app package name using Appium mobile extension.
   *
   * Returns:
   *   Package name (e.g., com.android.launcher)
   */
  async getCurrentApp(): Promise<string> {
    try {
      const packageName = await this.context.driver.execute("mobile: getCurrentPackage", {});
      return (packageName as string) || "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
