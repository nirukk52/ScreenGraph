import type { ToolInvocationResult as SdkToolInvocationResult } from "@modelcontextprotocol/sdk/types";

/**
 * MobileMcpToolName enumerates the MCP tool identifiers we expose via Encore APIs.
 * PURPOSE: Keeps tool routing type-safe and aligned with upstream Mobile MCP server identifiers.
 */
export type MobileMcpToolName =
  | "mobile_take_screenshot"
  | "mobile_list_elements_on_screen"
  | "mobile_click_on_screen_at_coordinates"
  | "mobile_type_keys"
  | "mobile_swipe_on_screen"
  | "mobile_launch_app"
  | "mobile_get_screen_size"
  | "mobile_press_button"
  | "mobile_long_press_on_screen_at_coordinates";

export type MobilePlatformKind = "android" | "ios";

/**
 * StartSessionRequest captures the inputs required to allocate a Mobile MCP session.
 * PURPOSE: Allows the agent orchestrator to request a device with optional hints when creating a session.
 */
export interface StartSessionRequest {
  runId?: string;
  platform: MobilePlatformKind;
  deviceAlias?: string;
  appPackageId?: string;
  projectArnOverride?: string;
  devicePoolArnOverride?: string;
}

/**
 * StartSessionResponse returns identifiers and metadata for a Mobile MCP session.
 * PURPOSE: Provides the agent with a deterministic device context token for subsequent tool invocations.
 */
export interface StartSessionResponse {
  sessionId: string;
  runId: string;
  deviceId: string;
  devicePlatform: MobilePlatformKind;
  deviceFarmJobArn?: string;
  appiumEndpointUrl?: string;
  mcpSessionToken?: string;
}

/**
 * ScreenshotResponse represents the normalized payload returned after invoking mobile_take_screenshot.
 * PURPOSE: Supplies base64 image data and derived metadata to the agent perception pipeline.
 */
export interface ScreenshotResponse {
  base64Image: string;
  mimeType: "image/png" | "image/jpeg";
  widthPx: number;
  heightPx: number;
  capturedAtIso: string;
}

/**
 * ScreenDimensionsResponse exposes the device viewport size used by the agent.
 * PURPOSE: Provides deterministic width/height metrics sourced from Mobile MCP.
 */
export interface ScreenDimensionsResponse {
  widthPx: number;
  heightPx: number;
}

/**
 * AccessibilityNode describes a UI element derived from the Mobile MCP accessibility tool output.
 * PURPOSE: Enables agent consumers to reason about the UI hierarchy without parsing raw MCP output.
 */
export interface AccessibilityNode {
  type: string;
  text?: string;
  label?: string;
  name?: string;
  value?: string;
  identifier?: string;
  focused?: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * AccessibilityTreeResponse packages the tree both as structured nodes and serialized XML.
 * PURPOSE: Supports existing XML-based downstream processors while preserving structured data.
 */
export interface AccessibilityTreeResponse {
  nodes: AccessibilityNode[];
  xml: string;
  capturedAtIso: string;
}

/**
 * TapRequest describes the parameters for invoking the tap MCP tool.
 * PURPOSE: Keeps tap input type-safe when exposed via Encore APIs.
 */
export interface TapRequest {
  x: number;
  y: number;
}

/**
 * TypeRequest encapsulates the payload needed to send text to the focused element.
 * PURPOSE: Allows the agent to trigger text entry while controlling submit semantics.
 */
export interface TypeRequest {
  text: string;
  submit?: boolean;
}

/**
 * SwipeRequest models a swipe gesture using start & end coordinates.
 * PURPOSE: Enables translation into Mobile MCP direction-based swipe arguments.
 */
export interface SwipeRequest {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs?: number;
}

/**
 * LaunchAppRequest carries the package identifier required to launch the target app.
 * PURPOSE: Provides typed data for the mobile_launch_app MCP tool.
 */
export interface LaunchAppRequest {
  packageName: string;
}

/**
 * PressButtonRequest describes a navigation button press request.
 * PURPOSE: Enables callers to trigger system buttons such as BACK or HOME through Mobile MCP.
 */
export interface PressButtonRequest {
  button: "BACK" | "HOME" | "VOLUME_UP" | "VOLUME_DOWN" | "ENTER";
}

/**
 * LongPressRequest models a long-press gesture.
 * PURPOSE: Enables deliberate press-and-hold interactions via Mobile MCP.
 */
export interface LongPressRequest {
  x: number;
  y: number;
  durationMs?: number;
}

/**
 * ToolInvocationResult captures the normalized outcome of executing a Mobile MCP tool.
 * PURPOSE: Encodes success/error states for use by Encore endpoints and SSE streams.
 */
export interface ToolInvocationResult {
  status: "SUCCEEDED" | "FAILED";
  summary: string;
  payload?: Record<string, unknown>;
  errorMessage?: string;
  rawResult?: SdkToolInvocationResult;
}

/**
 * ToolStreamHandshake represents metadata flowing from clients when establishing the SSE bridge.
 * PURPOSE: Conveys which tool to invoke and which arguments to forward to Mobile MCP.
 */
export interface ToolStreamHandshake {
  sessionId: string;
  toolName: MobileMcpToolName;
  arguments?: Record<string, unknown>;
  correlationId?: string;
  runId?: string;
}

/**
 * ToolStreamEvent defines the shape of SSE payloads emitted during tool execution.
 * PURPOSE: Provides deterministic event sequencing for client listeners.
 */
export interface ToolStreamEvent {
  correlationId?: string;
  stage: "started" | "progress" | "completed" | "failed";
  summary: string;
  payload?: Record<string, unknown>;
  errorMessage?: string;
}
