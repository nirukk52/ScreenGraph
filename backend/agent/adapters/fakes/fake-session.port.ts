import type { DeviceConfiguration, DeviceRuntimeContext } from "../../domain/entities";
import type { DeviceRuntimeContextRef } from "../../ports/appium/session.port";
import type { SessionPort } from "../../ports/appium/session.port";

/**
 * Fake implementation of SessionPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeSessionPort implements SessionPort {
  private sessionCounter = 0;
  private isClosed = false;

  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext & DeviceRuntimeContextRef> {
    if (this.isClosed) {
      this.sessionCounter++;
      this.isClosed = false;
    }
    return {
      deviceId: config.deviceName,
      capabilitiesEcho: {
        platformName: config.platformName,
        automationName: "UiAutomator2",
      },
      healthProbeStatus: "HEALTHY",
      deviceRuntimeContextId: `fake-context-${this.sessionCounter}`,
    };
  }

  async closeSession(): Promise<void> {
    this.isClosed = true;
  }
}
