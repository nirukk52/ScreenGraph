import type { RepoPort, RunRecord, RunLifecycleStatus } from "../ports/repo.port";
import type { AgentState } from "../domain/state";
import type { DomainEvent } from "../domain/events";
import db from "../../db";
import { ulid } from "ulidx";

const MAX_LEASE_EXTENSION_MS = 30_000;

export class DBRepoPort implements RepoPort {
  async createRun(runId: string, tenantId: string, projectId: string, now: string): Promise<void> {
    await db.exec`
      INSERT INTO runs (
        run_id,
        tenant_id,
        project_id,
        app_config_id,
        status,
        created_at,
        updated_at,
        processing_by,
        lease_expires_at,
        heartbeat_at,
        started_at,
        finished_at,
        cancel_requested_at
      )
      VALUES (
        ${runId},
        ${tenantId},
        ${projectId},
        'default',
        'queued',
        ${now},
        ${now},
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
      )
    `;

    await db.exec`
      INSERT INTO run_outbox (run_id, next_seq, last_published_seq, updated_at)
      VALUES (${runId}, 1, 0, ${now})
    `;
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    const row = await db.queryRow<{
      run_id: string;
      tenant_id: string;
      project_id: string;
      status: RunLifecycleStatus;
      created_at: string;
      updated_at: string;
      app_config_id: string;
      processing_by: string | null;
      lease_expires_at: string | null;
      heartbeat_at: string | null;
      started_at: string | null;
      finished_at: string | null;
      cancel_requested_at: string | null;
      stop_reason: string | null;
    }>`
      SELECT
        run_id,
        tenant_id,
        project_id,
        status,
        created_at,
        updated_at,
        app_config_id,
        processing_by,
        lease_expires_at,
        heartbeat_at,
        started_at,
        finished_at,
        cancel_requested_at,
        stop_reason
      FROM runs
      WHERE run_id = ${runId}
    `;

    if (!row) {
      return null;
    }

    return {
      runId: row.run_id,
      tenantId: row.tenant_id,
      projectId: row.project_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      appConfigId: row.app_config_id,
      processingBy: row.processing_by,
      leaseExpiresAt: row.lease_expires_at,
      heartbeatAt: row.heartbeat_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      cancelRequestedAt: row.cancel_requested_at,
      stopReason: row.stop_reason ?? null,
    };
  }

  async claimRun(
    runId: string,
    workerId: string,
    leaseDurationMs: number,
  ): Promise<RunRecord | null> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + Math.min(leaseDurationMs, MAX_LEASE_EXTENSION_MS));

    const claimed = await db.queryRow<{
      run_id: string;
      tenant_id: string;
      project_id: string;
      status: RunLifecycleStatus;
      created_at: string;
      updated_at: string;
      app_config_id: string;
      processing_by: string | null;
      lease_expires_at: string | null;
      heartbeat_at: string | null;
      started_at: string | null;
      finished_at: string | null;
      cancel_requested_at: string | null;
      stop_reason: string | null;
    }>`
      WITH claimed AS (
        UPDATE runs
        SET
          status = 'running',
          processing_by = ${workerId},
          lease_expires_at = ${leaseUntil.toISOString()},
          heartbeat_at = ${now.toISOString()},
          started_at = COALESCE(started_at, ${now.toISOString()}),
          updated_at = ${now.toISOString()}
        WHERE run_id = ${runId}
          AND (
            status = 'queued'
            OR (status = 'running' AND (lease_expires_at IS NULL OR lease_expires_at < ${now.toISOString()}))
          )
        RETURNING *
      )
      SELECT * FROM claimed
    `;

    if (!claimed) {
      return null;
    }

    return {
      runId: claimed.run_id,
      tenantId: claimed.tenant_id,
      projectId: claimed.project_id,
      status: claimed.status,
      createdAt: claimed.created_at,
      updatedAt: claimed.updated_at,
      appConfigId: claimed.app_config_id,
      processingBy: claimed.processing_by,
      leaseExpiresAt: claimed.lease_expires_at,
      heartbeatAt: claimed.heartbeat_at,
      startedAt: claimed.started_at,
      finishedAt: claimed.finished_at,
      cancelRequestedAt: claimed.cancel_requested_at,
    };
  }

  async extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + Math.min(leaseDurationMs, MAX_LEASE_EXTENSION_MS));

    await db.exec`
      UPDATE runs
      SET
        lease_expires_at = ${leaseUntil.toISOString()},
        heartbeat_at = ${now.toISOString()},
        updated_at = ${now.toISOString()}
      WHERE run_id = ${runId}
        AND processing_by = ${workerId}
        AND status = 'running'
        AND (lease_expires_at IS NULL OR lease_expires_at >= ${now.toISOString()})
    `;

    return true;
  }

  async updateRunStatus(
    runId: string,
    newStatus: RunLifecycleStatus,
    now: string,
    stopReason?: string | null,
  ): Promise<boolean> {
    await db.exec`
      UPDATE runs
      SET
        status = ${newStatus},
        updated_at = ${now},
        stop_reason = ${stopReason ?? null},
        finished_at = CASE
          WHEN ${newStatus} IN ('completed', 'failed', 'canceled') THEN ${now}
          ELSE finished_at
        END
      WHERE run_id = ${runId}
        AND status NOT IN ('completed', 'failed', 'canceled')
    `;

    return true;
  }

  async appendEvent(event: DomainEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    await db.exec`
      INSERT INTO run_events (run_id, seq, type, node_name, payload, created_at)
      VALUES (
        ${event.runId},
        ${event.sequence},
        ${event.kind},
        ${payload.nodeName || null},
        ${JSON.stringify(event.payload)},
        ${event.ts}
      )
      ON CONFLICT (run_id, seq) DO NOTHING
    `;
  }

  async getEvents(runId: string): Promise<DomainEvent[]> {
    const rows: Array<{
      run_id: string;
      seq: number;
      type: string;
      payload: string;
      created_at: string;
    }> = [];

    for await (const row of db.query<{
      run_id: string;
      seq: number;
      type: string;
      payload: string;
      created_at: string;
    }>`
      SELECT run_id, seq, type, payload, created_at
      FROM run_events
      WHERE run_id = ${runId}
      ORDER BY seq ASC
    `) {
      rows.push(row);
    }

    return rows.map((row) => ({
      eventId: ulid(),
      runId: row.run_id,
      tenantId: "",
      projectId: "",
      sequence: row.seq,
      ts: row.created_at,
      kind: row.type as DomainEvent["kind"],
      version: "1",
      payload: JSON.parse(row.payload),
      checksum: "",
    }));
  }

  async saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void> {
    await db.exec`
      INSERT INTO agent_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
      VALUES (
        ${runId},
        ${stepOrdinal},
        ${state.nodeName},
        ${JSON.stringify(state)},
        ${state.timestamps.createdAt},
        ${state.timestamps.updatedAt}
      )
      ON CONFLICT (run_id, step_ordinal)
      DO UPDATE SET
        node_name = EXCLUDED.node_name,
        state_json = EXCLUDED.state_json,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null> {
    const row = await db.queryRow<{ state_json: string }>`
      SELECT state_json
      FROM agent_state_snapshots
      WHERE run_id = ${runId} AND step_ordinal = ${stepOrdinal}
    `;

    if (!row) {
      return null;
    }

    return JSON.parse(row.state_json);
  }

  async getLatestSnapshot(runId: string): Promise<AgentState | null> {
    const row = await db.queryRow<{ state_json: string }>`
      SELECT state_json
      FROM agent_state_snapshots
      WHERE run_id = ${runId}
      ORDER BY step_ordinal DESC
      LIMIT 1
    `;

    if (!row) {
      return null;
    }

    return JSON.parse(row.state_json);
  }

  async getLastEventSequence(runId: string): Promise<number> {
    const row = await db.queryRow<{ seq: number }>`
      SELECT seq
      FROM run_events
      WHERE run_id = ${runId}
      ORDER BY seq DESC
      LIMIT 1
    `;

    return row?.seq ?? 0;
  }

  async upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string,
  ): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) {
      return;
    }

    await db.exec`
      INSERT INTO screens (screen_id, tenant_id, project_id, app_id, layout_hash, perceptual_hash64, first_seen_at, last_seen_at)
      VALUES (
        ${screenId},
        ${run.tenantId},
        ${run.projectId},
        'default',
        ${xmlRef},
        ${perceptualHash64},
        NOW(),
        NOW()
      )
      ON CONFLICT (screen_id)
      DO UPDATE SET last_seen_at = NOW()
    `;

    await db.exec`
      INSERT INTO artifacts_index (artifact_ref_id, run_id, kind, created_at)
      VALUES
        (${screenshotRef}, ${runId}, 'screenshot', NOW()),
        (${xmlRef}, ${runId}, 'xml', NOW())
      ON CONFLICT (artifact_ref_id) DO NOTHING
    `;
  }

  async upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string,
  ): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) {
      return;
    }

    await db.exec`
      INSERT INTO actions (action_id, screen_id, verb, target_key, created_at)
      VALUES (
        ${actionId},
        ${fromScreenId},
        ${actionKind},
        ${actionId},
        NOW()
      )
      ON CONFLICT (screen_id, verb, target_key) DO NOTHING
    `;

    await db.exec`
      INSERT INTO edges (edge_id, tenant_id, project_id, app_id, from_screen_id, action_id, to_screen_id, evidence_counter, last_seen_at)
      VALUES (
        ${ulid()},
        ${run.tenantId},
        ${run.projectId},
        'default',
        ${fromScreenId},
        ${actionId},
        ${toScreenId},
        1,
        NOW()
      )
      ON CONFLICT (from_screen_id, action_id, to_screen_id)
      DO UPDATE SET
        evidence_counter = edges.evidence_counter + 1,
        last_seen_at = NOW()
    `;
  }
}
