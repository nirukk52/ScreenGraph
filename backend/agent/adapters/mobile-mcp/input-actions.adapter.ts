import type { InputActionsPort } from "../../ports/appium/input-actions.port";
import { getMobileMcpClient } from "./client";
import type { MobileMcpSessionState } from "./session.adapter";

/**
 * MobileMcpInputActionsAdapter maps InputActionsPort methods to Mobile MCP tools.
 * PURPOSE: Executes tap, swipe, long press, and text input via the microservice.
 */
export class MobileMcpInputActionsAdapter implements InputActionsPort {
  constructor(private readonly contextProvider: () => MobileMcpSessionState | null) {}

  private get context(): MobileMcpSessionState {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Mobile MCP session not initialized");
    }
    return ctx;
  }

  async performTap(x: number, y: number): Promise<void> {
    const client = await getMobileMcpClient();
    await client.tap({
      sessionId: this.context.sessionId,
      x,
      y,
    });
  }

  async performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void> {
    const client = await getMobileMcpClient();
    await client.swipe({
      sessionId: this.context.sessionId,
      startX,
      startY,
      endX,
      endY,
      durationMs,
    });
  }

  async performLongPress(x: number, y: number, durationMs: number): Promise<void> {
    const client = await getMobileMcpClient();
    await client.longPress({
      sessionId: this.context.sessionId,
      x,
      y,
      durationMs,
    });
  }

  async performTextInput(text: string): Promise<void> {
    const client = await getMobileMcpClient();
    await client.typeText({
      sessionId: this.context.sessionId,
      text,
    });
  }
}
