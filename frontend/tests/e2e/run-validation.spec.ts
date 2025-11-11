import { test, expect } from "@playwright/test";
import { TEST_APP_CONFIG } from "./helpers";

/**
 * PURPOSE: Validates the end-to-end "Detect My First Drift" flow including run creation,
 * run event streaming, graph updates, and screenshot discovery. This test ensures the
 * UI reflects the underlying automation pipeline end-to-end, giving confidence that the
 * harness, Appium session, and frontend rendering stay in sync.
 */
test.describe("run validation", () => {
	test.beforeAll(() => {
		console.log("🎯 Run Validation Configuration");
		console.log(`  Package: ${TEST_APP_CONFIG.packageName}`);
		console.log(`  Activity: ${TEST_APP_CONFIG.appActivity}`);
		console.log(`  Appium: ${TEST_APP_CONFIG.appiumServerUrl}`);
	});

	test("run validation", async ({ page }) => {
		// 1. Load landing page and verify CTA exists
		await page.goto("/");
		await expect(page).toHaveTitle(/ScreenGraph/i);

		const detectDriftCta = page.getByRole("button", { name: /detect my first drift/i });
		await expect(detectDriftCta).toBeVisible();

		// 2. Start the run via CTA
		await Promise.all([
			page.waitForURL(/\/run\/[a-f0-9-]+/i, {
				waitUntil: "domcontentloaded",
				timeout: 60000,
			}),
			detectDriftCta.click(),
		]);

		// 3. Wait for navigation to run page and verify layout
		const timelineHeading = page.getByRole("heading", { name: /run timeline/i });
		await expect(timelineHeading).toBeVisible({ timeout: 15000 });

		const cancelRunButton = page.getByRole("button", { name: /cancel run/i });
		await expect(cancelRunButton).toBeVisible();

		// 4. Wait for run events to stream in
		const runEvents = page.locator("[data-testid='run-events'] [data-event-kind]");
		await expect(runEvents.first()).toBeVisible({ timeout: 60000 });

		// Ensure at least one screenshot event has been emitted
		const screenshotEvent = page.locator(
			"[data-testid='run-events'] [data-event-kind='agent.event.screenshot_captured']",
		);
		await expect(screenshotEvent.first()).toBeVisible({ timeout: 60000 });

		// 5. Verify graph events stream is active
		const graphEvent = page.locator("[data-testid='graph-events'] [data-graph-event-type]");
		await expect(graphEvent.first()).toBeVisible({ timeout: 60000 });

		// 6. Confirm screenshots render in the gallery
		const screenshotGallery = page.locator("[data-testid='discovered-screens'] img");
		await expect(screenshotGallery.first()).toBeVisible({ timeout: 60000 });

		const screenshotCount = await screenshotGallery.count();
		expect(screenshotCount).toBeGreaterThan(0);
	});
});
