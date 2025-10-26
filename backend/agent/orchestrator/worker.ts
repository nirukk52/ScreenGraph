import type { AgentState, Budgets } from "../domain/state";
import type { RepoPort, RunRecord, RunLifecycleStatus } from "../ports/repo.port";
import { Orchestrator } from "./orchestrator";

/**
 * AgentWorker owns the long-lived orchestration loop for a run, including lease heartbeats,
 * cancellation checks, and finalization. It is invoked by the subscription after successfully
 * claiming the run row to ensure single-writer semantics under at-least-once delivery.
 */
export class AgentWorker {
  private readonly heartbeatIntervalMs: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(private readonly options: AgentWorkerOptions) {
    const defaultHeartbeat = Math.max(Math.floor(options.leaseDurationMs / 3), 5_000);
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? Math.min(defaultHeartbeat, options.leaseDurationMs / 2);
  }

  async run(): Promise<AgentWorkerResult> {
    const { orchestrator, run, budgets } = this.options;
    let initializeResult: { state: AgentState; isResume: boolean };

    try {
      initializeResult = await orchestrator.initialize(run, budgets);
    } catch (err) {
      await this.markFailed(err);
      orchestrator.publishEvents();
      orchestrator.reset();
      throw err;
    }

    const { state, isResume } = initializeResult;
    console.log(`[AgentWorker] Run ${run.runId} ${isResume ? "resuming" : "starting"} execution`);

    this.startHeartbeat();

    try {
      const outcome = await this.executeAgentLoop(state);

      if (outcome.status === "canceled") {
        const emittedEventCount = orchestrator.publishEvents().length;
        return { status: "canceled", emittedEventCount };
      }

      await orchestrator.finalizeRun(outcome.state, outcome.stopReason ?? "success");
      const emittedEventCount = orchestrator.publishEvents().length;
      return { status: "completed", emittedEventCount };
    } catch (err) {
      await this.markFailed(err);
      orchestrator.publishEvents();
      throw err;
    } finally {
      this.stopHeartbeat();
      orchestrator.reset();
    }
  }

  private async executeAgentLoop(initialState: AgentState): Promise<AgentWorkerExecutionResult> {
    let state = initialState;

    if (await this.isCancellationRequested()) {
      console.log(`[AgentWorker] Cancellation requested for run ${state.runId}`);
      const now = new Date().toISOString();
      state = {
        ...state,
        status: "canceled",
        stopReason: "user_cancelled",
        timestamps: { ...state.timestamps, updatedAt: now },
      };
      await this.options.repo.updateRunStatus(
        state.runId,
        "canceled",
        now,
        state.stopReason,
      );
      await this.options.repo.saveSnapshot(state.runId, state.stepOrdinal, state);
      return { state, status: "canceled", stopReason: state.stopReason };
    }

    // TODO: implement full agent graph execution loop here.
    const now = new Date().toISOString();
    state = {
      ...state,
      status: "completed",
      stopReason: "success",
      timestamps: { ...state.timestamps, updatedAt: now },
    };
    await this.options.repo.saveSnapshot(state.runId, state.stepOrdinal, state);

    return { state, status: "completed", stopReason: state.stopReason };
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      void this.options.repo
        .extendLease(this.options.run.runId, this.options.workerId, this.options.leaseDurationMs)
        .then((extended) => {
          if (!extended) {
            console.warn(
              `[AgentWorker] Lease extension rejected for run ${this.options.run.runId}; continuing until completion`,
            );
          }
        })
        .catch((err) => {
          console.error(`[AgentWorker] Failed to extend lease for run ${this.options.run.runId}:`, err);
        });
    }, this.heartbeatIntervalMs);

    this.heartbeatTimer.unref?.();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async isCancellationRequested(): Promise<boolean> {
    const latest = await this.options.repo.getRun(this.options.run.runId);
    return Boolean(latest?.cancelRequestedAt);
  }

  private async markFailed(err: unknown): Promise<void> {
    const reason = err instanceof Error ? err.message : "unknown_error";
    await this.options.repo.updateRunStatus(
      this.options.run.runId,
      "failed",
      new Date().toISOString(),
      reason,
    );
  }
}

interface AgentWorkerOptions {
  orchestrator: Orchestrator;
  repo: RepoPort;
  run: RunRecord;
  workerId: string;
  budgets: Budgets;
  leaseDurationMs: number;
  heartbeatIntervalMs?: number;
}

export interface AgentWorkerResult {
  status: RunLifecycleStatus;
  emittedEventCount: number;
}

interface AgentWorkerExecutionResult {
  state: AgentState;
  status: RunLifecycleStatus;
  stopReason: string | null;
}

