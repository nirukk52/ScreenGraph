import type { Page } from "@playwright/test";

/**
 * Reusable Playwright helper utilities for ScreenGraph E2E tests.
 *
 * Provides consistent patterns for:
 * - Waiting for elements
 * - Safe interactions
 * - Common navigation patterns
 *
 * All tests use configuration from .env file for consistency.
 */

/**
 * Test package name from .env - the main key for all E2E tests.
 * Defaults to com.example.testapp if not set in environment.
 */
export const TEST_PACKAGE_NAME = process.env.VITE_PACKAGE_NAME || "com.example.testapp";

/**
 * Test app configuration from .env for consistent E2E testing.
 * All tests run against the same package defined in .env.
 * Uses BrowserStack cloud devices for testing.
 */
export const TEST_APP_CONFIG = {
  packageName: process.env.VITE_PACKAGE_NAME || "com.example.testapp",
  appActivity: process.env.VITE_APP_ACTIVITY || "com.example.testapp.MainActivity",
  apkPath: process.env.VITE_APK_PATH || "/path/to/test.apk",
  appiumServerUrl: process.env.VITE_APPIUM_SERVER_URL || "https://hub.browserstack.com/wd/hub",
};

/**
 * Wait for a specific text to appear on the page.
 * Useful for waiting on dynamic content or SSE events.
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 30000;
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Start a run from the landing page and wait for navigation to /run.
 * Returns the run ID extracted from the URL.
 *
 * NOTE: Uses TEST_PACKAGE_NAME from .env for consistency.
 */
export async function startRunFromLanding(page: Page): Promise<string> {
  // Navigate to landing page
  await page.goto("/");

  // Click "Detect My First Drift" button
  const runButton = page.getByRole("button", { name: /detect.*drift/i });
  await runButton.click();

  // Wait for navigation to /run page
  await page.waitForURL(/\/run\/([a-f0-9-]+)/i, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // Extract run ID from URL
  const url = page.url();
  const match = url.match(/\/run\/([a-f0-9-]+)/i);
  if (!match) {
    throw new Error("Failed to extract run ID from URL");
  }

  return match[1];
}

/**
 * Wait for a graph event to appear in the timeline.
 * Requires data-testid or data-event attributes on timeline entries.
 */
export async function waitForGraphEvent(
  page: Page,
  eventName: string,
  options?: { timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? 45000;
  await page.waitForSelector(`[data-event="${eventName}"]`, { timeout });
}

/**
 * Capture console errors during test execution.
 * Returns an array of error messages.
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Wait for the stop node to appear in the run timeline.
 * Indicates the run has completed successfully.
 */
export async function waitForStopNode(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 60000;
  await page.waitForSelector('[data-run-state="stopped"]', { timeout });
}

/**
 * Count discovered screenshots in the gallery.
 * Returns the number of screenshot images rendered.
 */
export async function countDiscoveredScreenshots(page: Page): Promise<number> {
  const screenGallery = page.locator('[data-testid="discovered-screens"] img');
  return await screenGallery.count();
}
