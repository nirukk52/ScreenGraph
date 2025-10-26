import type { AgentState } from "../domain/state";

/**
 * RunDbPort exists to define the minimal persistence contract for managing the lifecycle
 * of a run row in durable storage. It centralizes claim/lease/heartbeat and status updates
 * so the worker can coordinate single-writer semantics without leaking SQL concerns.
 */
export interface RunDbPort {
  /** Attempts to atomically claim the run for the given worker; returns null if claim fails. */
  claimRun(runId: string, workerId: string, leaseDurationMs: number): Promise<RunRecord | null>;

  /** Extends an active lease for the worker currently processing the run. */
  extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean>;

  /** Reads the canonical run record by ID. */
  getRun(runId: string): Promise<RunRecord | null>;

  /** Updates the run status; returns false if the state transition was rejected. */
  updateRunStatus(
    runId: string,
    newStatus: RunLifecycleStatus,
    now: string,
    stopReason?: string | null,
  ): Promise<boolean>;
}

/** Enumerates the lifecycle states tracked for runs in durable storage. */
export type RunLifecycleStatus = "queued" | "running" | "completed" | "failed" | "canceled";

/** Captures the persisted metadata for a single agent run. */
export interface RunRecord {
  runId: string;
  tenantId: string;
  projectId: string;
  status: RunLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  appConfigId: string;
  processingBy: string | null;
  leaseExpiresAt: string | null;
  heartbeatAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  cancelRequestedAt: string | null;
  stopReason: string | null;
}


