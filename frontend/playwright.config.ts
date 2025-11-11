import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/** Get __dirname equivalent in ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Load .env file manually to ensure test environment matches app environment */
const envPath = resolve(__dirname, "../.env");
try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join("=");
    }
  }
} catch (error) {
  console.warn("⚠️  Could not load .env file, using defaults");
}

/** Detect CI environment (GitHub Actions, GitLab CI, etc.) */
const CI = !!process.env.CI;

/** Control headless mode - defaults to true, can be overridden with HEADLESS=false */
const HEADLESS = process.env.HEADLESS !== "false";

/** Frontend URL - defaults to standard port from .env */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Playwright configuration for ScreenGraph frontend E2E tests.
 *
 * Environment-aware setup:
 * - Local dev: headed mode with slowMo for debugging
 * - CI: headless, retries enabled, video on failure
 * - Test package from .env: VITE_PACKAGE_NAME
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: CI, // Prevent .only() in CI
  retries: CI ? 2 : 0, // Retry flaky tests in CI only
  workers: 1, // Single worker for now
  reporter: CI ? "github" : "list",

  use: {
    baseURL: FRONTEND_URL,
    headless: HEADLESS,
    trace: "on-first-retry",
    video: CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",

    // Slow motion in local dev for visual debugging
    launchOptions: {
      slowMo: CI ? 0 : 150,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Auto-start frontend if not running (optional)
  // Uses dev:e2e script without --strictPort to allow reusing existing dev server
  // In CI or when FRONTEND_URL responds, this will reuse the existing server
  webServer: !CI
    ? {
        command: "bun run dev:e2e",
        url: FRONTEND_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
