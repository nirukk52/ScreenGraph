import type { RemoteOptions } from "webdriverio";
import type Browser from "webdriverio/build/index.js";

/**
 * SessionContext: Shared context for WebDriverIO adapters.
 * Holds the connected WebDriverIO browser instance and capabilities.
 */
export interface SessionContext {
  driver: Browser;
  capabilities: RemoteOptions["capabilities"];
}

