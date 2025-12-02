import { expect, test } from "@playwright/test";
import { TEST_APP_CONFIG, TEST_PACKAGE_NAME } from "./helpers";

/**
 * Only updates to the exising test don't add new.
 * /run page E2E regression suite
 *
 * Verifies complete run flow:
 * - Landing page loads correctly
 * - Run can be started successfully
 * - Run page displays timeline heading
 * - Screenshots appear within 60 seconds (BrowserStack provisioning)
 *
 * Prerequisites:
 * - Backend and frontend services running
 * - BrowserStack credentials configured in backend .env
 * - Test package from .env: ${TEST_PACKAGE_NAME}
 */
test.describe("/run page smoke tests", () => {
  test.setTimeout(90000); // 90s timeout for full run flow (BrowserStack provisioning)
  test.beforeAll(() => {
    // Log test configuration from .env
    console.log("🎯 E2E Test Configuration (BrowserStack Cloud):");
    console.log(`  Package: ${TEST_APP_CONFIG.packageName}`);
    console.log(`  Activity: ${TEST_APP_CONFIG.appActivity}`);
    console.log(`  BrowserStack Hub: ${TEST_APP_CONFIG.appiumServerUrl}`);
  });

  /**
   * Verify screenshots are discovered and rendered in the UI.
   * Tests the complete flow: start run → wait for screenshots → verify images visible.
   *
   * Prerequisites:
   * - Backend running with agent worker (cd backend && encore run)
   * - BrowserStack credentials configured in backend .env
   * - Agent must capture at least 1 screenshot
   *
   * NOTE: This is a full integration test using BrowserStack cloud devices.
   * BrowserStack session provisioning takes 40-60 seconds.
   * If backend worker isn't running, test will timeout after 60s.
   * Uses package from .env: ${TEST_PACKAGE_NAME}
   *
   * To run this test:
   * 1. Terminal 1: cd backend && encore run (with BrowserStack credentials)
   * 2. Terminal 2: cd frontend && bun run test:e2e:headed
   */
  test("should discover and display screenshots", async ({ page }) => {
    // Start run flow
    await page.goto("/");
    await expect(page).toHaveTitle(/ScreenGraph/i);

    const runButton = page.getByRole("button", { name: /detect.*drift/i });
    await runButton.click();

    // Wait for run page to load
    await page.waitForURL(/\/run\/[A-Za-z0-9-]+/, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Verify timeline heading loaded
    const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
    await expect(timelineHeading).toBeVisible({ timeout: 10000 });

    // Wait for agent to capture first screenshot (BrowserStack provisioning: 40-60s)
    // Race between screenshot success and launch failure (fast-fail)
    console.log("⏱ Waiting for BrowserStack session + agent screenshots (up to 60s)...");

    const runEventsRoot = page.locator("[data-testid='run-events']");
    const screenshotEventLocator = runEventsRoot.locator(
      "[data-event-kind='agent.event.screenshot_captured']",
    );
    const launchFailedEventLocator = runEventsRoot.locator(
      "[data-event-kind='agent.app.launch_failed']",
    );

    const startTime = Date.now();
    const timeout = 60000; // 60s for BrowserStack session provisioning
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
- BrowserStack credentials missing or invalid
- BrowserStack hub unavailable
- App not pre-uploaded to BrowserStack
- Device not available in BrowserStack pool
- Backend unable to connect to BrowserStack hub`,
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

    // Verify screenshot gallery renders captured images on screen
    const galleryLocator = page.locator("[data-testid='discovered-screens']");
    const galleryImageLocator = galleryLocator.locator("img").first();
    const emptyStateLocator = page.locator("[data-testid='discovered-screens-empty']");

    const galleryStartTime = Date.now();
    const galleryTimeout = 30000;
    let galleryReady = false;

    while (!galleryReady && Date.now() - galleryStartTime < galleryTimeout) {
      const imageCount = await galleryImageLocator.count();
      if (imageCount > 0) {
        galleryReady = await galleryImageLocator.isVisible();
        if (galleryReady) {
          break;
        }
      }
      await page.waitForTimeout(500);
    }

    if (!galleryReady) {
      const emptyStateVisible = await emptyStateLocator.isVisible().catch(() => false);
      throw new Error(
        `Timeout waiting for screenshot gallery to render (empty state visible: ${emptyStateVisible})`,
      );
    }

    await galleryImageLocator.scrollIntoViewIfNeeded();
    await expect(galleryImageLocator).toBeVisible({ timeout: 5000 });

    const screenshotSrc = await galleryImageLocator.getAttribute("src");
    if (!screenshotSrc) {
      throw new Error("Screenshot image rendered without src attribute");
    }
    expect(screenshotSrc).toMatch(/^data:image\//);

    const boundingBox = await galleryImageLocator.boundingBox();
    if (!boundingBox) {
      throw new Error("Screenshot image failed to compute bounding box");
    }
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);

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
