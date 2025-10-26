import type { DriverPort, DeviceConfiguration } from "../../ports/driver.port";
import type { DeviceRuntimeContext, ApplicationForegroundContext } from "../../domain/entities";

export class FakeDriver implements DriverPort {
  private sessionCounter = 0;

  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext> {
    this.sessionCounter++;
    return {
      driverSessionId: `fake-session-${this.sessionCounter}`,
      deviceId: "emulator-5554",
      capabilitiesEcho: {
        platformName: config.platformName,
        automationName: "UiAutomator2",
      },
      healthProbeStatus: "HEALTHY",
    };
  }

  async captureScreenshot(sessionId: string): Promise<string> {
    return `obj://shots/${sessionId}/${Date.now()}.png`;
  }

  async dumpUiHierarchy(sessionId: string): Promise<string> {
    return `obj://xml/${sessionId}/${Date.now()}.xml`;
  }

  async launchApp(sessionId: string, packageId: string): Promise<ApplicationForegroundContext> {
    return {
      currentPackageId: packageId,
      currentActivityName: `${packageId}.HomeActivity`,
      appBroughtToForegroundTimestamp: new Date().toISOString(),
    };
  }

  async performTap(sessionId: string, x: number, y: number): Promise<void> {}

  async performSwipe(
    sessionId: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<void> {}

  async performBack(sessionId: string): Promise<void> {}

  async performTextInput(sessionId: string, text: string): Promise<void> {}

  async waitIdle(
    sessionId: string,
    minQuietMillis: number,
    maxWaitMillis: number,
  ): Promise<number> {
    return minQuietMillis + 100;
  }
}
