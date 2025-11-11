import log from "encore.dev/log";

import db from "../db";
import type { DeviceFarmSessionDetails } from "./aws-device-farm-connector";
import type { MobilePlatformKind } from "./dto";
import { MobileMcpRuntime } from "./mobile-mcp.runtime";

/**
 * MobileMcpSessionRow mirrors the persisted representation in mobile_mcp_sessions.
 * PURPOSE: Enables consistent hydration between the registry cache and the database.
 */
export interface MobileMcpSessionRow {
  mobileMcpSessionId: string;
  runId: string;
  deviceId: string;
  devicePlatform: MobilePlatformKind;
  deviceFarmJobArn?: string | null;
  appiumEndpointUrl?: string | null;
  mcpSessionToken?: string | null;
  status: "active" | "closed";
  lastHeartbeatAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionRecord {
  row: MobileMcpSessionRow;
  runtime: MobileMcpRuntime;
}

/**
 * MobileMcpSessionRegistry caches active Mobile MCP sessions for fast lookups while persisting state.
 * PURPOSE: Guarantees deterministic session recovery if a worker restarts mid-run.
 */
export class MobileMcpSessionRegistry {
  private readonly logger = log.with({ module: "mobile-mcp", actor: "session-registry" });
  private readonly sessions = new Map<string, SessionRecord>();

  /**
   * createSession persists and caches a new Mobile MCP session record.
   * PURPOSE: Records metadata for later tool invocations and lifecycle management.
   */
  async createSession(
    sessionId: string,
    runId: string,
    devicePlatform: MobilePlatformKind,
    deviceDetails: DeviceFarmSessionDetails,
    runtime: MobileMcpRuntime,
  ): Promise<void> {
    const createdAt = new Date();
    const row: MobileMcpSessionRow = {
      mobileMcpSessionId: sessionId,
      runId,
      deviceId: deviceDetails.deviceId,
      devicePlatform,
      deviceFarmJobArn: deviceDetails.deviceFarmJobArn ?? null,
      appiumEndpointUrl: deviceDetails.appiumEndpointUrl ?? null,
      mcpSessionToken: deviceDetails.mcpSessionToken ?? null,
      status: "active",
      lastHeartbeatAt: null,
      createdAt,
      updatedAt: createdAt,
    };

    await db.exec`
      INSERT INTO mobile_mcp_sessions (
        mobile_mcp_session_id,
        run_id,
        device_id,
        device_platform,
        device_farm_job_arn,
        appium_endpoint_url,
        mcp_session_token,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${row.mobileMcpSessionId},
        ${row.runId},
        ${row.deviceId},
        ${row.devicePlatform},
        ${row.deviceFarmJobArn},
        ${row.appiumEndpointUrl},
        ${row.mcpSessionToken},
        ${row.status},
        ${row.createdAt},
        ${row.updatedAt}
      )
    `;

    this.sessions.set(sessionId, { row, runtime });
    this.logger.info("Registered Mobile MCP session", { sessionId, runId, deviceId: row.deviceId });
  }

  /**
   * getSession fetches the cached session metadata if present.
   * PURPOSE: Allows callers to inspect device details without hitting the database.
   */
  getSession(sessionId: string): MobileMcpSessionRow | undefined {
    return this.sessions.get(sessionId)?.row;
  }

  /**
   * getRuntime retrieves the active Mobile MCP runtime associated with the session.
   * PURPOSE: Enables tool invocation logic to execute on the correct runtime instance.
   */
  getRuntime(sessionId: string): MobileMcpRuntime | undefined {
    return this.sessions.get(sessionId)?.runtime;
  }

  /**
   * markHeartbeat updates the last heartbeat timestamp used for observability.
   * PURPOSE: Records liveness signals so stale sessions can be cleaned up.
   */
  async markHeartbeat(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return;
    }
    const timestamp = new Date();
    record.row.lastHeartbeatAt = timestamp;
    record.row.updatedAt = timestamp;

    await db.exec`
      UPDATE mobile_mcp_sessions
      SET last_heartbeat_at = ${timestamp}, updated_at = ${timestamp}
      WHERE mobile_mcp_session_id = ${sessionId}
    `;
  }

  /**
   * removeSession closes and removes the session from the registry and database.
   * PURPOSE: Ensures resources are cleaned up deterministically at the end of a run.
   */
  async removeSession(sessionId: string): Promise<void> {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return;
    }

    this.sessions.delete(sessionId);

    try {
      await record.runtime.dispose();
    } catch (err) {
      this.logger.warn("Error disposing Mobile MCP runtime", { err, sessionId });
    }

    await db.exec`
      UPDATE mobile_mcp_sessions
      SET status = 'closed', updated_at = ${new Date()}
      WHERE mobile_mcp_session_id = ${sessionId}
    `;
  }
}
