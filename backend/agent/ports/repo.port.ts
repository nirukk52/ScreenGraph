import type { AgentState } from "../domain/state";
import type { DomainEvent } from "../domain/events";

/** Represents the lifecycle states persisted for a run. */
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

/** Defines the persistence contract the orchestrator relies on for run management. */
export interface RepoPort {
  /** Creates a run record; used only in tests/demos where start API is not invoked. */
  createRun(runId: string, tenantId: string, projectId: string, now: string): Promise<void>;

  /** Reads the canonical run record by ID. */
  getRun(runId: string): Promise<RunRecord | null>;

  /** Attempts to atomically claim the run for the given worker; returns null if claim fails. */
  claimRun(runId: string, workerId: string, leaseDurationMs: number): Promise<RunRecord | null>;

  /** Extends an active lease for the worker currently processing the run. */
  extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean>;

  /** Updates the run status; returns false if the state transition was rejected. */
  updateRunStatus(
    runId: string,
    newStatus: RunLifecycleStatus,
    now: string,
    stopReason?: string | null,
  ): Promise<boolean>;

  appendEvent(event: DomainEvent): Promise<void>;

  getEvents(runId: string): Promise<DomainEvent[]>;

  saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void>;

  getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null>;

  getLatestSnapshot(runId: string): Promise<AgentState | null>;

  getLastEventSequence(runId: string): Promise<number>;

  upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string,
  ): Promise<void>;

  upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string,
  ): Promise<void>;
}
