import { test, expect } from "@playwright/test";
import { TEST_PACKAGE_NAME, TEST_APP_CONFIG } from "./helpers";

/**
 * /run page E2E regression suite
 * 
 * Verifies core functionality:
 * - Run page loads after starting a run
 * - Run Timeline header is visible
 * 
 * Prerequisites:
 * - Backend and frontend services running
 * - Test package from .env: ${TEST_PACKAGE_NAME}
 * - All tests use the same package for consistency
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
	 * Verify run page opens and displays Run Timeline header.
	 * This is the baseline test for detecting UI regressions.
	 * 
	 * NOTE: Requires backend to be running and able to start runs.
	 * Uses package from .env: ${TEST_PACKAGE_NAME}
	 */
	test("should open run page and show Run Timeline text", async ({ page }) => {
		// Navigate to landing page
		await page.goto("/");
		
		// Wait for page to fully load
		await expect(page).toHaveTitle(/ScreenGraph/i);
		
		// Find and click the "Detect My First Drift" button
		// Using getByRole for accessibility-friendly selection
		const runButton = page.getByRole("button", { name: /detect.*drift/i });
		await expect(runButton).toBeVisible();
		
		// Click the button - this will call the backend API and navigate
		await runButton.click();
		
		// Wait for navigation to /run page (increased timeout for API call + navigation)
		await page.waitForURL(/\/run\/[a-f0-9-]+/i, { 
			waitUntil: "domcontentloaded",
			timeout: 30000 
		});
		
		// Verify Run Timeline text is visible in the H1 heading
		// This is the key regression check - if timeline UI breaks, this will fail
		// Use getByRole to be specific and avoid strict mode violations
		const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
		await expect(timelineHeading).toBeVisible({ timeout: 10000 });
		
		// Verify Cancel Run button exists (indicates page fully loaded)
		const cancelButton = page.getByRole("button", { name: /cancel run/i });
		await expect(cancelButton).toBeVisible();
	});

	/**
	 * Verify landing page loads correctly before testing run flow.
	 * This is a sanity check to ensure frontend is healthy.
	 */
	test("should load landing page successfully", async ({ page }) => {
		await page.goto("/");
		
		// Verify page title
		await expect(page).toHaveTitle(/ScreenGraph/i);
		
		// Verify the main CTA button exists
		const runButton = page.getByRole("button", { name: /detect.*drift/i });
		await expect(runButton).toBeVisible();
		
		// Verify no console errors on load
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});
		
		await page.waitForTimeout(1000);
		
		// Assert no console errors
		expect(consoleErrors).toHaveLength(0);
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
			timeout: 30000 
		});
		
		// Verify timeline heading loaded
		const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
		await expect(timelineHeading).toBeVisible({ timeout: 10000 });
		
		// Wait for agent to capture first screenshot (reduced to fit 30s default)
		// Look for screenshot event in the timeline (data-event attribute)
		console.log("⏱ Waiting for agent to capture screenshots...");
		await page.waitForSelector('[data-event="agent.event.screenshot_captured"]', { 
			timeout: 15000,
			state: "visible"
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
});

