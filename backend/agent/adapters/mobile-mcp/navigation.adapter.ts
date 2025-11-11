import type { NavigationPort } from "../../ports/appium/navigation.port";
import { getMobileMcpClient } from "./client";
import type { MobileMcpSessionState } from "./session.adapter";

/**
 * MobileMcpNavigationAdapter implements navigation operations through Mobile MCP.
 * PURPOSE: Provides back/home navigation using the microservice tools.
 */
export class MobileMcpNavigationAdapter implements NavigationPort {
  constructor(private readonly contextProvider: () => MobileMcpSessionState | null) {}

  private get context(): MobileMcpSessionState {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Mobile MCP session not initialized");
    }
    return ctx;
  }

  async performBack(): Promise<void> {
    const client = await getMobileMcpClient();
    await client.pressButton({
      sessionId: this.context.sessionId,
      button: "BACK",
    });
  }

  async pressHome(): Promise<void> {
    const client = await getMobileMcpClient();
    await client.pressButton({
      sessionId: this.context.sessionId,
      button: "HOME",
    });
  }
}
