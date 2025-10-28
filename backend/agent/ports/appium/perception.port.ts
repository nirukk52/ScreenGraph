import type { ScreenshotData, UiHierarchyData } from "../../domain/perception";

/**
 * PerceptionPort: UI Capture Interface
 *
 * PURPOSE:
 * --------
 * Abstract interface for capturing UI state (screenshots and hierarchy).
 * Enables PerceiveNode to gather visual data.
 *
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - domain types (ScreenshotData, UiHierarchyData)
 *
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface PerceptionPort {
  /**
   * Capture a full-screen screenshot.
   *
   * Returns:
   *   ScreenshotData with base64 PNG image and dimensions
   *
   * Raises:
   *   TimeoutError: If capture timed out
   */
  captureScreenshot(): Promise<ScreenshotData>;

  /**
   * Capture UI hierarchy as XML/JSON.
   *
   * Returns:
   *   UiHierarchyData with XML string and capture timestamp
   *
   * Raises:
   *   TimeoutError: If capture timed out
   */
  dumpUiHierarchy(): Promise<UiHierarchyData>;
}
