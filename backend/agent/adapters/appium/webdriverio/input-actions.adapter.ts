import type { InputActionsPort } from "../../../ports/appium/input-actions.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriverIO-based input actions adapter implementing InputActionsPort.
 * Performs touch gestures and text input using WebDriverIO.
 */
export class WebDriverIOInputActionsAdapter implements InputActionsPort {
  constructor(private context: SessionContext) {}

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
  async performTap(x: number, y: number): Promise<void> {
    try {
      await this.context.driver.touchAction({
        action: "tap",
        x,
        y,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Tap timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform tap: ${error}`);
    }
  }

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
  async performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void> {
    try {
      await this.context.driver.touchAction([
        {
          action: "press",
          x: startX,
          y: startY,
        },
        {
          action: "wait",
          ms: durationMs,
        },
        {
          action: "moveTo",
          x: endX,
          y: endY,
        },
        {
          action: "release",
        },
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Swipe timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform swipe: ${error}`);
    }
  }

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
  async performLongPress(x: number, y: number, durationMs: number): Promise<void> {
    try {
      await this.context.driver.touchAction([
        {
          action: "press",
          x,
          y,
        },
        {
          action: "wait",
          ms: durationMs,
        },
        {
          action: "release",
        },
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Long press timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform long press: ${error}`);
    }
  }

  /**
   * Type text into focused element.
   * 
   * Args:
   *   text: Text to type
   * 
   * Raises:
   *   TimeoutError: If typing timed out
   */
  async performTextInput(text: string): Promise<void> {
    try {
      await this.context.driver.sendKeys(text);
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Text input timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform text input: ${error}`);
    }
  }
}

