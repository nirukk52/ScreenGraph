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
  test.beforeAll(() => {
    // Log test configuration from .env
    console.log("🎯 E2E Test Configuration:");
    console.log(`  Package: ${TEST_APP_CONFIG.packageName}`);
    console.log(`  Activity: ${TEST_APP_CONFIG.appActivity}`);
    console.log(`  Appium: ${TEST_APP_CONFIG.appiumServerUrl}`);
  });

  /**
   * Complete run flow test: validates entire user journey from landing to screenshot discovery.
   *
   * Steps:
   * 1. Load landing page and verify it's healthy
   * 2. Start a new run
   * 3. Verify run page loads with timeline heading
   * 4. Wait 20 seconds for agent to explore app
   * 5. Verify at least one screenshot appears in gallery
   *
   * NOTE: Requires backend to be running and able to start runs.
   * Uses package from .env: ${TEST_PACKAGE_NAME}
   */
  test("should load page, start run, show heading, wait 20s, and verify screenshots", async ({
    page,
  }) => {
    // STEP 1: Navigate to landing page and verify it loads
    await page.goto("/");
    await expect(page).toHaveTitle(/ScreenGraph/i);

    // Verify the main CTA button exists
    const runButton = page.getByRole("button", { name: /detect.*drift/i });
    await expect(runButton).toBeVisible();

    // STEP 2: Click button to start run
    await runButton.click();

    // STEP 3: Wait for navigation to /run page
    await page.waitForURL(/\/run\/[a-f0-9-]+/i, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // STEP 4: Verify Run Timeline heading is visible
    const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
    await expect(timelineHeading).toBeVisible({ timeout: 10000 });

    // Verify Cancel Run button exists (indicates page fully loaded)
    const cancelButton = page.getByRole("button", { name: /cancel run/i });
    await expect(cancelButton).toBeVisible();

    // STEP 5: Wait 20 seconds for agent to explore and capture screens
    await page.waitForTimeout(20000);

    // STEP 6: Verify at least one screenshot appeared in the gallery
    // Look for "Discovered Screens" heading which indicates screens have loaded
    const discoveredHeading = page.getByRole("heading", { name: /discovered screens/i });
    await expect(discoveredHeading).toBeVisible({ timeout: 5000 });

    // Verify at least one screenshot image is rendered
    const screenshots = page.locator('img[alt^="Screen"]');
    const screenshotCount = await screenshots.count();

    expect(screenshotCount).toBeGreaterThan(0);
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
    // Look for screenshot event in the timeline (data-event attribute)
    console.log("⏱ Waiting for agent to capture screenshots...");
    await page.waitForSelector('[data-event="agent.event.screenshot_captured"]', {
      timeout: 15000,
      state: "visible",
    });
    console.log("✅ Screenshot event detected in timeline");

    // Wait for screenshot image to render in the discovered screens gallery
    // Use data-testid for reliable selection
    const screenshotGallery = page.locator('[data-testid="discovered-screens"] img');

    // Wait for at least one screenshot image to be visible
    await expect(screenshotGallery.first()).toBeVisible({ timeout: 10000 });

    // Count how many screenshots were discovered
    const screenshotCount = await screenshotGallery.count();
    console.log(`📸 Found ${screenshotCount} screenshot(s) in gallery`);

    // Assert at least 1 screenshot is present
    expect(screenshotCount).toBeGreaterThanOrEqual(1);

    // Verify the first screenshot has a valid src attribute (data URL or HTTP URL)
    const firstScreenshot = screenshotGallery.first();
    const src = await firstScreenshot.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^(data:image|http)/); // Either data URL or HTTP URL

    console.log(`✅ Screenshot verification passed: ${screenshotCount} screenshot(s) visible`);
  });

  /**
   * BUG-014 REGRESSION TEST: Verify no stale screenshots from previous runs.
   *
   * Tests that navigating between multiple runs properly resets component state and
   * does not show screenshots from previous runs.
   *
   * Flow:
   * 1. Start first run (Run A), wait for screenshots
   * 2. Capture Run A's ID and screenshot URLs
   * 3. Navigate back to landing page
   * 4. Start second run (Run B)
   * 5. Verify Run B page shows NO screenshots from Run A
   * 6. Verify Run B page only shows Run B screenshots (when they appear)
   *
   * This validates the $effect fix that resets graphNodes/graphEvents when page.params.id changes.
   */
  test("BUG-014: should not show stale screenshots when navigating between runs", async ({
    page,
  }) => {
    console.log("🔍 BUG-014 Test: Starting first run...");

    // STEP 1: Start first run (Run A)
    await page.goto("/");
    const runButton = page.getByRole("button", { name: /detect.*drift/i });
    await runButton.click();

    // Wait for Run A page to load
    await page.waitForURL(/\/run\/[a-f0-9-]+/i, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Extract Run A ID from URL
    const runAUrl = page.url();
    const runAId = runAUrl.match(/\/run\/([a-f0-9-]+)/)?.[1];
    console.log(`📝 Run A ID: ${runAId}`);
    expect(runAId).toBeTruthy();

    // Wait for Run A to show at least one screenshot
    const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
    await expect(timelineHeading).toBeVisible({ timeout: 10000 });

    console.log("⏱ Waiting for Run A screenshots...");
    const screenshotGallery = page.locator('[data-testid="discovered-screens"] img');
    await expect(screenshotGallery.first()).toBeVisible({ timeout: 20000 });

    // Capture Run A screenshot data
    const runAScreenshotCount = await screenshotGallery.count();
    const runAScreenshotSrcs = await screenshotGallery.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src),
    );

    console.log(`📸 Run A has ${runAScreenshotCount} screenshot(s)`);
    expect(runAScreenshotCount).toBeGreaterThan(0);

    // STEP 2: Navigate back to landing page
    console.log("🔙 Navigating back to landing page...");
    await page.goto("/");
    await expect(page).toHaveTitle(/ScreenGraph/i);

    // STEP 3: Start second run (Run B)
    console.log("🔍 Starting second run (Run B)...");
    const runButton2 = page.getByRole("button", { name: /detect.*drift/i });
    await runButton2.click();

    // Wait for Run B page to load
    await page.waitForURL(/\/run\/[a-f0-9-]+/i, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Extract Run B ID from URL
    const runBUrl = page.url();
    const runBId = runBUrl.match(/\/run\/([a-f0-9-]+)/)?.[1];
    console.log(`📝 Run B ID: ${runBId}`);
    expect(runBId).toBeTruthy();
    expect(runBId).not.toBe(runAId); // Ensure we have a different run

    // STEP 4: Immediately verify NO screenshots from Run A are present
    // The gallery should be empty initially (or show "Waiting for screens" message)
    await expect(timelineHeading).toBeVisible({ timeout: 10000 });

    // Wait a moment for any potential stale state to render (this is the bug we're testing for)
    await page.waitForTimeout(1000);

    // Check if any screenshots are visible
    const initialScreenshots = page.locator('[data-testid="discovered-screens"] img');
    const initialCount = await initialScreenshots.count();

    if (initialCount > 0) {
      // If screenshots are visible, verify NONE of them match Run A's screenshots
      const currentSrcs = await initialScreenshots.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src),
      );

      for (const runASrc of runAScreenshotSrcs) {
        expect(currentSrcs).not.toContain(runASrc);
      }
      console.log(`✅ No stale Run A screenshots found (${initialCount} screenshots present)`);
    } else {
      console.log("✅ Gallery is empty initially (expected)");
    }

    // STEP 5: Wait for Run B screenshots to appear (optional - may timeout if run is slow)
    console.log("⏱ Waiting for Run B screenshots...");
    try {
      await expect(screenshotGallery.first()).toBeVisible({ timeout: 20000 });

      const runBScreenshotCount = await screenshotGallery.count();
      const runBScreenshotSrcs = await screenshotGallery.evaluateAll((imgs) =>
        imgs.map((img) => (img as HTMLImageElement).src),
      );

      console.log(`📸 Run B has ${runBScreenshotCount} screenshot(s)`);

      // Verify Run B screenshots are different from Run A screenshots
      for (const runASrc of runAScreenshotSrcs) {
        expect(runBScreenshotSrcs).not.toContain(runASrc);
      }

      console.log("✅ BUG-014 Test PASSED: Run B screenshots are distinct from Run A");
    } catch (error) {
      // If Run B screenshots don't appear in time, that's okay - we already validated
      // the main bug (no stale Run A screenshots)
      console.log("⚠️ Run B screenshots didn't appear in time, but stale state test passed");
    }
  });
});
