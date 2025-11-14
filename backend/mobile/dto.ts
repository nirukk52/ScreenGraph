/** Data Transfer Objects for mobile service API endpoints. */

import type {
  AppInfo,
  DeviceAllocationRequest,
  DeviceButton,
  DeviceInfo,
  DeviceSession,
  Orientation,
  Screenshot,
  SwipeDirection,
  ToolResult,
  UIElement,
} from "./types";

/** Request to list all available devices. */
export type ListDevicesRequest = Record<string, never>;

/** Response containing list of available devices. */
export interface ListDevicesResponse {
  /** Array of available devices. */
  devices: DeviceInfo[];
}

/** Request to get device information. */
export interface GetDeviceInfoRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing device information. */
export interface GetDeviceInfoResponse extends DeviceInfo {}

/** Request to list apps on a device. */
export interface ListAppsRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing list of installed apps. */
export interface ListAppsResponse {
  /** Array of installed apps. */
  apps: AppInfo[];
}

/** Request to launch an app. */
export interface LaunchAppRequest {
  /** Device identifier. */
  deviceId: string;
  /** Package name (Android) or Bundle ID (iOS). */
  packageName: string;
}

/** Response from launching an app. */
export interface LaunchAppResponse extends ToolResult {}

/** Request to terminate an app. */
export interface TerminateAppRequest {
  /** Device identifier. */
  deviceId: string;
  /** Package name (Android) or Bundle ID (iOS). */
  packageName: string;
}

/** Response from terminating an app. */
export interface TerminateAppResponse extends ToolResult {}

/** Request to install an app. */
export interface InstallAppRequest {
  /** Device identifier. */
  deviceId: string;
  /** Path to app file (.apk for Android, .ipa for iOS, .app for iOS simulator). */
  appPath: string;
}

/** Response from installing an app. */
export interface InstallAppResponse extends ToolResult {}

/** Request to uninstall an app. */
export interface UninstallAppRequest {
  /** Device identifier. */
  deviceId: string;
  /** Package name (Android) or Bundle ID (iOS). */
  packageName: string;
}

/** Response from uninstalling an app. */
export interface UninstallAppResponse extends ToolResult {}

/** Request to capture screenshot. */
export interface CaptureScreenshotRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing screenshot data. */
export interface CaptureScreenshotResponse extends Screenshot {}

/** Request to get UI element tree. */
export interface GetUIElementsRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing UI element hierarchy. */
export interface GetUIElementsResponse {
  /** Root UI elements. */
  elements: UIElement[];
  /** Source XML (for debugging). */
  sourceXml?: string;
}

/** Request to tap at coordinates. */
export interface TapAtCoordinatesRequest {
  /** Device identifier. */
  deviceId: string;
  /** X coordinate in pixels. */
  x: number;
  /** Y coordinate in pixels. */
  y: number;
}

/** Response from tap action. */
export interface TapAtCoordinatesResponse extends ToolResult {}

/** Request to long press at coordinates. */
export interface LongPressAtCoordinatesRequest {
  /** Device identifier. */
  deviceId: string;
  /** X coordinate in pixels. */
  x: number;
  /** Y coordinate in pixels. */
  y: number;
  /** Press duration in milliseconds. */
  durationMs?: number;
}

/** Response from long press action. */
export interface LongPressAtCoordinatesResponse extends ToolResult {}

/** Request to double tap at coordinates. */
export interface DoubleTapAtCoordinatesRequest {
  /** Device identifier. */
  deviceId: string;
  /** X coordinate in pixels. */
  x: number;
  /** Y coordinate in pixels. */
  y: number;
}

/** Response from double tap action. */
export interface DoubleTapAtCoordinatesResponse extends ToolResult {}

/** Request to perform swipe gesture. */
export interface SwipeRequest {
  /** Device identifier. */
  deviceId: string;
  /** Swipe direction. */
  direction: SwipeDirection;
  /** Swipe distance as percentage of screen (0.0 to 1.0). */
  distance?: number;
  /** Swipe duration in milliseconds. */
  durationMs?: number;
}

/** Response from swipe action. */
export interface SwipeResponse extends ToolResult {}

/** Request to type text. */
export interface TypeTextRequest {
  /** Device identifier. */
  deviceId: string;
  /** Text to type. */
  text: string;
  /** Whether to submit after typing (press Enter). */
  submit?: boolean;
}

/** Response from type text action. */
export interface TypeTextResponse extends ToolResult {}

/** Request to press device button. */
export interface PressButtonRequest {
  /** Device identifier. */
  deviceId: string;
  /** Button identifier. */
  button: DeviceButton;
}

/** Response from press button action. */
export interface PressButtonResponse extends ToolResult {}

/** Request to get screen size. */
export interface GetScreenSizeRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing screen dimensions. */
export interface GetScreenSizeResponse {
  /** Screen width in pixels. */
  width: number;
  /** Screen height in pixels. */
  height: number;
}

/** Request to get device orientation. */
export interface GetOrientationRequest {
  /** Device identifier. */
  deviceId: string;
}

/** Response containing current orientation. */
export interface GetOrientationResponse {
  /** Current orientation. */
  orientation: Orientation;
}

/** Request to set device orientation. */
export interface SetOrientationRequest {
  /** Device identifier. */
  deviceId: string;
  /** Desired orientation. */
  orientation: Orientation;
}

/** Response from set orientation action. */
export interface SetOrientationResponse extends ToolResult {}

/** Request to create device session. */
export interface CreateSessionRequest {
  /** Device allocation preferences. */
  allocation: DeviceAllocationRequest;
}

/** Response containing new session information. */
export interface CreateSessionResponse {
  /** Device session details. */
  session: DeviceSession;
}

/** Request to get session information. */
export interface GetSessionRequest {
  /** Session identifier. */
  sessionId: string;
}

/** Response containing session information. */
export interface GetSessionResponse extends DeviceSession {}

/** Request to close device session. */
export interface CloseSessionRequest {
  /** Session identifier. */
  sessionId: string;
}

/** Response from closing session. */
export interface CloseSessionResponse extends ToolResult {}

/** Request to list active sessions. */
export type ListSessionsRequest = Record<string, never>;

/** Response containing list of active sessions. */
export interface ListSessionsResponse {
  /** Array of active sessions. */
  sessions: DeviceSession[];
}

/** Request to open URL in device browser. */
export interface OpenURLRequest {
  /** Device identifier. */
  deviceId: string;
  /** URL to open. */
  url: string;
}

/** Response from opening URL. */
export interface OpenURLResponse extends ToolResult {}
