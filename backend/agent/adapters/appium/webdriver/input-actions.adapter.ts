import type { InputActionsPort } from "../../../ports/appium/input-actions.port";
import { TimeoutError } from "../errors";
import type { SessionContext } from "./session-context";

/**
 * WebDriver-based input actions adapter implementing InputActionsPort.
 * Performs touch gestures and text input using W3C WebDriver actions.
 *
 * PURPOSE:
 * --------
 * Implements InputActionsPort using W3C performActions protocol for deterministic gestures.
 * No WebDriverIO helper methods; direct W3C protocol access for mobile automation.
 */
export class WebDriverInputActionsAdapter implements InputActionsPort {
  constructor(private contextProvider: () => SessionContext | null) {}

  private get context(): SessionContext {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Session context not initialized");
    }
    return ctx;
  }

  /**
   * Tap at specific coordinates using W3C pointer actions.
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
      await this.context.driver.performActions([
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            { type: "pointerMove", duration: 0, x, y },
            { type: "pointerDown", button: 0 },
            { type: "pointerUp", button: 0 },
          ],
        },
      ]);
      await this.context.driver.releaseActions();
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Tap timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform tap: ${error}`);
    }
  }

  /**
   * Swipe from start to end coordinates using W3C pointer actions.
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
      await this.context.driver.performActions([
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            { type: "pointerMove", duration: 0, x: startX, y: startY },
            { type: "pointerDown", button: 0 },
            { type: "pause", duration: 50 },
            { type: "pointerMove", duration: durationMs, x: endX, y: endY },
            { type: "pointerUp", button: 0 },
          ],
        },
      ]);
      await this.context.driver.releaseActions();
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Swipe timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform swipe: ${error}`);
    }
  }

  /**
   * Long press at specific coordinates using W3C pointer actions.
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
      await this.context.driver.performActions([
        {
          type: "pointer",
          id: "finger1",
          parameters: { pointerType: "touch" },
          actions: [
            { type: "pointerMove", duration: 0, x, y },
            { type: "pointerDown", button: 0 },
            { type: "pause", duration: durationMs },
            { type: "pointerUp", button: 0 },
          ],
        },
      ]);
      await this.context.driver.releaseActions();
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Long press timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform long press: ${error}`);
    }
  }

  /**
   * Type text into focused element using W3C actions.
   *
   * Args:
   *   text: Text to type
   *
   * Raises:
   *   TimeoutError: If typing timed out
   */
  async performTextInput(text: string): Promise<void> {
    try {
      await this.context.driver.performActions([
        {
          type: "key",
          id: "keyboard",
          actions: text.split("").map((char) => ({
            type: "keyDown",
            value: char,
          })),
        },
      ]);
      await this.context.driver.releaseActions();
    } catch (error) {
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new TimeoutError(`Text input timed out: ${error.message}`);
      }
      throw new TimeoutError(`Failed to perform text input: ${error}`);
    }
  }
}
