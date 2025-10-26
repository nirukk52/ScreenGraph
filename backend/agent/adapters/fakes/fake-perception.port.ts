import type { ScreenshotData, UiHierarchyData } from "../../domain/perception";
import type { PerceptionPort } from "../../ports/appium/perception.port";

/**
 * Fake implementation of PerceptionPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakePerceptionPort implements PerceptionPort {
  async captureScreenshot(): Promise<ScreenshotData> {
    return {
      base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      format: "png",
      widthPx: 1080,
      heightPx: 1920,
    };
  }

  async dumpUiHierarchy(): Promise<UiHierarchyData> {
    return {
      xmlContent: "<hierarchy/>",
      captureTimestampMs: Date.now(),
    };
  }
}

