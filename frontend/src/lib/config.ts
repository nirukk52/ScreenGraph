/**
 * DEFAULT_RUN_CONFIG centralizes configurable defaults for starting a run.
 * PURPOSE: Remove hardcoded values and enable env-based overrides.
 */
export const DEFAULT_RUN_CONFIG = {
  maxSteps: 10,
  goal: "Explore | Max Coverage",
  appiumServerUrl: import.meta.env.VITE_APPIUM_SERVER_URL || "http://127.0.0.1:4723/",
} as const;

/**
 * DEFAULT_DEVICE_CONFIG holds app-under-test identifiers (overridable via env).
 * PURPOSE: Provide working defaults for local dev (replace with env vars for production).
 */
export const DEFAULT_DEVICE_CONFIG = {
  apkPath: import.meta.env.VITE_APK_PATH || 
    "/Users/priyankalalge/SAAS/Scoreboard/AppiumPythonClient/test/apps/kotlinconf.apk",
  packageName: import.meta.env.VITE_PACKAGE_NAME || "com.jetbrains.kotlinconf",
  appActivity: import.meta.env.VITE_APP_ACTIVITY || ".*",
} as const;


