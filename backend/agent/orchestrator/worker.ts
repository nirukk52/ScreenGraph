import type { AgentState, Budgets } from "../domain/state";
import type { RunRecord, RunLifecycleStatus, RunDbPort } from "../ports/db-ports/run-db.port";
import type { Orchestrator } from "./orchestrator";
import { NodeEngine } from "../engine/node-engine";
import { AgentRunner } from "../engine/agent-runner";
import { buildNodeRegistry } from "../nodes/registry";
import { buildAgentContext } from "../nodes/context";
import type { AgentNodeName, AgentPorts, AgentContext } from "../nodes/types";
import { WebDriverIOSessionAdapter } from "../adapters/appium/webdriverio/session.adapter";
import { WebDriverIOAppLifecycleAdapter } from "../adapters/appium/webdriverio/app-lifecycle.adapter";
import { WebDriverIOIdleDetectorAdapter } from "../adapters/appium/webdriverio/idle-detector.adapter";
import { WebDriverSessionAdapter } from "../adapters/appium/webdriver/session.adapter";
import { WebDriverAppLifecycleAdapter } from "../adapters/appium/webdriver/app-lifecycle.adapter";
import { WebDriverIdleDetectorAdapter } from "../adapters/appium/webdriver/idle-detector.adapter";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

/**
 * DriverImpl: Selector for driver implementation to use.
 * Default to WebDriverStandalone for deterministic POC/MVP runs.
 */
export enum DriverImpl {
  WebDriverStandalone = "WebDriverStandalone",
  WebdriverIO = "WebdriverIO",
}

/**
 * Build AgentPorts based on selected driver implementation.
 * PURPOSE: Configure which adapter family (WebDriver standalone vs WebDriverIO) to use.
 *
 * Note: The session context will be null initially and populated after ensureDevice runs.
 * The adapters use context provider functions to lazily access the session context.
 */
function buildAgentPorts(impl: DriverImpl = DriverImpl.WebDriverStandalone): AgentPorts {
  if (impl === DriverImpl.WebDriverStandalone) {
    const sessionPort = new WebDriverSessionAdapter();
    const contextProvider = () => sessionPort.getContext();
    const appLifecyclePort = new WebDriverAppLifecycleAdapter(contextProvider);
    const idleDetectorPort = new WebDriverIdleDetectorAdapter(contextProvider);
    return { sessionPort, appLifecyclePort, idleDetectorPort };
  }
  const sessionPort = new WebDriverIOSessionAdapter();
  const contextProvider = () => sessionPort.getContext();
  const appLifecyclePort = new WebDriverIOAppLifecycleAdapter(contextProvider);
  const idleDetectorPort = new WebDriverIOIdleDetectorAdapter(contextProvider);
  return { sessionPort, appLifecyclePort, idleDetectorPort };
}

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
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.WORKER,
      runId: run.runId,
      workerId: this.options.workerId,
    });
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
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.WORKER,
      runId: initialState.runId,
      workerId: this.options.workerId,
    });

    // Wire agent ports based on selected driver implementation (default: WebDriverStandalone)
    const ports = buildAgentPorts(this.options.driverImpl);
    const registry = buildNodeRegistry(
      this.options.orchestrator.generateId.bind(this.options.orchestrator),
    );
    const ctx = buildAgentContext(this.options.run);
    const engine = new NodeEngine<AgentNodeName, AgentPorts, AgentContext>(registry);
    const runner = new AgentRunner(engine);

    // Save initial snapshot
    await this.options.orchestrator.saveSnapshot(initialState);

    // Run agent loop via AgentRunner
    const result = await runner.run({
      state: initialState,
      entryNode: "EnsureDevice",
      ports,
      ctx,
      seed: this.options.orchestrator.nextSeed.bind(this.options.orchestrator),
      shouldStop: async () => {
        if (await this.isCancellationRequested()) {
          const now = new Date().toISOString();
          const canceledState = {
            ...initialState,
            status: "canceled" as const,
            stopReason: "user_cancelled" as const,
            timestamps: { ...initialState.timestamps, updatedAt: now },
          };
          await this.options.runDb.updateRunStatus(
            initialState.runId,
            "canceled",
            now,
            canceledState.stopReason,
          );
          await this.options.orchestrator.saveSnapshot(canceledState);
          return { stop: true, reason: "user_cancelled" as const };
        }

        const startMs = Date.parse(initialState.timestamps.createdAt);
        const elapsedMs = Date.now() - startMs;
        const { budgets } = this.options;
        const budgetExceeded =
          initialState.counters.stepsTotal >= budgets.maxSteps ||
          elapsedMs >= budgets.maxTimeMs ||
          initialState.counters.restartsUsed >= budgets.restartLimit;

        if (budgetExceeded) {
          const now = new Date().toISOString();
          const failedState = {
            ...initialState,
            status: "failed" as const,
            stopReason: "budget_exhausted" as const,
            timestamps: { ...initialState.timestamps, updatedAt: now },
          };
          await this.options.orchestrator.saveSnapshot(failedState);
          return { stop: true, reason: "budget_exhausted" as const };
        }

        return { stop: false, reason: null };
      },
      callbacks: {
        onAttempt: async (result) => {
          logger.info("Agent runner attempt completed", {
            nodeName: result.nodeName,
            outcome: result.outcome,
            nextNode: result.nextNode,
            backtracked: result.backtracked,
          });
        },
        onPersist: async (state, events, nodeName) => {
          await this.options.orchestrator.recordNodeEvents(state, nodeName, events as never);
          await this.options.orchestrator.saveSnapshot(state);
        },
      },
    });

    logger.info("Agent runner completed", {
      status: result.status,
      stopReason: result.stopReason,
      lastNode: result.lastNode,
    });

    return {
      state: result.state,
      status: result.status,
      stopReason: result.stopReason,
    };
  }

  private startHeartbeat(): void {
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.WORKER,
      runId: this.options.run.runId,
      workerId: this.options.workerId,
    });
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
  driverImpl?: DriverImpl;
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
