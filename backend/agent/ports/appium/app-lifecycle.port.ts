import type { ApplicationForegroundContext } from "../../domain/entities";

/**
 * AppLifecyclePort: Application Launch and Management Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for launching, restarting, and managing app lifecycles.
 * Enables LaunchOrAttachNode to start apps.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - domain types (ApplicationForegroundContext)
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface AppLifecyclePort {
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
  launchApp(packageId: string): Promise<ApplicationForegroundContext>;

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
  restartApp(packageId: string): Promise<boolean>;

  /**
   * Get foreground app package name.
   *
   * Returns:
   *   Package name (e.g., com.android.launcher)
   */
  getCurrentApp(): Promise<string>;
}
