import type { DeviceRuntimeContext } from "../../domain/entities";
import type { DeviceConfiguration, SessionPort } from "../../ports/appium/session.port";
import { getMobileMcpClient } from "./client";

export interface MobileMcpSessionState {
  sessionId: string;
  runId: string;
  deviceId: string;
  devicePlatform: "android" | "ios";
  runtimeContext: DeviceRuntimeContext;
}

/**
 * MobileMcpSessionAdapter implements SessionPort using the Mobile MCP microservice.
 * PURPOSE: Orchestrates session lifecycle and exposes deterministic runtime context metadata.
 */
export class MobileMcpSessionAdapter implements SessionPort {
  private state: MobileMcpSessionState | null = null;

  /**
   * ensureDevice starts (or reuses) a Mobile MCP session and returns a runtime context.
   * PURPOSE: Provides the agent orchestrator with a deterministic session identifier.
   */
  async ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext> {
    if (this.state) {
      return this.state.runtimeContext;
    }

    const mobileMcp = await getMobileMcpClient();
    const platformName = config.platformName?.toLowerCase() === "ios" ? "ios" : "android";
    const response = await mobileMcp.startSession({
      platform: platformName,
      runId: config.deviceName ?? undefined,
      deviceAlias: config.deviceName ?? undefined,
      appPackageId: config.appPackage ?? undefined,
    });

    const runtimeContext: DeviceRuntimeContext = {
      deviceRuntimeContextId: response.sessionId,
      deviceId: response.deviceId,
      capabilitiesEcho: {
        platform: platformName,
        appPackage: config.appPackage ?? null,
      },
      healthProbeStatus: "HEALTHY",
    };

    this.state = {
      sessionId: response.sessionId,
      runId: response.runId ?? config.deviceName ?? "unknown",
      deviceId: response.deviceId,
      devicePlatform: response.devicePlatform,
      runtimeContext,
    };

    return runtimeContext;
  }

  /**
   * closeSession terminates the active Mobile MCP session if present.
   * PURPOSE: Releases device resources when the agent finishes execution.
   */
  async closeSession(): Promise<void> {
    if (!this.state) {
      return;
    }
    const mobileMcp = await getMobileMcpClient();
    await mobileMcp.stopSession({
      sessionId: this.state.sessionId,
    });
    this.state = null;
  }

  /**
   * getContext exposes the cached session state for other adapters.
   * PURPOSE: Enables perception/input adapters to re-use the established session.
   */
  getContext(): MobileMcpSessionState | null {
    return this.state;
  }
}
