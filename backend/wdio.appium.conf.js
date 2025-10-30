/**
 * PURPOSE: Minimal WDIO config that starts an Appium server via the Appium Service
 * so the ScreenGraph agent can connect to http://127.0.0.1:4723 during local runs.
 * This config intentionally holds the process open via a dummy spec.
 */

export const config = {
  runner: "local",
  port: 4723,
  specs: ["./tests/_appium-server.spec.js"],
  maxInstances: 1,
  logLevel: "info",
  reporters: ["spec"],
  framework: "mocha",
  mochaOpts: {
    timeout: 600000,
  },

  // Minimal capabilities required by WDIO (not actually used by holder spec)
  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
    },
  ],

  services: [
    [
      "appium",
      {
        // Store Appium logs locally for troubleshooting
        logPath: "./.logs",
        // Use appium from node_modules (installed as devDependency)
        command: "appium",
        // Map to Appium server flags (lower camelCase → --kebab-case)
        args: {
          // Required for our agent flows (adb shell commands)
          // Use comma-separated string instead of array
          allowInsecure: "adb_shell",
          // Explicitly set address and port to match agent expectations
          address: "127.0.0.1",
          port: 4723,
          basePath: "/",
        },
      },
    ],
  ],
};


