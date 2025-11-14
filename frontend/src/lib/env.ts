import { url, bool, cleanEnv, str } from "envalid";

/**
 * env exposes validated frontend environment variables supplied by Vite.
 * PURPOSE: Guarantee that the Encore client always targets the expected backend URL while
 * providing helpful errors during misconfiguration.
 */
export const env = cleanEnv(import.meta.env, {
  VITE_BACKEND_BASE_URL: url({
    default: "http://localhost:4000",
    desc: "Encore backend URL for the generated client",
  }),
  VITE_APPIUM_SERVER_URL: url({
    default: "http://127.0.0.1:4723/",
    desc: "Local Appium server used during development",
  }),
  VITE_APK_PATH: str({
    default: "/Users/priyankalalge/SAAS/Scoreboard/AppiumPythonClient/test/apps/kotlinconf.apk",
    desc: "Absolute path to the Android APK used for local runs",
  }),
  VITE_PACKAGE_NAME: str({
    default: "com.jetbrains.kotlinconf",
    desc: "Android package name for the demo application",
  }),
  VITE_APP_ACTIVITY: str({
    default: ".*",
    desc: "Android activity matcher for launching the demo app",
  }),
  VITE_DEFAULT_APP_PACKAGE: str({
    default: "com.pinterest",
    desc: "Default app package name to display on /app-info route",
  }),
  MODE: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  DEV: bool({
    default: true,
    desc: "Vite development flag (exposed automatically)",
  }),
  PROD: bool({
    default: false,
    desc: "Vite production flag (exposed automatically)",
  }),
});

export const {
  VITE_BACKEND_BASE_URL,
  VITE_APPIUM_SERVER_URL,
  VITE_APK_PATH,
  VITE_PACKAGE_NAME,
  VITE_APP_ACTIVITY,
  VITE_DEFAULT_APP_PACKAGE,
  MODE,
  DEV,
  PROD,
} = env;
