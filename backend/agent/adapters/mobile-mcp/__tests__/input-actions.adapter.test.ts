import { describe, expect, test, beforeEach, vi } from "vitest";
import { MobileMcpInputActionsAdapter } from "../input-actions.adapter";
import type { MobileMcpSessionState } from "../session.adapter";

vi.mock("~encore/clients", () => {
  return {
    mobileMcp: {
      tap: vi.fn(async () => undefined),
      swipe: vi.fn(async () => undefined),
      longPress: vi.fn(async () => undefined),
      typeText: vi.fn(async () => undefined),
    },
  };
});

const context: MobileMcpSessionState = {
  sessionId: "session-123",
  runId: "run-xyz",
  deviceId: "device-456",
  devicePlatform: "android",
  runtimeContext: {
    deviceRuntimeContextId: "session-123",
    deviceId: "device-456",
    capabilitiesEcho: {},
    healthProbeStatus: "HEALTHY",
  },
};

const getMockClient = async () => {
  const clients = await import("~encore/clients");
  return clients.mobileMcp;
};

describe("MobileMcpInputActionsAdapter", () => {
  beforeEach(async () => {
    const client = await getMockClient();
    client.tap.mockClear();
    client.swipe.mockClear();
    client.longPress.mockClear();
    client.typeText.mockClear();
  });

  test("performTap forwards coordinates to Mobile MCP", async () => {
    const adapter = new MobileMcpInputActionsAdapter(() => context);
    await adapter.performTap(10, 20);
    const client = await getMockClient();
    expect(client.tap).toHaveBeenCalledWith({ sessionId: "session-123", x: 10, y: 20 });
  });

  test("performSwipe forwards swipe arguments", async () => {
    const adapter = new MobileMcpInputActionsAdapter(() => context);
    await adapter.performSwipe(0, 0, 100, 200, 300);
    const client = await getMockClient();
    expect(client.swipe).toHaveBeenCalledWith({
      sessionId: "session-123",
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 200,
      durationMs: 300,
    });
  });

  test("performLongPress forwards duration and coordinates", async () => {
    const adapter = new MobileMcpInputActionsAdapter(() => context);
    await adapter.performLongPress(5, 6, 700);
    const client = await getMockClient();
    expect(client.longPress).toHaveBeenCalledWith({
      sessionId: "session-123",
      x: 5,
      y: 6,
      durationMs: 700,
    });
  });

  test("performTextInput sends text payload", async () => {
    const adapter = new MobileMcpInputActionsAdapter(() => context);
    await adapter.performTextInput("hello");
    const client = await getMockClient();
    expect(client.typeText).toHaveBeenCalledWith({
      sessionId: "session-123",
      text: "hello",
    });
  });
});
