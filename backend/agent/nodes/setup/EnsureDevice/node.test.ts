import { nanoid } from "nanoid";
import { describe, expect, test, vi } from "vitest";
import type { DeviceRuntimeContext, SessionPort } from "../../../ports/appium/session.port";
import type { DeviceSession } from "../../../../mobile/types";
import { type EnsureDeviceInput, ensureDevice } from "./node";

vi.mock("encore.dev/log", () => {
  const createLogger = () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      with: vi.fn(),
    };
    logger.with.mockReturnValue(logger);
    return logger;
  };
  return { default: createLogger() };
});

vi.mock("../../../../config/env", async () => {
  const actual = await vi.importActual<typeof import("../../../../config/env")>("../../../../config/env");
  return {
    ...actual,
    ENABLE_MOBILE_MCP: false, // Disable for basic tests
  };
});

describe("ensureDevice with lifecycle", () => {
  const mockGenerateId = () => nanoid();

  test("should check device prerequisites before session creation", async () => {
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
      expect(result.output.mobileSessionId).toBeNull();
      expect(result.output.mobileDeviceId).toBe(input.deviceConfiguration.deviceName ?? null);
      // Should emit device check events
      expect(result.events.some((e) => e.kind === "agent.device.check_started")).toBe(true);
      expect(result.events.some((e) => e.kind === "agent.device.check_failed")).toBe(true);
    } else {
      // Device is connected - should succeed
      expect(result.output.nodeExecutionOutcomeStatus).toBe("SUCCESS");
      expect(result.output.deviceRuntimeContextId).toBe("ctx-123");
      expect(result.output.runId).toBe("run-test-001");
      expect(result.output.errorId).toBeNull();
      expect(result.output.mobileSessionId).toBeNull();
      expect(result.output.mobileDeviceId).toBe(input.deviceConfiguration.deviceName ?? null);
      // Should emit lifecycle events
      expect(result.events.some((e) => e.kind === "agent.device.check_started")).toBe(true);
      expect(result.events.some((e) => e.kind === "agent.device.check_completed")).toBe(true);
    }
  });

  test("should emit lifecycle events", async () => {
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

  test("uses mobile-mcp allocation when feature flag enabled", async () => {
    const now = new Date().toISOString();
    const mobileSession: DeviceSession = {
      sessionId: "mobile-session-123",
      deviceId: "mobile-device-1",
      state: "connected",
      startedAt: now,
      lastActivityAt: now,
      metadata: {
        deviceInfo: {
          platform: "android",
          version: "14.0",
        },
      },
    };

    const mockCreateMobileDeviceSession = vi.fn().mockResolvedValue(mobileSession);
    const mockCloseMobileDeviceSession = vi.fn();
    const mockEnsureDeviceImpl = vi.fn().mockResolvedValue({
      deviceRuntimeContextId: "ctx-mobile",
      deviceId: "mobile-device-1",
      capabilitiesEcho: {},
      healthProbeStatus: "HEALTHY",
    } satisfies DeviceRuntimeContext);

    const input: EnsureDeviceInput = {
      runId: "run-test-mobile",
      iterationOrdinalNumber: 1,
      deviceConfiguration: {
        platformName: "Android",
        deviceName: "",
        platformVersion: "",
        appiumServerUrl: "http://127.0.0.1:4723",
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    };

    const mockSessionPort: SessionPort = {
      ensureDevice: mockEnsureDeviceImpl,
      closeSession: vi.fn(),
    };

    let result: Awaited<ReturnType<typeof ensureDevice>> | null = null;

    vi.resetModules();
    try {
      vi.doMock("../../../../config/env", async () => {
        const actual = await vi.importActual<typeof import("../../../../config/env")>(
          "../../../../config/env",
        );
        return {
          ...actual,
          ENABLE_MOBILE_MCP: true,
          APPIUM_PORT: actual.APPIUM_PORT,
        };
      });
      vi.doMock("../../../adapters/mobile/session.adapter", () => ({
        createMobileDeviceSession: mockCreateMobileDeviceSession,
        closeMobileDeviceSession: mockCloseMobileDeviceSession,
      }));
      vi.doMock("./device-check", () => ({
        checkDevicePrerequisites: vi.fn().mockResolvedValue({
          isOnline: true,
          deviceId: "mobile-device-1",
        }),
      }));
      vi.doMock("./appium-lifecycle", () => ({
        checkAppiumHealth: vi.fn().mockResolvedValue({ isHealthy: true }),
        startAppium: vi.fn(),
      }));

      const { ensureDevice: ensureDeviceWithMobile } = await import("./node");
      result = await ensureDeviceWithMobile(input, mockSessionPort, mockGenerateId);
    } finally {
      vi.resetModules();
    }

    expect(mockCreateMobileDeviceSession).toHaveBeenCalledTimes(1);
    expect(mockEnsureDeviceImpl).toHaveBeenCalledWith(
      expect.objectContaining({ deviceName: "mobile-device-1" }),
    );
    expect(result?.output.mobileSessionId).toBe("mobile-session-123");
    expect(result?.output.mobileDeviceId).toBe("mobile-device-1");
    expect(mockCloseMobileDeviceSession).not.toHaveBeenCalled();
  });
});
