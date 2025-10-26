import type { RepoPort, RunRecord, RunLifecycleStatus } from "../ports/repo.port";
import type { AgentState } from "../domain/state";
import type { DomainEvent } from "../domain/events";

export class InMemoryRepo implements RepoPort {
  private runs = new Map<string, RunRecord>();
  private events = new Map<string, DomainEvent[]>();
  private snapshots = new Map<string, Map<number, AgentState>>();
  private screens = new Map<string, ScreenRecord>();
  private actions = new Map<string, ActionRecord>();

  async createRun(runId: string, tenantId: string, projectId: string, now: string): Promise<void> {
    this.runs.set(runId, {
      runId,
      tenantId,
      projectId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      appConfigId: "default",
      processingBy: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      startedAt: null,
      finishedAt: null,
      cancelRequestedAt: null,
      stopReason: null,
    });
    this.events.set(runId, []);
    this.snapshots.set(runId, new Map());
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async claimRun(runId: string, workerId: string, leaseDurationMs: number): Promise<RunRecord | null> {
    const run = this.runs.get(runId);
    if (!run) return null;

    const now = Date.now();
    const leaseUntil = new Date(now + leaseDurationMs).toISOString();

    if (
      run.status !== "queued" &&
      !(run.status === "running" && (!run.leaseExpiresAt || new Date(run.leaseExpiresAt).getTime() < now))
    ) {
      return null;
    }

    run.status = "running";
    run.processingBy = workerId;
    run.leaseExpiresAt = leaseUntil;
    run.heartbeatAt = new Date(now).toISOString();
    run.startedAt = run.startedAt ?? new Date(now).toISOString();
    run.updatedAt = new Date(now).toISOString();
    this.runs.set(runId, run);
    return run;
  }

  async extendLease(runId: string, workerId: string, leaseDurationMs: number): Promise<boolean> {
    const run = this.runs.get(runId);
    if (!run || run.processingBy !== workerId || run.status !== "running") {
      return false;
    }

    const now = Date.now();
    const leaseUntil = new Date(now + leaseDurationMs).toISOString();
    run.leaseExpiresAt = leaseUntil;
    run.heartbeatAt = new Date(now).toISOString();
    run.updatedAt = new Date(now).toISOString();
    this.runs.set(runId, run);
    return true;
  }

  async updateRunStatus(
    runId: string,
    newStatus: RunLifecycleStatus,
    now: string,
    stopReason?: string | null,
  ): Promise<boolean> {
    const run = this.runs.get(runId);
    if (!run) return false;

    run.status = newStatus;
    run.updatedAt = now;
    if (newStatus === "completed" || newStatus === "failed" || newStatus === "canceled") {
      run.finishedAt = now;
    }
    if (stopReason) {
      run.stopReason = stopReason;
    }
    this.runs.set(runId, run);
    return true;
  }

  async appendEvent(event: DomainEvent): Promise<void> {
    const runEvents = this.events.get(event.runId);
    if (!runEvents) {
      throw new Error(`Run ${event.runId} not found`);
    }

    const existing = runEvents.find((e) => e.sequence === event.sequence);
    if (existing) {
      if (existing.checksum !== event.checksum) {
        throw new Error(
          `Idempotency violation: duplicate sequence ${event.sequence} with different checksum`,
        );
      }
      return;
    }

    runEvents.push(event);
    runEvents.sort((a, b) => a.sequence - b.sequence);
  }

  async getEvents(runId: string): Promise<DomainEvent[]> {
    return this.events.get(runId) ?? [];
  }

  async saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void> {
    const runSnapshots = this.snapshots.get(runId);
    if (!runSnapshots) {
      throw new Error(`Run ${runId} not found`);
    }
    runSnapshots.set(stepOrdinal, JSON.parse(JSON.stringify(state)));
  }

  async getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null> {
    const runSnapshots = this.snapshots.get(runId);
    if (!runSnapshots) return null;
    const snapshot = runSnapshots.get(stepOrdinal);
    return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
  }

  async getLatestSnapshot(runId: string): Promise<AgentState | null> {
    const runSnapshots = this.snapshots.get(runId);
    if (!runSnapshots) {
      return null;
    }

    const maxKey = Math.max(...runSnapshots.keys());
    if (maxKey === -Infinity) {
      return null;
    }

    const snapshot = runSnapshots.get(maxKey);
    return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
  }

  async getLastEventSequence(runId: string): Promise<number> {
    const runEvents = this.events.get(runId) ?? [];
    if (runEvents.length === 0) {
      return 0;
    }
    return runEvents[runEvents.length - 1].sequence;
  }

  async upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string,
  ): Promise<void> {
    this.screens.set(screenId, {
      screenId,
      runId,
      perceptualHash64,
      screenshotRef,
      xmlRef,
      evidenceCounter: (this.screens.get(screenId)?.evidenceCounter ?? 0) + 1,
    });
  }

  async upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string,
  ): Promise<void> {
    this.actions.set(actionId, {
      actionId,
      runId,
      fromScreenId,
      toScreenId,
      actionKind,
      evidenceCounter: (this.actions.get(actionId)?.evidenceCounter ?? 0) + 1,
    });
  }

  getAllScreens(): ScreenRecord[] {
    return Array.from(this.screens.values());
  }

  getAllActions(): ActionRecord[] {
    return Array.from(this.actions.values());
  }

  reset(): void {
    this.runs.clear();
    this.events.clear();
    this.snapshots.clear();
    this.screens.clear();
    this.actions.clear();
  }
}

interface ScreenRecord {
  screenId: string;
  runId: string;
  perceptualHash64: string;
  screenshotRef: string;
  xmlRef: string;
  evidenceCounter: number;
}

interface ActionRecord {
  actionId: string;
  runId: string;
  fromScreenId: string;
  toScreenId: string;
  actionKind: string;
  evidenceCounter: number;
}
