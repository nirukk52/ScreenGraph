import { nanoid } from "nanoid";
import { describe, expect, test, vi } from "vitest";
import type { DeviceRuntimeContext, SessionPort } from "../../../ports/appium/session.port";
import { type EnsureDeviceInput, ensureDevice } from "./node";
import * as appiumLifecycle from "./appium-lifecycle";

describe("ensureDevice with lifecycle", () => {
  const mockGenerateId = () => nanoid();

  test("should check device prerequisites before session creation", async () => {
    // Mock BrowserStack hub health check to always return healthy
    vi.spyOn(appiumLifecycle, "checkAppiumHealth").mockResolvedValue({
      isHealthy: true,
      status: 0,
    });

    // Mock only the SessionPort - let real lifecycle checks run
    const mockSessionPort: SessionPort = {
      ensureDevice: vi.fn().mockResolvedValue({
        deviceRuntimeContextId: "ctx-123",
        sessionId: "session-abc",
        capabilities: {
          platformName: "Android",
          deviceName: "emulator-5554",
        },
      } satisfies DeviceRuntimeContext),
    };

    const input: EnsureDeviceInput = {
      runId: "run-test-001",
      iterationOrdinalNumber: 1,
      deviceConfiguration: {
        appId: "com.jetbrains.kotlinconf",
        platformName: "Android",
        deviceName: "emulator-5554",
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    };

    const result = await ensureDevice(input, mockSessionPort, mockGenerateId);

    // If no device connected, should fail with DeviceOfflineError
    // If device connected, should succeed
    if (result.output.nodeExecutionOutcomeStatus === "FAILURE") {
      expect(result.output.errorId).toBe("DeviceOfflineError");
      expect(result.output.retryable).toBe(true);
      expect(result.output.humanReadableFailureSummary).toContain("device");
      // Should emit device check events
      expect(result.events.some((e) => e.kind === "agent.device.check_started")).toBe(true);
      expect(result.events.some((e) => e.kind === "agent.device.check_failed")).toBe(true);
    } else {
      // Device is connected - should succeed
      expect(result.output.nodeExecutionOutcomeStatus).toBe("SUCCESS");
      expect(result.output.deviceRuntimeContextId).toBe("ctx-123");
      expect(result.output.runId).toBe("run-test-001");
      expect(result.output.errorId).toBeNull();
      // Should emit lifecycle events
      expect(result.events.some((e) => e.kind === "agent.device.check_started")).toBe(true);
      expect(result.events.some((e) => e.kind === "agent.device.check_completed")).toBe(true);
    }
  });

  test("should emit lifecycle events", async () => {
    // Mock BrowserStack hub health check to always return healthy
    vi.spyOn(appiumLifecycle, "checkAppiumHealth").mockResolvedValue({
      isHealthy: true,
      status: 0,
    });

    const mockSessionPort: SessionPort = {
      ensureDevice: vi.fn().mockResolvedValue({
        deviceRuntimeContextId: "ctx-456",
        sessionId: "session-xyz",
        capabilities: {},
      } satisfies DeviceRuntimeContext),
    };

    const input: EnsureDeviceInput = {
      runId: "run-test-002",
      iterationOrdinalNumber: 1,
      deviceConfiguration: {
        appId: "com.jetbrains.kotlinconf",
        platformName: "Android",
        deviceName: "emulator-5554",
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    };

    const result = await ensureDevice(input, mockSessionPort, mockGenerateId);

    // Should always emit events array
    expect(result.events).toBeInstanceOf(Array);

    // Should have emitted device check events
    expect(result.events.some((e) => e.kind === "agent.device.check_started")).toBe(true);

    // Either succeeded or failed, should have completion event
    const hasDeviceCheckCompleted = result.events.some(
      (e) => e.kind === "agent.device.check_completed",
    );
    const hasDeviceCheckFailed = result.events.some((e) => e.kind === "agent.device.check_failed");
    expect(hasDeviceCheckCompleted || hasDeviceCheckFailed).toBe(true);
  });
});
