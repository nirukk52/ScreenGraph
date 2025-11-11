import { ulid } from "ulidx";
import { APIError } from "encore.dev/api";
import log from "encore.dev/log";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types";
import { AwsDeviceFarmConnector } from "./aws-device-farm-connector";
import type {
  AccessibilityNode,
  AccessibilityTreeResponse,
  LaunchAppRequest,
  MobileMcpToolName,
  LongPressRequest,
  PressButtonRequest,
  ScreenDimensionsResponse,
  ScreenshotResponse,
  StartSessionRequest,
  StartSessionResponse,
  SwipeRequest,
  TapRequest,
  ToolInvocationResult,
  TypeRequest,
} from "./dto";
import { MobileMcpRuntime } from "./mobile-mcp.runtime";
import { MobileMcpSessionRegistry } from "./session-registry";

interface SessionContext {
  sessionId: string;
  runId: string;
  deviceId: string;
  devicePlatform: "android" | "ios";
  deviceFarmJobArn?: string | null;
  runtime: MobileMcpRuntime;
}

/**
 * MobileMcpOrchestrationService coordinates session lifecycle and tool execution.
 * PURPOSE: Serves as the business layer between Encore APIs and the embedded Mobile MCP runtime.
 */
export class MobileMcpOrchestrationService {
  private readonly logger = log.with({ module: "mobile-mcp", actor: "service" });

  constructor(
    private readonly registry: MobileMcpSessionRegistry,
    private readonly connector: AwsDeviceFarmConnector,
  ) {}

  /**
   * startSession provisions a new Mobile MCP session and persists its metadata.
   * PURPOSE: Creates the deterministic device runtime context consumed by the agent orchestrator.
   */
  async startSession(request: StartSessionRequest): Promise<StartSessionResponse> {
    const sessionId = ulid();
    const resolvedRunId = request.runId ?? ulid();
    const runtime = new MobileMcpRuntime({ runtimeLabel: sessionId });

    const deviceDetails = await this.connector.startSession({
      runId: resolvedRunId,
      platform: request.platform,
      devicePoolArnOverride: request.devicePoolArnOverride,
      projectArnOverride: request.projectArnOverride,
    });

    await this.registry.createSession(sessionId, resolvedRunId, request.platform, deviceDetails, runtime);

    const response: StartSessionResponse = {
      sessionId,
      runId: resolvedRunId,
      deviceId: deviceDetails.deviceId,
      devicePlatform: request.platform,
      deviceFarmJobArn: deviceDetails.deviceFarmJobArn,
      appiumEndpointUrl: deviceDetails.appiumEndpointUrl,
      mcpSessionToken: deviceDetails.mcpSessionToken,
    };

    this.logger.info("Mobile MCP session started", {
      sessionId,
      runId: resolvedRunId,
      deviceId: deviceDetails.deviceId,
    });

    return response;
  }

  /**
   * stopSession tears down the runtime, releases Device Farm resources, and removes registry state.
   * PURPOSE: Ensures sessions do not leak once the agent finishes interacting with the device.
   */
  async stopSession(sessionId: string): Promise<void> {
    const context = this.getSessionContext(sessionId);
    await this.connector.stopSession(context.deviceFarmJobArn ?? undefined);
    await this.registry.removeSession(sessionId);
    this.logger.info("Mobile MCP session stopped", { sessionId, runId: context.runId });
  }

  /**
   * captureScreenshot executes mobile_take_screenshot and augments it with screen dimensions.
   * PURPOSE: Supplies perception pipelines with both raw imagery and sizing information.
   */
  async captureScreenshot(sessionId: string): Promise<ScreenshotResponse> {
    const context = this.getSessionContext(sessionId);

    const result = await context.runtime.callTool("mobile_take_screenshot", {
      device: context.deviceId,
    });

    if (result.isError) {
      throw APIError.failedPrecondition(this.buildErrorMessage(result));
    }

    const imageContent = result.content?.find((item) => item.type === "image");
    if (!imageContent || imageContent.type !== "image") {
      throw APIError.internal("Mobile MCP screenshot response missing image content");
    }

    const screenSizeResult = await context.runtime.callTool("mobile_get_screen_size", {
      device: context.deviceId,
    });
    const screenSizeText = this.extractText(screenSizeResult);
    const dimensions = this.parseScreenSize(screenSizeText);
    if (!dimensions) {
      throw APIError.internal("Unable to determine screen dimensions from Mobile MCP response");
    }

    const response: ScreenshotResponse = {
      base64Image: imageContent.data,
      mimeType: imageContent.mimeType === "image/jpeg" ? "image/jpeg" : "image/png",
      widthPx: dimensions.width,
      heightPx: dimensions.height,
      capturedAtIso: new Date().toISOString(),
    };

    await this.registry.markHeartbeat(sessionId);
    return response;
  }

  /**
   * getScreenDimensions returns the current viewport dimensions of the active device.
   * PURPOSE: Allows consumers to fetch screen metrics without triggering a screenshot.
   */
  async getScreenDimensions(sessionId: string): Promise<ScreenDimensionsResponse> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_get_screen_size", {
      device: context.deviceId,
    });

    if (result.isError) {
      throw APIError.failedPrecondition(this.buildErrorMessage(result));
    }

    const dimensions = this.parseScreenSize(this.extractText(result));
    if (!dimensions) {
      throw APIError.internal("Unable to parse screen dimensions returned by Mobile MCP");
    }

    await this.registry.markHeartbeat(sessionId);
    return {
      widthPx: dimensions.width,
      heightPx: dimensions.height,
    };
  }

  /**
   * fetchAccessibilityTree retrieves and normalizes the accessibility tree for the current screen.
   * PURPOSE: Provides downstream components with structured accessibility data and an XML representation.
   */
  async fetchAccessibilityTree(sessionId: string): Promise<AccessibilityTreeResponse> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_list_elements_on_screen", {
      device: context.deviceId,
    });

    if (result.isError) {
      throw APIError.failedPrecondition(this.buildErrorMessage(result));
    }

    const treeText = this.extractText(result);
    const nodes = this.parseAccessibilityNodes(treeText);
    const xml = this.buildAccessibilityXml(nodes);

    await this.registry.markHeartbeat(sessionId);
    return {
      nodes,
      xml,
      capturedAtIso: new Date().toISOString(),
    };
  }

  /**
   * performTap dispatches a coordinate tap via Mobile MCP.
   * PURPOSE: Bridges agent tap actions to the device session.
   */
  async performTap(sessionId: string, request: TapRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_click_on_screen_at_coordinates", {
      device: context.deviceId,
      x: request.x,
      y: request.y,
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(result, `Tapped coordinates (${request.x}, ${request.y})`);
  }

  /**
   * performType sends text input through Mobile MCP.
   * PURPOSE: Enables the agent to enter text programmatically on the target device.
   */
  async performType(sessionId: string, request: TypeRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_type_keys", {
      device: context.deviceId,
      text: request.text,
      submit: Boolean(request.submit),
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(result, `Typed text '${request.text}'`);
  }

  /**
   * performSwipe translates coordinate-based swipe requests to Mobile MCP direction gestures.
   * PURPOSE: Supports agent gestures without requiring direction-specific semantics upstream.
   */
  async performSwipe(sessionId: string, request: SwipeRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const swipeArguments = this.translateSwipeArguments(request);
    const result = await context.runtime.callTool("mobile_swipe_on_screen", {
      device: context.deviceId,
      direction: swipeArguments.direction,
      x: swipeArguments.x,
      y: swipeArguments.y,
      distance: swipeArguments.distance,
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(
      result,
      `Swiped ${swipeArguments.direction} from (${swipeArguments.x}, ${swipeArguments.y})`,
    );
  }

  /**
   * launchApp opens the specified package via Mobile MCP.
   * PURPOSE: Allows the agent orchestrator to foreground the target application.
   */
  async launchApp(sessionId: string, request: LaunchAppRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_launch_app", {
      device: context.deviceId,
      packageName: request.packageName,
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(result, `Launched app ${request.packageName}`);
  }

  /**
   * pressButton submits a system button press via Mobile MCP.
   * PURPOSE: Enables navigation actions such as BACK or HOME.
   */
  async pressButton(sessionId: string, request: PressButtonRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_press_button", {
      device: context.deviceId,
      button: request.button,
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(result, `Pressed device button ${request.button}`);
  }

  /**
   * performLongPress issues a long press gesture through Mobile MCP.
   * PURPOSE: Enables press-and-hold interactions for context menus or drag initiations.
   */
  async performLongPress(sessionId: string, request: LongPressRequest): Promise<ToolInvocationResult> {
    const context = this.getSessionContext(sessionId);
    const result = await context.runtime.callTool("mobile_long_press_on_screen_at_coordinates", {
      device: context.deviceId,
      x: request.x,
      y: request.y,
      durationMs: request.durationMs ?? 800,
    });
    await this.registry.markHeartbeat(sessionId);
    return this.normalizeToolResult(result, `Long press at (${request.x}, ${request.y})`);
  }

  /**
   * invokeGenericTool provides a uniform representation used by the SSE bridge.
   * PURPOSE: Allows streaming clients to consume normalized tool results across supported operations.
   */
  async invokeGenericTool(
    sessionId: string,
    toolName: MobileMcpToolName,
    args: Record<string, unknown>,
  ): Promise<ToolInvocationResult> {
    switch (toolName) {
      case "mobile_take_screenshot": {
        const payload = await this.captureScreenshot(sessionId);
        return {
          status: "SUCCEEDED",
          summary: "Screenshot captured",
          payload,
        };
      }
      case "mobile_list_elements_on_screen": {
        const payload = await this.fetchAccessibilityTree(sessionId);
        return {
          status: "SUCCEEDED",
          summary: "Accessibility tree captured",
          payload,
        };
      }
      case "mobile_get_screen_size": {
        const payload = await this.getScreenDimensions(sessionId);
        return {
          status: "SUCCEEDED",
          summary: "Screen dimensions retrieved",
          payload,
        };
      }
      case "mobile_click_on_screen_at_coordinates": {
        const tapArgs = this.coerceTapArguments(args);
        return await this.performTap(sessionId, tapArgs);
      }
      case "mobile_type_keys": {
        const typeArgs = this.coerceTypeArguments(args);
        return await this.performType(sessionId, typeArgs);
      }
      case "mobile_swipe_on_screen": {
        const swipeArgs = this.coerceSwipeArguments(args);
        return await this.performSwipe(sessionId, swipeArgs);
      }
      case "mobile_launch_app": {
        const launchArgs = this.coerceLaunchAppArguments(args);
        return await this.launchApp(sessionId, launchArgs);
      }
      case "mobile_press_button": {
        const buttonArgs = this.coercePressButtonArguments(args);
        return await this.pressButton(sessionId, buttonArgs);
      }
      case "mobile_long_press_on_screen_at_coordinates": {
        const longPressArgs = this.coerceLongPressArguments(args);
        return await this.performLongPress(sessionId, longPressArgs);
      }
      default:
        throw APIError.invalidArgument(`Unsupported Mobile MCP tool: ${toolName}`);
    }
  }

  private getSessionContext(sessionId: string): SessionContext {
    const row = this.registry.getSession(sessionId);
    const runtime = this.registry.getRuntime(sessionId);
    if (!row || !runtime) {
      throw APIError.notFound("Mobile MCP session not found");
    }
    return {
      sessionId,
      runId: row.runId,
      deviceId: row.deviceId,
      devicePlatform: row.devicePlatform,
      deviceFarmJobArn: row.deviceFarmJobArn ?? undefined,
      runtime,
    };
  }

  private buildErrorMessage(result: CallToolResult): string {
    if (!result.content?.length) {
      return "Mobile MCP reported an error without additional details";
    }
    const messageParts = result.content
      .filter((item) => item.type === "text" && item.text)
      .map((item) => item.text as string);
    if (!messageParts.length) {
      return "Mobile MCP reported an error without additional details";
    }
    return messageParts.join(" ");
  }

  private extractText(result: CallToolResult): string {
    if (!result.content) {
      return "";
    }
    for (const item of result.content) {
      if (item.type === "text" && item.text) {
        return item.text;
      }
    }
    return "";
  }

  private parseScreenSize(message: string): { width: number; height: number } | null {
    const match = message.match(/(\d+)\s*x\s*(\d+)/i);
    if (!match) {
      return null;
    }
    return {
      width: Number.parseInt(match[1], 10),
      height: Number.parseInt(match[2], 10),
    };
  }

  private parseAccessibilityNodes(raw: string): AccessibilityNode[] {
    const prefix = "Found these elements on screen:";
    const jsonSegment = raw.includes(prefix) ? raw.substring(raw.indexOf(prefix) + prefix.length).trim() : raw.trim();
    if (!jsonSegment) {
      return [];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonSegment);
    } catch (err) {
      this.logger.warn("Failed to parse accessibility JSON payload", { err, jsonSegment });
      throw APIError.internal("Unable to parse accessibility tree returned by Mobile MCP");
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((value) => {
      const element = value as Record<string, unknown>;
      const coordinates = element.coordinates as Record<string, unknown> | undefined;
      return {
        type: String(element.type ?? ""),
        text: typeof element.text === "string" ? element.text : undefined,
        label: typeof element.label === "string" ? element.label : undefined,
        name: typeof element.name === "string" ? element.name : undefined,
        value: typeof element.value === "string" ? element.value : undefined,
        identifier: typeof element.identifier === "string" ? element.identifier : undefined,
        focused: Boolean(element.focused),
        bounds: {
          x: Number(coordinates?.x ?? 0),
          y: Number(coordinates?.y ?? 0),
          width: Number(coordinates?.width ?? 0),
          height: Number(coordinates?.height ?? 0),
        },
      };
    });
  }

  private buildAccessibilityXml(nodes: AccessibilityNode[]): string {
    const escape = (value: string | undefined): string =>
      value ? value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;") : "";

    const elements = nodes
      .map((node) => {
        return `<node type="${escape(node.type)}" text="${escape(node.text)}" label="${escape(node.label)}" name="${escape(
          node.name,
        )}" value="${escape(node.value)}" identifier="${escape(node.identifier)}" focused="${node.focused ? "true" : "false"}" x="${
          node.bounds.x
        }" y="${node.bounds.y}" width="${node.bounds.width}" height="${node.bounds.height}" />`;
      })
      .join("");

    return `<hierarchy>${elements}</hierarchy>`;
  }

  private translateSwipeArguments(request: SwipeRequest): { direction: "up" | "down" | "left" | "right"; x: number; y: number; distance: number } {
    const deltaX = request.endX - request.startX;
    const deltaY = request.endY - request.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    let direction: "up" | "down" | "left" | "right";
    if (absX > absY) {
      direction = deltaX >= 0 ? "right" : "left";
    } else {
      direction = deltaY >= 0 ? "down" : "up";
    }

    const distance = direction === "left" || direction === "right" ? absX : absY;

    return {
      direction,
      x: request.startX,
      y: request.startY,
      distance,
    };
  }

  private normalizeToolResult(result: CallToolResult, summary: string): ToolInvocationResult {
    if (result.isError) {
      return {
        status: "FAILED",
        summary,
        errorMessage: this.buildErrorMessage(result),
        rawResult: result,
      };
    }
    const text = this.extractText(result);
    return {
      status: "SUCCEEDED",
      summary,
      payload: text ? { message: text } : undefined,
      rawResult: result,
    };
  }

  private coerceTapArguments(args: Record<string, unknown>): TapRequest {
    const x = Number(args.x);
    const y = Number(args.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw APIError.invalidArgument("Tap requires numeric x and y coordinates");
    }
    return { x, y };
  }

  private coerceTypeArguments(args: Record<string, unknown>): TypeRequest {
    const text = String(args.text ?? "");
    const submit = Boolean(args.submit);
    if (!text) {
      throw APIError.invalidArgument("Type request requires text");
    }
    return { text, submit };
  }

  private coerceSwipeArguments(args: Record<string, unknown>): SwipeRequest {
    const startX = Number(args.startX);
    const startY = Number(args.startY);
    const endX = Number(args.endX);
    const endY = Number(args.endY);
    if ([startX, startY, endX, endY].some((value) => Number.isNaN(value))) {
      throw APIError.invalidArgument("Swipe request requires numeric startX, startY, endX, and endY");
    }
    const durationMs = args.durationMs !== undefined ? Number(args.durationMs) : undefined;
    return {
      startX,
      startY,
      endX,
      endY,
      durationMs,
    };
  }

  private coerceLaunchAppArguments(args: Record<string, unknown>): LaunchAppRequest {
    const packageName = String(args.packageName ?? "");
    if (!packageName) {
      throw APIError.invalidArgument("Launch app request requires packageName");
    }
    return { packageName };
  }

  private coercePressButtonArguments(args: Record<string, unknown>): PressButtonRequest {
    const button = String(args.button ?? "") as PressButtonRequest["button"];
    if (!button) {
      throw APIError.invalidArgument("Press button request requires button");
    }
    return { button };
  }

  private coerceLongPressArguments(args: Record<string, unknown>): LongPressRequest {
    const x = Number(args.x);
    const y = Number(args.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw APIError.invalidArgument("Long press requires numeric x and y coordinates");
    }
    const durationMs = args.durationMs !== undefined ? Number(args.durationMs) : undefined;
    return { x, y, durationMs };
  }
}

/**
 * mobileMcpService is a singleton orchestration service used by Encore handlers.
 * PURPOSE: Provides a shared instance with singleton dependencies.
 */
export const mobileMcpService = new MobileMcpOrchestrationService(
  new MobileMcpSessionRegistry(),
  new AwsDeviceFarmConnector(),
);
