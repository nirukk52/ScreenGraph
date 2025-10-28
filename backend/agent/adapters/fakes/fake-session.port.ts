import type { DeviceConfiguration, DeviceRuntimeContext } from "../../domain/entities";
import type { SessionPort } from "../../ports/appium/session.port";

/**
 * Fake implementation of SessionPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeSessionPort implements SessionPort {
  private sessionCounter = 0;
  private isClosed = false;

  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext> {
    if (this.isClosed) {
      this.sessionCounter++;
      this.isClosed = false;
    }
    return {
      driverSessionId: `fake-session-${this.sessionCounter}`,
      deviceId: config.deviceName,
      capabilitiesEcho: {
        platformName: config.platformName,
        automationName: "UiAutomator2",
      },
      healthProbeStatus: "HEALTHY",
    };
  }

  async closeSession(): Promise<void> {
    this.isClosed = true;
  }
}
