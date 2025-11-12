import { expect, test } from "@playwright/test";
import { TEST_APP_CONFIG, TEST_PACKAGE_NAME } from "./helpers";

/**
 * /run page E2E regression suite
 *
 * Verifies complete run flow:
 * - Landing page loads correctly
 * - Run can be started successfully
 * - Run page displays timeline heading
 * - Screenshots appear within 20 seconds
 *
 * Prerequisites:
 * - Backend and frontend services running
 * - Test package from .env: ${TEST_PACKAGE_NAME}
 */
test.describe("/run page smoke tests", () => {
  test.setTimeout(60000); // 60s timeout for full run flow
  test.beforeAll(() => {
    // Log test configuration from .env
    console.log("🎯 E2E Test Configuration:");
    console.log(`  Package: ${TEST_APP_CONFIG.packageName}`);
    console.log(`  Activity: ${TEST_APP_CONFIG.appActivity}`);
    console.log(`  Appium: ${TEST_APP_CONFIG.appiumServerUrl}`);
  });

  /**
   * Verify screenshots are discovered and rendered in the UI.
   * Tests the complete flow: start run → wait for screenshots → verify images visible.
   *
   * Prerequisites:
   * - Backend running with agent worker (cd backend && encore run)
   * - Appium server running (auto-started by integration test)
   * - Android device/emulator connected
   * - Agent must capture at least 1 screenshot
   *
   * NOTE: This is a full integration test requiring the complete harness.
   * If backend worker isn't running, test will timeout after 30s.
   * Uses package from .env: ${TEST_PACKAGE_NAME}
   *
   * To run this test:
   * 1. Terminal 1: cd backend && encore run
   * 2. Terminal 2: cd frontend && bun run test:e2e:headed
   */
  test("should discover and display screenshots", async ({ page }) => {
    // Start run flow
    await page.goto("/");
    await expect(page).toHaveTitle(/ScreenGraph/i);

    const runButton = page.getByRole("button", { name: /detect.*drift/i });
    await runButton.click();

    // Wait for run page to load
    await page.waitForURL(/\/run\/[a-f0-9-]+/i, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Verify timeline heading loaded
    const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
    await expect(timelineHeading).toBeVisible({ timeout: 10000 });

    // Wait for agent to capture first screenshot (reduced to fit 30s default)
    // Race between screenshot success and launch failure (fast-fail)
    console.log("⏱ Waiting for agent to capture screenshots...");

    const runEventsRoot = page.locator("[data-testid='run-events']");
    const screenshotEventLocator = runEventsRoot.locator(
      "[data-event-kind='agent.event.screenshot_captured']",
    );
    const launchFailedEventLocator = runEventsRoot.locator(
      "[data-event-kind='agent.app.launch_failed']",
    );

    const startTime = Date.now();
    const timeout = 15000;
    let screenshotFound = false;

    while (!screenshotFound && Date.now() - startTime < timeout) {
      // Check for launch failure first
      const launchFailedCount = await launchFailedEventLocator.count();

      if (launchFailedCount > 0) {
        const eventText = await launchFailedEventLocator.first().textContent();
        throw new Error(
          `❌ App launch failed during E2E test!

Event detected in UI: ${eventText || "No details available"}

Common causes:
- Appium not running (http://127.0.0.1:4723)
- Device not connected (adb devices)
- App not installed or installation failed
- Backend unable to connect to Appium server`,
        );
      }

      // Check if screenshot event is visible
      const screenshotCount = await screenshotEventLocator.count();
      if (screenshotCount > 0) {
        screenshotFound = await screenshotEventLocator.first().isVisible();
        if (screenshotFound) break;
      }

      // Wait before next poll
      await page.waitForTimeout(500);
    }

    if (!screenshotFound) {
      throw new Error("Timeout waiting for screenshot event (no launch failure detected)");
    }

    console.log("✅ Screenshot event detected in timeline");

    // Extract JSON payload from event for artifact verification
    const screenshotEventPayload = await screenshotEventLocator
      .first()
      .locator("pre")
      .textContent();
    expect(screenshotEventPayload).toBeTruthy();
    console.log("📦 Screenshot event payload:", screenshotEventPayload);
    expect(screenshotEventPayload).toContain("refId");
    expect(screenshotEventPayload).toMatch(/screenshot\/.+\.png/);
  });
});
