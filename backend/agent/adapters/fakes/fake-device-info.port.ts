import type { DeviceInfoPort } from "../../ports/appium/device-info.port";

/**
 * Fake implementation of DeviceInfoPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeDeviceInfoPort implements DeviceInfoPort {
  async getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }> {
    return {
      widthPx: 1080,
      heightPx: 1920,
    };
  }

  async isDeviceReady(): Promise<boolean> {
    return true;
  }
}
