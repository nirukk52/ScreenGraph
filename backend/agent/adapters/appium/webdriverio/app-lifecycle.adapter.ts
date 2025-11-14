import type { ApplicationForegroundContext } from "../../../domain/entities";
import type {
  AppLifecycleBudget,
  AppLifecyclePort,
} from "../../../ports/appium/app-lifecycle.port";
import { type DriverErrorKind, mapAdapterErrorToDriverErrorKind } from "../error-kinds";
import { AppCrashedError, AppNotInstalledError, TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based app lifecycle adapter implementing AppLifecyclePort.
 * Launches, restarts, and manages app lifecycles using WebDriverIO.
 */
export class WebDriverIOAppLifecycleAdapter implements AppLifecyclePort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Launch app by package name.
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
  async launchApp(
    packageId: string,
    _budget: AppLifecycleBudget,
  ): Promise<ApplicationForegroundContext> {
    try {
      await this.context.driver.activateApp(packageId);
      const currentPackage = await this.context.driver.getCurrentPackage();
      const currentActivity = await this.context.driver.getCurrentActivity();

      return {
        currentPackageId: currentPackage || packageId,
        currentActivityName: currentActivity || `${packageId}.MainActivity`,
        appBroughtToForegroundTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorKind = mapAdapterErrorToDriverErrorKind(error);
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
      const normalizedError = new AppCrashedError(`Launch failed with ${errorKind}`);
      (normalizedError as Error & { errorKind: DriverErrorKind }).errorKind = errorKind;
      throw normalizedError;
    }
  }

  /**
   * Force stop and relaunch app.
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
  async restartApp(packageId: string, _budget: AppLifecycleBudget): Promise<boolean> {
    try {
      await this.context.driver.terminateApp(packageId);
      await this.context.driver.activateApp(packageId);
      return true;
    } catch (error) {
      const errorKind = mapAdapterErrorToDriverErrorKind(error);
      if (error instanceof Error) {
        if (error.message.includes("crash") || error.message.includes("stopped")) {
          throw new AppCrashedError(`App crashed on restart: ${packageId}`);
        }
        if (error.message.includes("timeout")) {
          throw new TimeoutError(`App restart timed out: ${error.message}`);
        }
      }
      const normalizedError = new AppCrashedError(`Restart failed with ${errorKind}`);
      (normalizedError as Error & { errorKind: DriverErrorKind }).errorKind = errorKind;
      throw normalizedError;
    }
  }

  /**
   * Get foreground app package name.
   *
   * Returns:
   *   Package name (e.g., com.android.launcher)
   */
  async getCurrentApp(): Promise<string> {
    try {
      const packageName = await this.context.driver.getCurrentPackage();
      return packageName || "unknown";
    } catch (error) {
      return "unknown";
    }
  }
}
