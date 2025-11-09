import { test, expect } from "@playwright/test";
import { TEST_PACKAGE_NAME, TEST_APP_CONFIG } from "./helpers";

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
	test("should load page, start run, show heading, wait 20s, and verify screenshots", async ({ page }) => {
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
			timeout: 30000 
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
});

