import type { AgentState, Budgets } from "../domain/state";
import type { RunRecord, RunLifecycleStatus, RunDbPort } from "../ports/db-ports/run-db.port";
import type { Orchestrator } from "./orchestrator";
import { NodeEngine } from "../engine/node-engine";
import { buildRegistry, buildContext } from "../phases/setup";
import type { SetupPhasePorts, SetupNodeName } from "../phases/setup/types";
import { WebDriverIOSessionAdapter } from "../adapters/appium/webdriverio/session.adapter";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

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
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs ?? Math.min(defaultHeartbeat, options.leaseDurationMs / 2);
  }

  async run(): Promise<AgentWorkerResult> {
    const { orchestrator, run, budgets } = this.options;
    const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.WORKER, runId: run.runId, workerId: this.options.workerId });
    let initializeResult: { state: AgentState; isResume: boolean };

    try {
      initializeResult = await orchestrator.initialize(run, budgets);
    } catch (err) {
      await this.markFailed(err);
      orchestrator.reset();
      throw err;
    }

    const { state, isResume } = initializeResult;
    logger.with({ isResume }).info("Worker execution begin");

    this.startHeartbeat();

    try {
      const outcome = await this.executeAgentLoop(state);

      if (outcome.status === "canceled") {
        logger.info("Worker completed with cancellation");
        return { status: "canceled", emittedEventCount: 0 };
      }

      if (outcome.status === "failed") {
        await this.markFailed(new Error(outcome.stopReason ?? "failed"));
        logger.error("Worker completed with failure");
        return { status: "failed", emittedEventCount: 0 };
      }

      await orchestrator.finalizeRun(outcome.state, outcome.stopReason ?? "success");
      logger.info("Worker finalized run successfully");
      return { status: "completed", emittedEventCount: 0 };
    } catch (err) {
      await this.markFailed(err);
      logger.error("Worker error during execution", err as Error);
      throw err;
    } finally {
      this.stopHeartbeat();
      orchestrator.reset();
      logger.info("Worker heartbeat stopped and orchestrator reset");
    }
  }

  private async executeAgentLoop(initialState: AgentState): Promise<AgentWorkerExecutionResult> {
    let state = initialState;
    
    // Wire setup phase ports, registry, and context
    const sessionPort = new WebDriverIOSessionAdapter();
    const ports: SetupPhasePorts = { sessionPort };
    const registry = buildRegistry(this.options.orchestrator.generateId.bind(this.options.orchestrator));
    const ctx = buildContext(this.options.run);
    const engine = new NodeEngine<SetupNodeName, SetupPhasePorts, typeof ctx>(registry);

    if (await this.isCancellationRequested()) {
      log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.WORKER, runId: state.runId, workerId: this.options.workerId }).warn(
        "Cancellation requested",
      );
      const now = new Date().toISOString();
      state = {
        ...state,
        status: "canceled",
        stopReason: "user_cancelled",
        timestamps: { ...state.timestamps, updatedAt: now },
      };
      await this.options.runDb.updateRunStatus(state.runId, "canceled", now, state.stopReason);
      // Snapshot persistence is handled by Orchestrator during node/event recording.
      return { state, status: "canceled", stopReason: state.stopReason };
    }

    // Minimal loop skeleton: honor budgets/cancel; engine usage deferred until nodes are registered
    const startMs = Date.parse(state.timestamps.createdAt);
    // Ensure we have a base snapshot at entry
    await this.options.orchestrator.saveSnapshot(state);

    // Budget checks (no node execution yet)
    const nowIso = new Date().toISOString();
    const elapsedMs = Date.now() - startMs;
    const { budgets } = this.options;
    const budgetExceeded =
      state.counters.stepsTotal >= budgets.maxSteps ||
      elapsedMs >= budgets.maxTimeMs ||
      state.counters.restartsUsed >= budgets.restartLimit;

    if (budgetExceeded) {
      log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.WORKER, runId: state.runId, workerId: this.options.workerId }).info(
        "Budget exhausted",
      );
      state = {
        ...state,
        status: "failed",
        stopReason: "budget_exhausted",
        timestamps: { ...state.timestamps, updatedAt: nowIso },
      };
      await this.options.orchestrator.saveSnapshot(state);
      return { state, status: "failed", stopReason: state.stopReason };
    }

    // With no handlers registered yet, finish successfully (scaffold complete)
    state = {
      ...state,
      status: "completed",
      stopReason: "success",
      timestamps: { ...state.timestamps, updatedAt: nowIso },
    };
    await this.options.orchestrator.saveSnapshot(state);
    return { state, status: "completed", stopReason: state.stopReason };
  }

  private startHeartbeat(): void {
    const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.WORKER, runId: this.options.run.runId, workerId: this.options.workerId });
    logger.info("Heartbeat started");
    this.heartbeatTimer = setInterval(() => {
      void this.options.runDb
        .extendLease(this.options.run.runId, this.options.workerId, this.options.leaseDurationMs)
        .then((extended: boolean) => {
          if (!extended) {
            logger.warn("Lease extension rejected; continuing until completion");
          }
        })
        .catch((err: unknown) => {
          logger.error("Failed to extend lease", err as Error);
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
    const latest = await this.options.runDb.getRun(this.options.run.runId);
    return Boolean(latest?.cancelRequestedAt);
  }

  private async markFailed(err: unknown): Promise<void> {
    const reason = err instanceof Error ? err.message : "unknown_error";
    await this.options.runDb.updateRunStatus(
      this.options.run.runId,
      "failed",
      new Date().toISOString(),
      reason,
    );
  }
}

interface AgentWorkerOptions {
  orchestrator: Orchestrator;
  runDb: RunDbPort;
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
