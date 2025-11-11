import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";

import type {
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
  ToolInvocationEvent,
  ToolStreamHandshake,
  ToolInvocationResult,
  TypeRequest,
} from "./dto";
import { mobileMcpService } from "./service";

interface StopSessionRequest {
  sessionId: string;
}

interface ToolInvocationRequest {
  sessionId: string;
}

const logger = log.with({ module: "mobile-mcp", actor: "controller" });

export const startSession = api<StartSessionRequest, StartSessionResponse>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/start" },
  async (req) => {
    logger.info("HTTP start session request received", { runId: req.runId, platform: req.platform });
    return await mobileMcpService.startSession(req);
  },
);

export const stopSession = api<StopSessionRequest, void>(
  { expose: true, method: "DELETE", path: "/mobile-mcp/sessions/:sessionId" },
  async (req) => {
    logger.info("HTTP stop session request received", { sessionId: req.sessionId });
    await mobileMcpService.stopSession(req.sessionId);
  },
);

export const captureScreenshot = api<ToolInvocationRequest, ScreenshotResponse>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_take_screenshot" },
  async (req) => {
    logger.info("HTTP screenshot request received", { sessionId: req.sessionId });
    return await mobileMcpService.captureScreenshot(req.sessionId);
  },
);

export const fetchAccessibilityTree = api<ToolInvocationRequest, AccessibilityTreeResponse>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_list_elements_on_screen" },
  async (req) => {
    logger.info("HTTP accessibility tree request received", { sessionId: req.sessionId });
    return await mobileMcpService.fetchAccessibilityTree(req.sessionId);
  },
);

export const fetchScreenDimensions = api<ToolInvocationRequest, ScreenDimensionsResponse>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_get_screen_size" },
  async (req) => {
    logger.info("HTTP screen size request received", { sessionId: req.sessionId });
    return await mobileMcpService.getScreenDimensions(req.sessionId);
  },
);

export const tap = api<ToolInvocationRequest & TapRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_click_on_screen_at_coordinates" },
  async (req) => {
    logger.info("HTTP tap request received", { sessionId: req.sessionId, x: req.x, y: req.y });
    return await mobileMcpService.performTap(req.sessionId, { x: req.x, y: req.y });
  },
);

export const typeText = api<ToolInvocationRequest & TypeRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_type_keys" },
  async (req) => {
    logger.info("HTTP type request received", { sessionId: req.sessionId, submit: req.submit });
    return await mobileMcpService.performType(req.sessionId, { text: req.text, submit: req.submit });
  },
);

export const swipe = api<ToolInvocationRequest & SwipeRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_swipe_on_screen" },
  async (req) => {
    logger.info("HTTP swipe request received", {
      sessionId: req.sessionId,
      startX: req.startX,
      startY: req.startY,
      endX: req.endX,
      endY: req.endY,
    });
    return await mobileMcpService.performSwipe(req.sessionId, {
      startX: req.startX,
      startY: req.startY,
      endX: req.endX,
      endY: req.endY,
      durationMs: req.durationMs,
    });
  },
);

export const launchApp = api<ToolInvocationRequest & LaunchAppRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_launch_app" },
  async (req) => {
    logger.info("HTTP launch app request received", { sessionId: req.sessionId, packageName: req.packageName });
    return await mobileMcpService.launchApp(req.sessionId, { packageName: req.packageName });
  },
);

export const pressButton = api<ToolInvocationRequest & PressButtonRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_press_button" },
  async (req) => {
    logger.info("HTTP press button request received", { sessionId: req.sessionId, button: req.button });
    return await mobileMcpService.pressButton(req.sessionId, { button: req.button });
  },
);

export const longPress = api<ToolInvocationRequest & LongPressRequest, ToolInvocationResult>(
  { expose: true, method: "POST", path: "/mobile-mcp/sessions/:sessionId/tools/mobile_long_press_on_screen_at_coordinates" },
  async (req) => {
    logger.info("HTTP long press request received", {
      sessionId: req.sessionId,
      x: req.x,
      y: req.y,
      durationMs: req.durationMs,
    });
    return await mobileMcpService.performLongPress(req.sessionId, {
      x: req.x,
      y: req.y,
      durationMs: req.durationMs,
    });
  },
);

export const toolStream = api.streamOut<ToolStreamHandshake, ToolInvocationEvent>(
  { expose: true, path: "/mobile-mcp/sessions/:sessionId/tools/stream" },
  async (handshake, stream) => {
    logger.info("SSE tool stream opened", {
      sessionId: handshake.sessionId,
      toolName: handshake.toolName,
      correlationId: handshake.correlationId,
    });

    const sendEvent = async (event: ToolInvocationEvent): Promise<void> => {
      await stream.send(event);
    };

    await sendEvent({
      stage: "started",
      summary: `Invoking ${handshake.toolName}`,
      correlationId: handshake.correlationId,
      payload: {
        runId: handshake.runId,
      },
    });

    try {
      const result = await mobileMcpService.invokeGenericTool(handshake.sessionId, handshake.toolName, handshake.arguments ?? {});
      await sendEvent({
        stage: "completed",
        summary: result.summary,
        correlationId: handshake.correlationId,
        payload: result.payload,
      });
    } catch (err) {
      const errorMessage =
        err instanceof APIError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unknown Mobile MCP error";
      await sendEvent({
        stage: "failed",
        summary: `Failed to invoke ${handshake.toolName}`,
        correlationId: handshake.correlationId,
        errorMessage,
      });
      throw err;
    } finally {
      logger.info("SSE tool stream closed", {
        sessionId: handshake.sessionId,
        toolName: handshake.toolName,
        correlationId: handshake.correlationId,
      });
    }
  },
);
