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
});

