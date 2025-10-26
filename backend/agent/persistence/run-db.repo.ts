import db from "../../db";
import type { RunDbPort, RunLifecycleStatus, RunRecord } from "../ports/run-db.port";

/**
 * RunDbRepo implements RunDbPort using the project's SQL database. It owns claim/lease
 * and lifecycle transitions for the canonical run record.
 */
export class RunDbRepo implements RunDbPort {
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

    if (!row) return null;

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
    const leaseUntil = new Date(now.getTime() + Math.min(leaseDurationMs, 30_000));

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

    if (!claimed) return null;

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
      stopReason: claimed.stop_reason ?? null,
    };
  }

  async extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + Math.min(leaseDurationMs, 30_000));

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
}


