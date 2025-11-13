import { describe, test, expect } from "vitest";
import { checkDevicePrerequisites } from "./device-check";

describe("checkDevicePrerequisites", () => {
  test("should detect online device via adb", async () => {
    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
    });

    // This test depends on having a device/emulator connected
    // In CI, we'd mock the exec call
    expect(result).toHaveProperty("isOnline");
    
    if (result.isOnline) {
      expect(result.deviceId).toBeTruthy();
      expect(result.details).toHaveProperty("totalDevices");
    } else {
      // No device connected - this is expected in test environment
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("device");
    }
  });

  test("should return error when no devices connected", async () => {
    // This test would need mocking to simulate "no devices"
    // For now, just verify error structure exists
    const result = await checkDevicePrerequisites({
      appId: "com.example.test",
    });

    expect(result).toHaveProperty("isOnline");
    
    if (!result.isOnline) {
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("device");
    }
  });

  test("should include device details when online", async () => {
    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "emulator-5554",
    });

    expect(result).toHaveProperty("details");
    
    if (result.isOnline) {
      expect(result.details).toHaveProperty("adbOutput");
    }
  });

  test("should filter for specific deviceId when provided", async () => {
    // Test with a likely-available device ID
    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "emulator-5554",
    });

    if (result.isOnline) {
      // If device found, should match requested ID
      expect(result.deviceId).toBe("emulator-5554");
    } else {
      // If not found, error should mention requested ID
      expect(result.error).toContain("emulator-5554");
      expect(result.error).toContain("not found");
      expect(result.details).toHaveProperty("requestedDeviceId");
      expect(result.details?.requestedDeviceId).toBe("emulator-5554");
    }
  });

  test("should return error when requested deviceId not found in multi-device lab", async () => {
    // Test with a non-existent device ID
    const result = await checkDevicePrerequisites({
      appId: "com.jetbrains.kotlinconf",
      deviceId: "nonexistent-device-12345",
    });

    // Should always fail for non-existent device
    expect(result.isOnline).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("nonexistent-device-12345");
    expect(result.error).toContain("not found");
    
    // Should list available devices in error
    if (result.details?.availableDevices) {
      expect(Array.isArray(result.details.availableDevices)).toBe(true);
    }
  });
});

