import { describe, expect, test, vi, beforeEach } from "vitest";
import { MobileMcpSessionAdapter } from "../session.adapter";

vi.mock("~encore/clients", () => {
  return {
    mobileMcp: {
      startSession: vi.fn(async () => ({
        sessionId: "session-123",
        runId: "run-abc",
        deviceId: "device-xyz",
        devicePlatform: "android" as const,
      })),
      stopSession: vi.fn(async () => undefined),
    },
  };
});

const getMockClient = async () => {
  const clients = await import("~encore/clients");
  return clients.mobileMcp;
};

describe("MobileMcpSessionAdapter", () => {
  beforeEach(async () => {
    const client = await getMockClient();
    client.startSession.mockClear();
    client.stopSession.mockClear();
  });

  test("ensureDevice starts a session once and caches runtime context", async () => {
    const adapter = new MobileMcpSessionAdapter();

    const runtimeContext = await adapter.ensureDevice({
      platformName: "Android",
      deviceName: "pixel",
      platformVersion: "14",
      appiumServerUrl: "http://localhost:4723",
      appPackage: "com.example.app",
    });

    expect(runtimeContext.deviceRuntimeContextId).toBe("session-123");
    expect(runtimeContext.deviceId).toBe("device-xyz");
    expect(runtimeContext.capabilitiesEcho).toMatchObject({
      platform: "android",
      appPackage: "com.example.app",
    });

    const client = await getMockClient();
    expect(client.startSession).toHaveBeenCalledTimes(1);

    const secondCall = await adapter.ensureDevice({
      platformName: "Android",
      deviceName: "pixel",
      platformVersion: "14",
      appiumServerUrl: "http://localhost:4723",
    });

    expect(secondCall).toBe(runtimeContext);
    expect(client.startSession).toHaveBeenCalledTimes(1);
  });

  test("closeSession stops the active session", async () => {
    const adapter = new MobileMcpSessionAdapter();
    await adapter.ensureDevice({
      platformName: "Android",
      deviceName: "pixel",
      platformVersion: "14",
      appiumServerUrl: "http://localhost:4723",
    });

    const client = await getMockClient();
    expect(client.stopSession).not.toHaveBeenCalled();

    await adapter.closeSession();
    expect(client.stopSession).toHaveBeenCalledWith({ sessionId: "session-123" });
  });
});
