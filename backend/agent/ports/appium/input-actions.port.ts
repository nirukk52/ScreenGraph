/**
 * InputActionsPort: Touch and Text Input Interface
 * 
 * PURPOSE:
 * --------
 * Abstract interface for performing touch gestures and text input.
 * Enables ActNode to execute UI actions.
 * 
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - None (basic types)
 * 
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface InputActionsPort {
  /**
   * Tap at specific coordinates.
   * 
   * Args:
   *   x: Horizontal position in pixels
   *   y: Vertical position in pixels
   * 
   * Raises:
   *   TimeoutError: If tap timed out
   */
  performTap(x: number, y: number): Promise<void>;

  /**
   * Swipe from start to end coordinates.
   * 
   * Args:
   *   startX, startY: Start position in pixels
   *   endX, endY: End position in pixels
   *   durationMs: Swipe duration in milliseconds
   * 
   * Raises:
   *   TimeoutError: If swipe timed out
   */
  performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void>;

  /**
   * Long press at specific coordinates.
   * 
   * Args:
   *   x: Horizontal position in pixels
   *   y: Vertical position in pixels
   *   durationMs: Press duration in milliseconds
   * 
   * Raises:
   *   TimeoutError: If long press timed out
   */
  performLongPress(x: number, y: number, durationMs: number): Promise<void>;

  /**
   * Type text into focused element.
   * 
   * Args:
   *   text: Text to type
   * 
   * Raises:
   *   TimeoutError: If typing timed out
   */
  performTextInput(text: string): Promise<void>;
}

