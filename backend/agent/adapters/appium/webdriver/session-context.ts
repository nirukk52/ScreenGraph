import type { WebDriver } from "webdriver";

/**
 * MobileDriver: Type alias for WebDriver that is semantically clearer for mobile automation.
 * Represents a mobile app driver connected via Appium (not a web browser).
 */
export type MobileDriver = WebDriver;

/**
 * SessionContext: Shared context for WebDriver adapters.
 * Holds the connected WebDriver driver instance and capabilities.
 */
export interface SessionContext {
  driver: MobileDriver;
  capabilities: Record<string, unknown>;
}
