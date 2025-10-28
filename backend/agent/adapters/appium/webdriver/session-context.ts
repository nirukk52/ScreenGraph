import type Browser from "webdriverio/build/index.js";

/**
 * MobileDriver: Type alias for WebDriverIO Browser that is semantically clearer for mobile automation.
 * Represents a mobile app driver connected via Appium (not a web browser).
 */
export type MobileDriver = Browser;

/**
 * SessionContext: Shared context for WebDriver adapters.
 * Holds the connected WebDriver driver instance and capabilities.
 */
export interface SessionContext {
  driver: MobileDriver;
  capabilities: Record<string, unknown>;
  /**
   * Stable identifier referencing the ScreenGraph device runtime context.
   * PURPOSE: Allows adapters to surface context IDs without exposing driver session IDs.
   */
  deviceRuntimeContextId: string;
}
