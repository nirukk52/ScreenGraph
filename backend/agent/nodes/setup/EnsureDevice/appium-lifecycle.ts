import log from "encore.dev/log";
import {
  BROWSERSTACK_USERNAME,
  BROWSERSTACK_ACCESS_KEY,
  BROWSERSTACK_HUB_URL,
} from "../../../../config/env";

/** Logger for BrowserStack connectivity operations. */
const logger = log.with({ module: "agent", actor: "browserstack-lifecycle" });

/** Health check result for BrowserStack Appium hub. */
export interface AppiumHealthStatus {
  /** Whether BrowserStack hub is reachable and ready. */
  isHealthy: boolean;
  /** HTTP status code from health check (undefined if connection failed). */
  statusCode?: number;
  /** Error message if health check failed. */
  error?: string;
}

/**
 * Checks if BrowserStack Appium hub is reachable by polling its /status endpoint.
 * PURPOSE: Verify BrowserStack cloud service availability before starting run.
 *
 * @returns Health status with connection details
 */
export async function checkAppiumHealth(): Promise<AppiumHealthStatus> {
  if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
    logger.error("BrowserStack credentials not configured", {
      hasUsername: !!BROWSERSTACK_USERNAME,
      hasAccessKey: !!BROWSERSTACK_ACCESS_KEY,
    });
    return {
      isHealthy: false,
      error: "BrowserStack credentials not configured. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env",
    };
  }

  const url = `${BROWSERSTACK_HUB_URL}/status`;

  try {
    logger.info("checking browserstack hub health", { url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    // BrowserStack requires Basic Auth
    const authString = Buffer.from(`${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}`).toString("base64");

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn("browserstack hub health check failed", {
        statusCode: response.status,
        statusText: response.statusText,
      });

      return {
        isHealthy: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { status?: number; value?: { build?: Record<string, unknown> } };
    // BrowserStack returns status: 0 to indicate healthy (not value.ready)
    const isHealthy = data?.status === 0;

    if (isHealthy) {
      logger.info("browserstack hub is healthy", { status: data.status, build: data.value?.build });
      return { isHealthy: true, statusCode: response.status };
    }

    logger.warn("browserstack hub not ready", { data });
    return {
      isHealthy: false,
      statusCode: response.status,
      error: `BrowserStack hub not ready (status: ${data?.status})`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.warn("browserstack hub health check connection failed", {
      error: errorMessage,
    });

    return {
      isHealthy: false,
      error: `Connection failed: ${errorMessage}`,
    };
  }
}

/**
 * Gets the BrowserStack Appium hub URL with embedded credentials.
 * PURPOSE: Provide connection URL for WebDriverIO remote sessions.
 *
 * @returns BrowserStack hub URL with authentication
 */
export function getBrowserStackUrl(): string {
  if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
    throw new Error("BrowserStack credentials not configured. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in .env");
  }

  // Format: https://username:accesskey@hub.browserstack.com/wd/hub
  const url = new URL(BROWSERSTACK_HUB_URL);
  url.username = BROWSERSTACK_USERNAME;
  url.password = BROWSERSTACK_ACCESS_KEY;

  return url.toString();
}
