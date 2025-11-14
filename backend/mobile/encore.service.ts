/** Mobile device automation service - Encore service definition and API endpoints. */

import { Service } from "encore.dev/service";

export default new Service("mobile");

import { api } from "encore.dev/api";
import log from "encore.dev/log";
import type {
  CaptureScreenshotRequest,
  CaptureScreenshotResponse,
  CloseSessionRequest,
  CloseSessionResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  DoubleTapAtCoordinatesRequest,
  DoubleTapAtCoordinatesResponse,
  GetDeviceInfoRequest,
  GetDeviceInfoResponse,
  GetOrientationRequest,
  GetOrientationResponse,
  GetScreenSizeRequest,
  GetScreenSizeResponse,
  GetSessionRequest,
  GetSessionResponse,
  GetUIElementsRequest,
  GetUIElementsResponse,
  InstallAppRequest,
  InstallAppResponse,
  LaunchAppRequest,
  LaunchAppResponse,
  ListAppsRequest,
  ListAppsResponse,
  ListDevicesRequest,
  ListDevicesResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  LongPressAtCoordinatesRequest,
  LongPressAtCoordinatesResponse,
  OpenURLRequest,
  OpenURLResponse,
  PressButtonRequest,
  PressButtonResponse,
  SetOrientationRequest,
  SetOrientationResponse,
  SwipeRequest,
  SwipeResponse,
  TapAtCoordinatesRequest,
  TapAtCoordinatesResponse,
  TerminateAppRequest,
  TerminateAppResponse,
  TypeTextRequest,
  TypeTextResponse,
  UninstallAppRequest,
  UninstallAppResponse,
} from "./dto";
import { getMobileMCPClient } from "./mcp-client";
import { getDeviceSessionRepository } from "./session-repo";

const logger = log.with({ module: "mobile", component: "api" });

/** Helper to measure operation duration. */
function measureDuration<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  return fn().then((result) => ({
    result,
    durationMs: Date.now() - start,
  }));
}

/**
 * List all available mobile devices.
 * Returns simulators, emulators, and real devices connected to the system.
 */
export const listDevices = api(
  { expose: true, method: "POST", path: "/mobile/devices/list" },
  async (_req: ListDevicesRequest): Promise<ListDevicesResponse> => {
    logger.info("listing available devices");

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: devices, durationMs } = await measureDuration(() => mcpClient.listDevices());

    // Cache device info in database
    for (const device of devices) {
      await sessionRepo.upsertDeviceInfo(device);
    }

    logger.info("listed devices", { count: devices.length, durationMs });

    return { devices };
  },
);

/**
 * Get detailed information about a specific device.
 */
export const getDeviceInfo = api(
  { expose: true, method: "POST", path: "/mobile/devices/info" },
  async (req: GetDeviceInfoRequest): Promise<GetDeviceInfoResponse> => {
    logger.info("getting device info", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();

    // Get fresh device list and find matching device
    const devices = await mcpClient.listDevices();
    const device = devices.find((d) => d.id === req.deviceId);

    if (!device) {
      throw new Error(`Device not found: ${req.deviceId}`);
    }

    // Get additional device details with graceful degradation
    let screenSize = { width: 0, height: 0 };
    let orientation: "portrait" | "landscape" = "portrait";

    try {
      screenSize = await mcpClient.getScreenSize(req.deviceId);
    } catch (err) {
      const error = err as Error;
      logger.warn("screen size unavailable, using default", { deviceId: req.deviceId, err: error.message });
    }

    try {
      orientation = await mcpClient.getOrientation(req.deviceId);
    } catch (err) {
      const error = err as Error;
      logger.warn("orientation unavailable, using default", { deviceId: req.deviceId, err: error.message });
    }

    return {
      ...device,
      screenWidth: screenSize.width,
      screenHeight: screenSize.height,
      orientation,
    };
  },
);

/**
 * List all installed apps on a device.
 */
export const listApps = api(
  { expose: true, method: "POST", path: "/mobile/apps/list" },
  async (req: ListAppsRequest): Promise<ListAppsResponse> => {
    logger.info("listing apps", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: apps, durationMs } = await measureDuration(() =>
      mcpClient.listApps(req.deviceId),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "app",
      "list_apps",
      {},
      "success",
      undefined,
      durationMs,
    );

    logger.info("listed apps", { deviceId: req.deviceId, count: apps.length, durationMs });

    return { apps };
  },
);

/**
 * Launch an app on a device.
 */
export const launchApp = api(
  { expose: true, method: "POST", path: "/mobile/apps/launch" },
  async (req: LaunchAppRequest): Promise<LaunchAppResponse> => {
    logger.info("launching app", { deviceId: req.deviceId, packageName: req.packageName });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.launchApp(req.deviceId, req.packageName),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "app",
      "launch_app",
      { packageName: req.packageName },
      "success",
      message,
      durationMs,
    );

    logger.info("launched app", {
      deviceId: req.deviceId,
      packageName: req.packageName,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Terminate a running app on a device.
 */
export const terminateApp = api(
  { expose: true, method: "POST", path: "/mobile/apps/terminate" },
  async (req: TerminateAppRequest): Promise<TerminateAppResponse> => {
    logger.info("terminating app", { deviceId: req.deviceId, packageName: req.packageName });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.terminateApp(req.deviceId, req.packageName),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "app",
      "terminate_app",
      { packageName: req.packageName },
      "success",
      message,
      durationMs,
    );

    logger.info("terminated app", {
      deviceId: req.deviceId,
      packageName: req.packageName,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Install an app on a device.
 */
export const installApp = api(
  { expose: true, method: "POST", path: "/mobile/apps/install" },
  async (req: InstallAppRequest): Promise<InstallAppResponse> => {
    logger.info("installing app", { deviceId: req.deviceId, appPath: req.appPath });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.installApp(req.deviceId, req.appPath),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "app",
      "install_app",
      { appPath: req.appPath },
      "success",
      message,
      durationMs,
    );

    logger.info("installed app", { deviceId: req.deviceId, appPath: req.appPath, durationMs });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Uninstall an app from a device.
 */
export const uninstallApp = api(
  { expose: true, method: "POST", path: "/mobile/apps/uninstall" },
  async (req: UninstallAppRequest): Promise<UninstallAppResponse> => {
    logger.info("uninstalling app", { deviceId: req.deviceId, packageName: req.packageName });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.uninstallApp(req.deviceId, req.packageName),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "app",
      "uninstall_app",
      { packageName: req.packageName },
      "success",
      message,
      durationMs,
    );

    logger.info("uninstalled app", {
      deviceId: req.deviceId,
      packageName: req.packageName,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Capture a screenshot from a device.
 */
export const captureScreenshot = api(
  { expose: true, method: "POST", path: "/mobile/screen/screenshot" },
  async (req: CaptureScreenshotRequest): Promise<CaptureScreenshotResponse> => {
    logger.info("capturing screenshot", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: screenshot, durationMs } = await measureDuration(() =>
      mcpClient.captureScreenshot(req.deviceId),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "screen",
      "capture_screenshot",
      {},
      "success",
      undefined,
      durationMs,
    );

    logger.info("captured screenshot", { deviceId: req.deviceId, durationMs });

    return screenshot;
  },
);

/**
 * Get UI element hierarchy from device screen.
 */
export const getUIElements = api(
  { expose: true, method: "POST", path: "/mobile/screen/elements" },
  async (req: GetUIElementsRequest): Promise<GetUIElementsResponse> => {
    logger.info("getting UI elements", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result, durationMs } = await measureDuration(() =>
      mcpClient.getUIElements(req.deviceId),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "screen",
      "get_ui_elements",
      {},
      "success",
      undefined,
      durationMs,
    );

    logger.info("got UI elements", { deviceId: req.deviceId, durationMs });

    return result;
  },
);

/**
 * Tap at specific coordinates on device screen.
 */
export const tapAtCoordinates = api(
  { expose: true, method: "POST", path: "/mobile/input/tap" },
  async (req: TapAtCoordinatesRequest): Promise<TapAtCoordinatesResponse> => {
    logger.info("tapping at coordinates", { deviceId: req.deviceId, x: req.x, y: req.y });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.tapAtCoordinates(req.deviceId, req.x, req.y),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "tap",
      { x: req.x, y: req.y },
      "success",
      message,
      durationMs,
    );

    logger.info("tapped at coordinates", {
      deviceId: req.deviceId,
      x: req.x,
      y: req.y,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Long press at specific coordinates on device screen.
 */
export const longPressAtCoordinates = api(
  { expose: true, method: "POST", path: "/mobile/input/long-press" },
  async (req: LongPressAtCoordinatesRequest): Promise<LongPressAtCoordinatesResponse> => {
    logger.info("long pressing at coordinates", { deviceId: req.deviceId, x: req.x, y: req.y });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.longPressAtCoordinates(req.deviceId, req.x, req.y, req.durationMs),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "long_press",
      { x: req.x, y: req.y, durationMs: req.durationMs },
      "success",
      message,
      durationMs,
    );

    logger.info("long pressed at coordinates", {
      deviceId: req.deviceId,
      x: req.x,
      y: req.y,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Double tap at specific coordinates on device screen.
 */
export const doubleTapAtCoordinates = api(
  { expose: true, method: "POST", path: "/mobile/input/double-tap" },
  async (req: DoubleTapAtCoordinatesRequest): Promise<DoubleTapAtCoordinatesResponse> => {
    logger.info("double tapping at coordinates", { deviceId: req.deviceId, x: req.x, y: req.y });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.doubleTapAtCoordinates(req.deviceId, req.x, req.y),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "double_tap",
      { x: req.x, y: req.y },
      "success",
      message,
      durationMs,
    );

    logger.info("double tapped at coordinates", {
      deviceId: req.deviceId,
      x: req.x,
      y: req.y,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Perform swipe gesture on device screen.
 */
export const swipe = api(
  { expose: true, method: "POST", path: "/mobile/input/swipe" },
  async (req: SwipeRequest): Promise<SwipeResponse> => {
    logger.info("performing swipe", { deviceId: req.deviceId, direction: req.direction });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.swipe(req.deviceId, req.direction, req.distance, req.durationMs),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "swipe",
      { direction: req.direction, distance: req.distance, durationMs: req.durationMs },
      "success",
      message,
      durationMs,
    );

    logger.info("performed swipe", {
      deviceId: req.deviceId,
      direction: req.direction,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Type text on device.
 */
export const typeText = api(
  { expose: true, method: "POST", path: "/mobile/input/type" },
  async (req: TypeTextRequest): Promise<TypeTextResponse> => {
    logger.info("typing text", { deviceId: req.deviceId, textLength: req.text.length });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.typeText(req.deviceId, req.text, req.submit),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "type_text",
      { textLength: req.text.length, submit: req.submit },
      "success",
      message,
      durationMs,
    );

    logger.info("typed text", { deviceId: req.deviceId, textLength: req.text.length, durationMs });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Press device button (HOME, BACK, etc.).
 */
export const pressButton = api(
  { expose: true, method: "POST", path: "/mobile/input/button" },
  async (req: PressButtonRequest): Promise<PressButtonResponse> => {
    logger.info("pressing button", { deviceId: req.deviceId, button: req.button });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.pressButton(req.deviceId, req.button),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "input",
      "press_button",
      { button: req.button },
      "success",
      message,
      durationMs,
    );

    logger.info("pressed button", { deviceId: req.deviceId, button: req.button, durationMs });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Get device screen size.
 */
export const getScreenSize = api(
  { expose: true, method: "POST", path: "/mobile/screen/size" },
  async (req: GetScreenSizeRequest): Promise<GetScreenSizeResponse> => {
    logger.info("getting screen size", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();

    const screenSize = await mcpClient.getScreenSize(req.deviceId);

    logger.info("got screen size", { deviceId: req.deviceId, ...screenSize });

    return screenSize;
  },
);

/**
 * Get device orientation.
 */
export const getOrientation = api(
  { expose: true, method: "POST", path: "/mobile/screen/orientation" },
  async (req: GetOrientationRequest): Promise<GetOrientationResponse> => {
    logger.info("getting orientation", { deviceId: req.deviceId });

    const mcpClient = getMobileMCPClient();

    const orientation = await mcpClient.getOrientation(req.deviceId);

    logger.info("got orientation", { deviceId: req.deviceId, orientation });

    return { orientation };
  },
);

/**
 * Set device orientation.
 */
export const setOrientation = api(
  { expose: true, method: "POST", path: "/mobile/screen/orientation/set" },
  async (req: SetOrientationRequest): Promise<SetOrientationResponse> => {
    logger.info("setting orientation", { deviceId: req.deviceId, orientation: req.orientation });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.setOrientation(req.deviceId, req.orientation),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "device",
      "set_orientation",
      { orientation: req.orientation },
      "success",
      message,
      durationMs,
    );

    logger.info("set orientation", {
      deviceId: req.deviceId,
      orientation: req.orientation,
      durationMs,
    });

    return {
      success: true,
      message,
    };
  },
);

/**
 * Create a new device session.
 */
export const createSession = api(
  { expose: true, method: "POST", path: "/mobile/sessions/create" },
  async (req: CreateSessionRequest): Promise<CreateSessionResponse> => {
    logger.info("creating device session", { allocation: req.allocation });

    const sessionRepo = getDeviceSessionRepository();

    // For now, find first available device matching criteria
    // In future, implement smart allocation with AWS Device Farm integration
    const device = await sessionRepo.findAvailableDevice(req.allocation);

    if (!device) {
      throw new Error(`No available device matching criteria: ${JSON.stringify(req.allocation)}`);
    }

    const session = await sessionRepo.createSession(device.id, {
      allocation: req.allocation,
      deviceInfo: device,
    });

    logger.info("created device session", { sessionId: session.sessionId, deviceId: device.id });

    return { session };
  },
);

/**
 * Get device session information.
 */
export const getSession = api(
  { expose: true, method: "POST", path: "/mobile/sessions/get" },
  async (req: GetSessionRequest): Promise<GetSessionResponse> => {
    logger.info("getting session", { sessionId: req.sessionId });

    const sessionRepo = getDeviceSessionRepository();

    const session = await sessionRepo.getSession(req.sessionId);

    if (!session) {
      throw new Error(`Session not found: ${req.sessionId}`);
    }

    logger.info("got session", { sessionId: req.sessionId, deviceId: session.deviceId });

    return session;
  },
);

/**
 * Close a device session.
 */
export const closeSession = api(
  { expose: true, method: "POST", path: "/mobile/sessions/close" },
  async (req: CloseSessionRequest): Promise<CloseSessionResponse> => {
    logger.info("closing session", { sessionId: req.sessionId });

    const sessionRepo = getDeviceSessionRepository();

    await sessionRepo.closeSession(req.sessionId);

    logger.info("closed session", { sessionId: req.sessionId });

    return {
      success: true,
      message: "Session closed successfully",
    };
  },
);

/**
 * List all active device sessions.
 */
export const listSessions = api(
  { expose: true, method: "POST", path: "/mobile/sessions/list" },
  async (_req: ListSessionsRequest): Promise<ListSessionsResponse> => {
    logger.info("listing sessions");

    const sessionRepo = getDeviceSessionRepository();

    const sessions = await sessionRepo.listActiveSessions();

    logger.info("listed sessions", { count: sessions.length });

    return { sessions };
  },
);

/**
 * Open URL in device browser.
 */
export const openURL = api(
  { expose: true, method: "POST", path: "/mobile/browser/open" },
  async (req: OpenURLRequest): Promise<OpenURLResponse> => {
    logger.info("opening URL", { deviceId: req.deviceId, url: req.url });

    const mcpClient = getMobileMCPClient();
    const sessionRepo = getDeviceSessionRepository();

    const { result: message, durationMs } = await measureDuration(() =>
      mcpClient.openURL(req.deviceId, req.url),
    );

    await sessionRepo.logOperation(
      undefined,
      req.deviceId,
      "browser",
      "open_url",
      { url: req.url },
      "success",
      message,
      durationMs,
    );

    logger.info("opened URL", { deviceId: req.deviceId, url: req.url, durationMs });

    return {
      success: true,
      message,
    };
  },
);
