import type { InputActionsPort } from "../../ports/appium/input-actions.port";

/**
 * Fake implementation of InputActionsPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeInputActionsPort implements InputActionsPort {
  async performTap(x: number, y: number): Promise<void> {
    // No-op for testing
  }

  async performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void> {
    // No-op for testing
  }

  async performLongPress(x: number, y: number, durationMs: number): Promise<void> {
    // No-op for testing
  }

  async performTextInput(text: string): Promise<void> {
    // No-op for testing
  }
}
