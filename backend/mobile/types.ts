/** Type definitions for mobile device automation service. */

/** Device platform type. */
export type DevicePlatform = "android" | "ios";

/** Device type classification. */
export type DeviceType = "real" | "emulator" | "simulator";

/** Device information. */
export interface DeviceInfo {
  /** Unique device identifier (UDID for iOS, ADB serial for Android). */
  id: string;
  /** Human-readable device name. */
  name: string;
  /** Platform (iOS or Android). */
  platform: DevicePlatform;
  /** Device type (real device, emulator, or simulator). */
  type: DeviceType;
  /** OS version string. */
  version: string;
  /** Screen width in pixels. */
  screenWidth?: number;
  /** Screen height in pixels. */
  screenHeight?: number;
  /** Current orientation (portrait or landscape). */
  orientation?: "portrait" | "landscape";
}

/** Installed app information. */
export interface AppInfo {
  /** Package name (Android) or Bundle ID (iOS). */
  packageName: string;
  /** Human-readable app name. */
  appName: string;
  /** App version string. */
  version?: string;
}

/** UI element from accessibility tree. */
export interface UIElement {
  /** Element identifier (resource-id, accessibility-id). */
  id?: string;
  /** Element type (Button, TextView, EditText, etc.). */
  type: string;
  /** Visible text content. */
  text?: string;
  /** Accessibility label. */
  label?: string;
  /** Content description. */
  contentDescription?: string;
  /** Bounding box coordinates. */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Whether element is clickable. */
  clickable: boolean;
  /** Whether element is focusable. */
  focusable: boolean;
  /** Whether element is enabled. */
  enabled: boolean;
  /** Whether element is currently visible. */
  visible: boolean;
  /** Child elements. */
  children?: UIElement[];
}

/** Screen orientation type. */
export type Orientation = "portrait" | "landscape";

/** Swipe direction. */
export type SwipeDirection = "up" | "down" | "left" | "right";

/** Device button identifier. */
export type DeviceButton = "HOME" | "BACK" | "VOLUME_UP" | "VOLUME_DOWN" | "ENTER" | "DELETE";

/** Screenshot capture result. */
export interface Screenshot {
  /** Base64-encoded PNG image data. */
  data: string;
  /** Image width in pixels. */
  width: number;
  /** Image height in pixels. */
  height: number;
  /** Timestamp when screenshot was captured (ISO 8601). */
  timestamp: string;
}

/** Device session state. */
export type SessionState = "idle" | "connected" | "busy" | "disconnected" | "error";

/** Device session tracking. */
export interface DeviceSession {
  /** Unique session identifier. */
  sessionId: string;
  /** Device identifier. */
  deviceId: string;
  /** Current state. */
  state: SessionState;
  /** Currently running app package name. */
  currentApp?: string;
  /** Session start time (ISO 8601). */
  startedAt: string;
  /** Session last activity time (ISO 8601). */
  lastActivityAt: string;
  /** Session metadata (connection info, capabilities, etc.). */
  metadata: Record<string, unknown>;
}

/** Mobile MCP tool invocation result. */
export interface ToolResult {
  /** Whether the operation succeeded. */
  success: boolean;
  /** Result message or error description. */
  message: string;
  /** Additional result data (device-specific). */
  data?: Record<string, unknown>;
}

/** AWS Device Farm project configuration. */
export interface DeviceFarmConfig {
  /** AWS region. */
  region: string;
  /** Device Farm project ARN. */
  projectArn: string;
  /** Device pool ARN (optional, defaults to all devices). */
  devicePoolArn?: string;
  /** Test timeout in minutes. */
  testTimeoutMinutes: number;
}

/** Device provider type. */
export type DeviceProvider = "local" | "aws-device-farm";

/** Device allocation request. */
export interface DeviceAllocationRequest {
  /** Preferred platform. */
  platform: DevicePlatform;
  /** Preferred device type. */
  deviceType?: DeviceType;
  /** Preferred OS version (semver range). */
  version?: string;
  /** Device provider preference. */
  provider?: DeviceProvider;
}
