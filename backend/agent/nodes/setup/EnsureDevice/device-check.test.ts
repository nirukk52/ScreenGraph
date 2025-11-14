import { beforeEach, describe, expect, test, vi } from "vitest";
import { checkDevicePrerequisites } from "./device-check";

// Mock child_process to avoid real adb calls
vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

// Import after mocking to get the mocked version
const childProcess = await import("node:child_process");
const { promisify } = await import("node:util");

describe("checkDevicePrerequisites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test("should detect online device via adb", async () => {
    // Mock successful adb output with one device
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        callback(null, {
          stdout:
            "List of devices attached\nemulator-5554          device product:sdk_gphone64_arm64",
          stderr: "",
        } as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
    });

    expect(result.isOnline).toBe(true);
    expect(result.deviceId).toBe("emulator-5554");
    expect(result.details).toHaveProperty("totalDevices");
    expect(result.details?.totalDevices).toBe(1);
  });

  test("should return error when no devices connected", async () => {
    // Mock adb output with no devices
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        callback(null, {
          stdout: "List of devices attached\n",
          stderr: "",
        } as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.example.test",
    });

    expect(result.isOnline).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("No connected devices found");
  });

  test("should include device details when online", async () => {
    // Mock successful adb output with specific device
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        callback(null, {
          stdout:
            "List of devices attached\nemulator-5554          device product:sdk_gphone64_arm64",
          stderr: "",
        } as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "emulator-5554",
    });

    expect(result.isOnline).toBe(true);
    expect(result.details).toHaveProperty("adbOutput");
    expect(result.details).toHaveProperty("totalDevices");
  });

  test("should filter for specific deviceId when provided", async () => {
    // Mock adb output with multiple devices
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        callback(null, {
          stdout:
            "List of devices attached\nemulator-5554          device product:sdk_gphone64_arm64\nemulator-5556          device product:sdk_gphone64_x86",
          stderr: "",
        } as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "emulator-5554",
    });

    expect(result.isOnline).toBe(true);
    expect(result.deviceId).toBe("emulator-5554");
    expect(result.details?.totalDevices).toBe(2);
  });

  test("should return error when requested deviceId not found in multi-device lab", async () => {
    // Mock adb output with devices, but not the requested one
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        callback(null, {
          stdout:
            "List of devices attached\nemulator-5554          device product:sdk_gphone64_arm64\nemulator-5556          device product:sdk_gphone64_x86",
          stderr: "",
        } as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "nonexistent-device-12345",
    });

    expect(result.isOnline).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("nonexistent-device-12345");
    expect(result.error).toContain("not found");
    expect(result.details).toHaveProperty("requestedDeviceId", "nonexistent-device-12345");
    expect(result.details).toHaveProperty("availableDevices");
    expect(Array.isArray(result.details?.availableDevices)).toBe(true);
    expect(result.details?.availableDevices).toHaveLength(2);
  });

  test("should handle adb command failure gracefully", async () => {
    // Mock adb command failure (binary not found)
    vi.mocked(childProcess.exec).mockImplementation((cmd, callback) => {
      if (typeof callback === "function") {
        const error = new Error("Command failed: adb devices -l\n/bin/sh: 1: adb: not found");
        callback(error as never, null as never);
      }
      return {} as never;
    });

    const result = await checkDevicePrerequisites({
      appId: "com.example.test",
    });

    expect(result.isOnline).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("Device check failed");
  });
});
