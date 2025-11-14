/** Integration tests for mobile device automation service. */

import { beforeAll, describe, expect, it } from "vitest";
import { getMobileMCPClient } from "./mcp-client";
import { getDeviceSessionRepository } from "./session-repo";
import type { DeviceInfo } from "./types";

describe("Mobile MCP Client", () => {
  let mcpClient: ReturnType<typeof getMobileMCPClient>;

  beforeAll(async () => {
    mcpClient = getMobileMCPClient();
    await mcpClient.initialize();
  });

  it("should list available devices", async () => {
    const devices = await mcpClient.listDevices();

    // Should return array (may be empty if no devices connected)
    expect(Array.isArray(devices)).toBe(true);

    // If devices exist, validate structure
    if (devices.length > 0) {
      const device = devices[0];
      expect(device).toHaveProperty("id");
      expect(device).toHaveProperty("name");
      expect(device).toHaveProperty("platform");
      expect(device).toHaveProperty("type");
      expect(device).toHaveProperty("version");
      expect(["android", "ios"]).toContain(device.platform);
      expect(["real", "emulator", "simulator"]).toContain(device.type);
    }
  });

  // Note: Following tests require an actual device connected
  // Skip if no device available in CI/CD
  it.skip("should list apps on device", async () => {
    const devices = await mcpClient.listDevices();
    if (devices.length === 0) return;

    const deviceId = devices[0].id;
    const apps = await mcpClient.listApps(deviceId);

    expect(Array.isArray(apps)).toBe(true);
    if (apps.length > 0) {
      const app = apps[0];
      expect(app).toHaveProperty("packageName");
      expect(app).toHaveProperty("appName");
    }
  });

  it.skip("should capture screenshot from device", async () => {
    const devices = await mcpClient.listDevices();
    if (devices.length === 0) return;

    const deviceId = devices[0].id;
    const screenshot = await mcpClient.captureScreenshot(deviceId);

    expect(screenshot).toHaveProperty("data");
    expect(screenshot).toHaveProperty("width");
    expect(screenshot).toHaveProperty("height");
    expect(screenshot).toHaveProperty("timestamp");
    expect(screenshot.data).toBeTruthy();
    expect(screenshot.width).toBeGreaterThan(0);
    expect(screenshot.height).toBeGreaterThan(0);
  });

  it.skip("should get screen size from device", async () => {
    const devices = await mcpClient.listDevices();
    if (devices.length === 0) return;

    const deviceId = devices[0].id;
    const screenSize = await mcpClient.getScreenSize(deviceId);

    expect(screenSize).toHaveProperty("width");
    expect(screenSize).toHaveProperty("height");
    expect(screenSize.width).toBeGreaterThan(0);
    expect(screenSize.height).toBeGreaterThan(0);
  });
});

describe("Device Session Repository", () => {
  let sessionRepo: ReturnType<typeof getDeviceSessionRepository>;
  let testDeviceId: string;

  beforeAll(() => {
    sessionRepo = getDeviceSessionRepository();
    testDeviceId = "test-device-emulator-5554";
  });

  it("should create device session", async () => {
    const session = await sessionRepo.createSession(testDeviceId, {
      test: true,
      platform: "android",
    });

    expect(session).toHaveProperty("sessionId");
    expect(session).toHaveProperty("deviceId", testDeviceId);
    expect(session).toHaveProperty("state", "connected");
    expect(session).toHaveProperty("startedAt");
    expect(session).toHaveProperty("lastActivityAt");
    expect(session).toHaveProperty("metadata");
    expect(session.metadata).toEqual({ test: true, platform: "android" });
  });

  it("should get session by ID", async () => {
    const created = await sessionRepo.createSession(testDeviceId, { test: true });
    const retrieved = await sessionRepo.getSession(created.sessionId);

    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe(created.sessionId);
    expect(retrieved?.deviceId).toBe(testDeviceId);
  });

  it("should update session state", async () => {
    const session = await sessionRepo.createSession(testDeviceId, { test: true });

    await sessionRepo.updateSessionState(session.sessionId, "busy", "com.example.app");

    const updated = await sessionRepo.getSession(session.sessionId);
    expect(updated?.state).toBe("busy");
    expect(updated?.currentApp).toBe("com.example.app");
  });

  it("should close session", async () => {
    const session = await sessionRepo.createSession(testDeviceId, { test: true });

    await sessionRepo.closeSession(session.sessionId);

    const closed = await sessionRepo.getSession(session.sessionId);
    expect(closed?.state).toBe("disconnected");
  });

  it("should list active sessions", async () => {
    // Create multiple sessions
    await sessionRepo.createSession("device-1", { test: true });
    await sessionRepo.createSession("device-2", { test: true });

    const sessions = await sessionRepo.listActiveSessions();

    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions.every((s) => ["idle", "connected", "busy"].includes(s.state))).toBe(true);
  });

  it("should upsert device info", async () => {
    const deviceInfo: DeviceInfo = {
      id: "test-device-123",
      name: "Test Emulator",
      platform: "android",
      type: "emulator",
      version: "14.0",
      screenWidth: 1080,
      screenHeight: 2340,
      orientation: "portrait",
    };

    await sessionRepo.upsertDeviceInfo(deviceInfo);

    // Upsert again with updated info
    deviceInfo.version = "14.1";
    await sessionRepo.upsertDeviceInfo(deviceInfo);

    // Verify no duplicate constraint error
  });

  it("should log mobile operation", async () => {
    await sessionRepo.logOperation(
      undefined,
      testDeviceId,
      "input",
      "tap",
      { x: 500, y: 1000 },
      "success",
      "Tap successful",
      250,
    );

    // Verify no error thrown
  });
});
