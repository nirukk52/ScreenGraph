import { DeviceRuntimeContext, ApplicationForegroundContext } from "../domain/entities";

export interface DeviceConfiguration {
  platformName: string;
  deviceName: string;
  platformVersion: string;
  appiumServerUrl: string;
}

export interface DriverPort {
  ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext>;

  captureScreenshot(sessionId: string): Promise<string>;

  dumpUiHierarchy(sessionId: string): Promise<string>;

  launchApp(sessionId: string, packageId: string): Promise<ApplicationForegroundContext>;

  performTap(sessionId: string, x: number, y: number): Promise<void>;

  performSwipe(
    sessionId: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Promise<void>;

  performBack(sessionId: string): Promise<void>;

  performTextInput(sessionId: string, text: string): Promise<void>;

  waitIdle(sessionId: string, minQuietMillis: number, maxWaitMillis: number): Promise<number>;
}
