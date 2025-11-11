import type { DeviceInfoPort } from "../../ports/appium/device-info.port";
import { getMobileMcpClient } from "./client";
import type { MobileMcpSessionState } from "./session.adapter";

/**
 * MobileMcpDeviceInfoAdapter implements DeviceInfoPort through Mobile MCP APIs.
 * PURPOSE: Provides screen dimension queries required by the perception pipeline.
 */
export class MobileMcpDeviceInfoAdapter implements DeviceInfoPort {
  constructor(private readonly contextProvider: () => MobileMcpSessionState | null) {}

  private get context(): MobileMcpSessionState {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Mobile MCP session not initialized");
    }
    return ctx;
  }

  async getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }> {
    const client = await getMobileMcpClient();
    const response = await client.fetchScreenDimensions({
      sessionId: this.context.sessionId,
    });
    return {
      widthPx: response.widthPx,
      heightPx: response.heightPx,
    };
  }

  async isDeviceReady(): Promise<boolean> {
    try {
      await this.getScreenDimensions();
      return true;
    } catch (err) {
      return false;
    }
  }
}
