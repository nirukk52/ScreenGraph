import type {
  Browser,
  BrowserContext,
  LaunchOptions,
  Page,
} from "playwright";
import { chromium } from "playwright";

/**
 * Launch a Chromium browser with project defaults.
 * Uses headless=false unless overridden to mirror real user flows.
 */
export async function launchChromium(
  options: LaunchOptions & { slowMo?: number } = {}
): Promise<Browser> {
  const defaultOptions: LaunchOptions = {
    headless: options.headless ?? false,
    slowMo: options.slowMo ?? 0,
    args: ["--disable-web-security", "--disable-features=IsolateOrigins"],
  };

  return chromium.launch({ ...defaultOptions, ...options });
}

/**
 * Create a new page and apply project defaults (viewport, timeout).
 */
export async function createPage(
  context: BrowserContext,
  options: { viewport?: { width: number; height: number }; timeout?: number } = {}
): Promise<Page> {
  const page = await context.newPage();

  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }

  page.setDefaultTimeout(options.timeout ?? 30000);
  return page;
}

/**
 * Wait for network idle and, optionally, a selector to appear.
 */
export async function waitForPageReady(
  page: Page,
  options: { waitForSelector?: string; timeout?: number } = {}
): Promise<void> {
  await page.waitForLoadState("networkidle", {
    timeout: options.timeout ?? 30000,
  });

  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, {
      timeout: options.timeout ?? 30000,
    });
  }
}

/**
 * Click a selector with retries to accommodate delayed rendering.
 */
export async function safeClick(
  page: Page,
  selector: string,
  options: { retries?: number; retryDelay?: number; timeout?: number } = {}
): Promise<void> {
  const retries = options.retries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await page.waitForSelector(selector, {
        state: "visible",
        timeout: options.timeout ?? 5000,
      });
      await page.click(selector, { timeout: options.timeout ?? 5000 });
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await page.waitForTimeout(retryDelay);
    }
  }
}

/**
 * Clear an input and type text safely.
 */
export async function safeType(
  page: Page,
  selector: string,
  text: string,
  options: { timeout?: number } = {}
): Promise<void> {
  await page.waitForSelector(selector, {
    state: "visible",
    timeout: options.timeout ?? 5000,
  });
  await page.fill(selector, "");
  await page.type(selector, text, { timeout: options.timeout ?? 5000 });
}

/**
 * Collect console logs emitted during a run for debugging.
 */
export function attachConsoleLogging(page: Page): void {
  page.on("console", (message) => {
    // eslint-disable-next-line no-console
    console.log(`[browser:${message.type()}] ${message.text()}`);
  });
}

