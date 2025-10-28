import type {
  DeviceConfiguration,
  DeviceRuntimeContext,
  ApplicationForegroundContext,
} from "../../domain/entities";
import type { ScreenshotData, UiHierarchyData } from "../../domain/perception";
import type { SessionPort } from "./session.port";
import type { AppLifecyclePort } from "./app-lifecycle.port";
import type { PerceptionPort } from "./perception.port";
import type { DeviceInfoPort } from "./device-info.port";
import type { InputActionsPort } from "./input-actions.port";
import type { NavigationPort } from "./navigation.port";
import type { IdleDetectorPort } from "./idle-detector.port";

/**
 * Legacy DriverPort façade that delegates to granular ports.
 * Used for gradual migration from monolithic driver to granular ports.
 * This allows nodes to be migrated incrementally without breaking existing code.
 */
export class DriverPortFacade {
  constructor(
    private sessionPort: SessionPort,
    private appLifecyclePort: AppLifecyclePort,
    private perceptionPort: PerceptionPort,
    private deviceInfoPort: DeviceInfoPort,
    private inputActionsPort: InputActionsPort,
    private navigationPort: NavigationPort,
    private idleDetectorPort: IdleDetectorPort,
  ) {}

  // Session methods
  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext> {
    return this.sessionPort.ensureDevice(config);
  }

  async closeSession(): Promise<void> {
    return this.sessionPort.closeSession();
  }

  // App lifecycle methods
  async launchApp(packageId: string): Promise<ApplicationForegroundContext> {
    return this.appLifecyclePort.launchApp(packageId);
  }

  async restartApp(packageId: string): Promise<boolean> {
    return this.appLifecyclePort.restartApp(packageId);
  }

  async getCurrentApp(): Promise<string> {
    return this.appLifecyclePort.getCurrentApp();
  }

  // Perception methods
  async captureScreenshot(): Promise<ScreenshotData> {
    return this.perceptionPort.captureScreenshot();
  }

  async dumpUiHierarchy(): Promise<UiHierarchyData> {
    return this.perceptionPort.dumpUiHierarchy();
  }

  // Device info methods
  async getScreenDimensions(): Promise<{ widthPx: number; heightPx: number }> {
    return this.deviceInfoPort.getScreenDimensions();
  }

  async isDeviceReady(): Promise<boolean> {
    return this.deviceInfoPort.isDeviceReady();
  }

  // Input actions methods
  async performTap(x: number, y: number): Promise<void> {
    return this.inputActionsPort.performTap(x, y);
  }

  async performSwipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<void> {
    return this.inputActionsPort.performSwipe(startX, startY, endX, endY, durationMs);
  }

  async performLongPress(x: number, y: number, durationMs: number): Promise<void> {
    return this.inputActionsPort.performLongPress(x, y, durationMs);
  }

  async performTextInput(text: string): Promise<void> {
    return this.inputActionsPort.performTextInput(text);
  }

  // Navigation methods
  async performBack(): Promise<void> {
    return this.navigationPort.performBack();
  }

  async pressHome(): Promise<void> {
    return this.navigationPort.pressHome();
  }

  // Idle detection methods
  async waitIdle(minQuietMillis: number, maxWaitMillis: number): Promise<number> {
    return this.idleDetectorPort.waitIdle(minQuietMillis, maxWaitMillis);
  }
}
