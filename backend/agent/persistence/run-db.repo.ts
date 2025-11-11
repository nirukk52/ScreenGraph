import log from "encore.dev/log";
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
      app_package: string;
      status: RunLifecycleStatus;
      stop_reason: string | null;
      worker_id: string | null;
      lease_expires_at: string | null;
      created_at: string;
      started_at: string | null;
      finished_at: string | null;
      updated_at: string;
    }>`
      SELECT
        run_id,
        app_package,
        status,
        stop_reason,
        worker_id,
        lease_expires_at,
        created_at,
        started_at,
        finished_at,
        updated_at
      FROM runs
      WHERE run_id = ${runId}
    `;

    if (!row) return null;

    return {
      runId: row.run_id,
      appPackage: row.app_package,
      status: row.status,
      stopReason: row.stop_reason,
      workerId: row.worker_id,
      leaseExpiresAt: row.lease_expires_at,
      createdAt: row.created_at,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      updatedAt: row.updated_at,
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
      app_package: string;
      status: RunLifecycleStatus;
      stop_reason: string | null;
      worker_id: string | null;
      lease_expires_at: string | null;
      created_at: string;
      started_at: string | null;
      finished_at: string | null;
      updated_at: string;
    }>`
      WITH claimed AS (
        UPDATE runs
        SET
          status = 'running',
          worker_id = ${workerId},
          lease_expires_at = ${leaseUntil.toISOString()},
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
      appPackage: claimed.app_package,
      status: claimed.status,
      stopReason: claimed.stop_reason,
      workerId: claimed.worker_id,
      leaseExpiresAt: claimed.lease_expires_at,
      createdAt: claimed.created_at,
      startedAt: claimed.started_at,
      finishedAt: claimed.finished_at,
      updatedAt: claimed.updated_at,
    };
  }

  async extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + Math.min(leaseDurationMs, 30_000));

    await db.exec`
      UPDATE runs
      SET
        lease_expires_at = ${leaseUntil.toISOString()},
        updated_at = ${now.toISOString()}
      WHERE run_id = ${runId}
        AND worker_id = ${workerId}
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
    const logger = log.with({ module: "agent", actor: "run-db-repo", runId });

    logger.info("updateRunStatus called", {
      runId,
      newStatus,
      now,
      stopReason,
    });

    try {
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

      logger.info("updateRunStatus succeeded");
      return true;
    } catch (err) {
      logger.error("updateRunStatus failed", {
        err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  }
}
