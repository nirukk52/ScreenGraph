/** Device session repository for managing mobile device sessions. */

import log from "encore.dev/log";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ulid } from "ulidx";
import type { DeviceAllocationRequest, DeviceInfo, DeviceSession, SessionState } from "./types";

/** Database instance. */
const db = new SQLDatabase("screengraph", {
  migrations: "./db/migrations",
});

const logger = log.with({ module: "mobile", component: "session-repo" });

/** Device session repository. */
export class DeviceSessionRepository {
  /** Create a new device session. */
  async createSession(deviceId: string, metadata: Record<string, unknown>): Promise<DeviceSession> {
    const sessionId = ulid();
    const now = new Date().toISOString();

    const result = await db.queryRow<{
      session_id: string;
      device_id: string;
      state: SessionState;
      current_app: string | null;
      started_at: string;
      last_activity_at: string;
      metadata: Record<string, unknown>;
    }>`
      INSERT INTO device_sessions (
        session_id, device_id, state, started_at, last_activity_at, metadata
      ) VALUES (
        ${sessionId}, ${deviceId}, 'connected', ${now}, ${now}, ${JSON.stringify(metadata)}
      )
      RETURNING session_id, device_id, state, current_app, started_at, last_activity_at, metadata
    `;

    logger.info("created device session", { sessionId, deviceId });

    return {
      sessionId: result.session_id,
      deviceId: result.device_id,
      state: result.state,
      currentApp: result.current_app || undefined,
      startedAt: result.started_at,
      lastActivityAt: result.last_activity_at,
      metadata: result.metadata,
    };
  }

  /** Get session by ID. */
  async getSession(sessionId: string): Promise<DeviceSession | undefined> {
    const result = await db.queryRow<{
      session_id: string;
      device_id: string;
      state: SessionState;
      current_app: string | null;
      started_at: string;
      last_activity_at: string;
      metadata: Record<string, unknown>;
    }>`
      SELECT session_id, device_id, state, current_app, started_at, last_activity_at, metadata
      FROM device_sessions
      WHERE session_id = ${sessionId}
    `;

    if (!result) {
      return undefined;
    }

    return {
      sessionId: result.session_id,
      deviceId: result.device_id,
      state: result.state,
      currentApp: result.current_app || undefined,
      startedAt: result.started_at,
      lastActivityAt: result.last_activity_at,
      metadata: result.metadata,
    };
  }

  /** Update session state. */
  async updateSessionState(
    sessionId: string,
    state: SessionState,
    currentApp?: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    await db.exec`
      UPDATE device_sessions
      SET state = ${state},
          current_app = ${currentApp || null},
          last_activity_at = ${now},
          updated_at = ${now}
      WHERE session_id = ${sessionId}
    `;

    logger.info("updated session state", { sessionId, state, currentApp });
  }

  /** Update session last activity time. */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const now = new Date().toISOString();

    await db.exec`
      UPDATE device_sessions
      SET last_activity_at = ${now},
          updated_at = ${now}
      WHERE session_id = ${sessionId}
    `;
  }

  /** Close session. */
  async closeSession(sessionId: string): Promise<void> {
    const now = new Date().toISOString();

    await db.exec`
      UPDATE device_sessions
      SET state = 'disconnected',
          updated_at = ${now}
      WHERE session_id = ${sessionId}
    `;

    logger.info("closed device session", { sessionId });
  }

  /** List active sessions. */
  async listActiveSessions(): Promise<DeviceSession[]> {
    const results = db.query<{
      session_id: string;
      device_id: string;
      state: SessionState;
      current_app: string | null;
      started_at: string;
      last_activity_at: string;
      metadata: Record<string, unknown>;
    }>`
      SELECT session_id, device_id, state, current_app, started_at, last_activity_at, metadata
      FROM device_sessions
      WHERE state IN ('idle', 'connected', 'busy')
      ORDER BY started_at DESC
    `;

    const sessions: DeviceSession[] = [];
    for await (const row of results) {
      sessions.push({
        sessionId: row.session_id,
        deviceId: row.device_id,
        state: row.state,
        currentApp: row.current_app || undefined,
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
        metadata: row.metadata,
      });
    }

    return sessions;
  }

  /** Upsert device information. */
  async upsertDeviceInfo(device: DeviceInfo): Promise<void> {
    const now = new Date().toISOString();

    await db.exec`
      INSERT INTO device_info (
        device_id, name, platform, device_type, version,
        screen_width, screen_height, orientation,
        last_seen_at, updated_at
      ) VALUES (
        ${device.id}, ${device.name}, ${device.platform}, ${device.type}, ${device.version},
        ${device.screenWidth || null}, ${device.screenHeight || null}, ${device.orientation || null},
        ${now}, ${now}
      )
      ON CONFLICT (device_id) DO UPDATE SET
        name = EXCLUDED.name,
        version = EXCLUDED.version,
        screen_width = EXCLUDED.screen_width,
        screen_height = EXCLUDED.screen_height,
        orientation = EXCLUDED.orientation,
        last_seen_at = EXCLUDED.last_seen_at,
        updated_at = EXCLUDED.updated_at
    `;
  }

  /** Find available device matching allocation request. */
  async findAvailableDevice(request: DeviceAllocationRequest): Promise<DeviceInfo | undefined> {
    // Build query conditions based on allocation request
    const conditions: string[] = ["available = TRUE"];
    const params: (string | undefined)[] = [];

    if (request.platform) {
      conditions.push(`platform = $${params.length + 1}`);
      params.push(request.platform);
    }

    if (request.deviceType) {
      conditions.push(`device_type = $${params.length + 1}`);
      params.push(request.deviceType);
    }

    if (request.provider) {
      conditions.push(`provider = $${params.length + 1}`);
      params.push(request.provider);
    }

    // Note: Version matching would require semver comparison, skipping for now

    const whereClause = conditions.join(" AND ");

    const result = await db.queryRow<{
      device_id: string;
      name: string;
      platform: "android" | "ios";
      device_type: "real" | "emulator" | "simulator";
      version: string;
      screen_width: number | null;
      screen_height: number | null;
      orientation: "portrait" | "landscape" | null;
    }>`
      SELECT device_id, name, platform, device_type, version,
             screen_width, screen_height, orientation
      FROM device_info
      WHERE ${whereClause}
      ORDER BY last_seen_at DESC
      LIMIT 1
    `;

    if (!result) {
      return undefined;
    }

    return {
      id: result.device_id,
      name: result.name,
      platform: result.platform,
      type: result.device_type,
      version: result.version,
      screenWidth: result.screen_width || undefined,
      screenHeight: result.screen_height || undefined,
      orientation: result.orientation || undefined,
    };
  }

  /** Log mobile operation for audit trail. */
  async logOperation(
    sessionId: string | undefined,
    deviceId: string,
    operationType: string,
    operationName: string,
    parameters: Record<string, unknown>,
    resultStatus: "success" | "error",
    resultMessage: string | undefined,
    durationMs: number,
  ): Promise<void> {
    const now = new Date().toISOString();

    await db.exec`
      INSERT INTO mobile_operations_log (
        session_id, device_id, operation_type, operation_name,
        parameters, result_status, result_message, duration_ms, occurred_at
      ) VALUES (
        ${sessionId || null}, ${deviceId}, ${operationType}, ${operationName},
        ${JSON.stringify(parameters)}, ${resultStatus}, ${resultMessage || null}, ${durationMs}, ${now}
      )
    `;
  }
}

/** Singleton device session repository instance. */
let sessionRepoInstance: DeviceSessionRepository | undefined;

/** Get or create device session repository singleton. */
export function getDeviceSessionRepository(): DeviceSessionRepository {
  if (!sessionRepoInstance) {
    sessionRepoInstance = new DeviceSessionRepository();
  }
  return sessionRepoInstance;
}
