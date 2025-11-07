import {
  VITE_APP_ACTIVITY,
  VITE_APK_PATH,
  VITE_APPIUM_SERVER_URL,
  VITE_PACKAGE_NAME,
} from "./env";

/**
 * DEFAULT_RUN_CONFIG centralizes configurable defaults for starting a run.
 * PURPOSE: Remove hardcoded values and enable env-based overrides.
 */
export const DEFAULT_RUN_CONFIG = {
  maxSteps: 10,
  goal: "Explore | Max Coverage",
  appiumServerUrl: VITE_APPIUM_SERVER_URL,
} as const;

/**
 * DEFAULT_DEVICE_CONFIG holds app-under-test identifiers (overridable via env).
 * PURPOSE: Provide working defaults for local dev (replace with env vars for production).
 */
export const DEFAULT_DEVICE_CONFIG = {
  apkPath: VITE_APK_PATH,
  packageName: VITE_PACKAGE_NAME,
  appActivity: VITE_APP_ACTIVITY,
} as const;


