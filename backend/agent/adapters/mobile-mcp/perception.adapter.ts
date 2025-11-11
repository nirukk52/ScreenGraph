import type { ScreenshotData, UiHierarchyData } from "../../domain/perception";
import type { PerceptionPort } from "../../ports/appium/perception.port";
import { getMobileMcpClient } from "./client";
import type { MobileMcpSessionState } from "./session.adapter";

/**
 * MobileMcpPerceptionAdapter implements PerceptionPort using Mobile MCP APIs.
 * PURPOSE: Captures screenshots and accessibility trees through the microservice.
 */
export class MobileMcpPerceptionAdapter implements PerceptionPort {
  constructor(private readonly contextProvider: () => MobileMcpSessionState | null) {}

  private get context(): MobileMcpSessionState {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Mobile MCP session not initialized");
    }
    return ctx;
  }

  async captureScreenshot(): Promise<ScreenshotData> {
    const client = await getMobileMcpClient();
    const response = await client.captureScreenshot({ sessionId: this.context.sessionId });
    return {
      base64Image: response.base64Image,
      format: response.mimeType === "image/jpeg" ? "jpg" : "png",
      widthPx: response.widthPx,
      heightPx: response.heightPx,
    };
  }

  async dumpUiHierarchy(): Promise<UiHierarchyData> {
    const client = await getMobileMcpClient();
    const response = await client.fetchAccessibilityTree({ sessionId: this.context.sessionId });
    return {
      xmlContent: response.xml,
      captureTimestampMs: new Date(response.capturedAtIso).getTime(),
    };
  }
}
