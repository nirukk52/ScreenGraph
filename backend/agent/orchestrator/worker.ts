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
import { WebDriverIOPackageManagerAdapter } from "../adapters/appium/webdriverio/package-manager.adapter";
import { WebDriverIOPerceptionAdapter } from "../adapters/appium/webdriverio/perception.adapter";
import { WebDriverIODeviceInfoAdapter } from "../adapters/appium/webdriverio/device-info.adapter";
import { EncoreStorageAdapter } from "../adapters/storage/encore-storage.adapter";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";
import { createActor } from "xstate";
import { createAgentMachine } from "../engine/xstate/machine";
import type {
  AgentMachineDependencies,
  AgentMachineOutput,
  ShouldStopResult,
} from "../engine/xstate/types";

/**
 * Build AgentPorts using the WebDriverIO adapter family so the agent relies on a single
 * automation stack across the codebase.
 *
 * Note: The session context will be null initially and populated after ensureDevice runs.
 * The adapters use context provider functions to lazily access the session context.
 */
function buildAgentPorts(): AgentPorts {
  const sessionPort = new WebDriverIOSessionAdapter();
  const contextProvider = () => sessionPort.getContext();
  const appLifecyclePort = new WebDriverIOAppLifecycleAdapter(contextProvider);
  const idleDetectorPort = new WebDriverIOIdleDetectorAdapter(contextProvider);
  const packageManagerPort = new WebDriverIOPackageManagerAdapter(contextProvider);
  const perceptionPort = new WebDriverIOPerceptionAdapter(contextProvider);
  const deviceInfoPort = new WebDriverIODeviceInfoAdapter(contextProvider);
  const storagePort = new EncoreStorageAdapter();
  return {
    sessionPort,
    appLifecyclePort,
    idleDetectorPort,
    packageManagerPort,
    perceptionPort,
    deviceInfoPort,
    storagePort,
  };
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

    const ports = buildAgentPorts();
    const registry = buildNodeRegistry(
      this.options.orchestrator.generateId.bind(this.options.orchestrator),
    );
    const ctx = buildAgentContext(this.options.run);
    const engine = new NodeEngine<AgentNodeName, AgentPorts, AgentContext>(registry);

    await this.options.orchestrator.saveSnapshot(initialState);

    const driver = process.env.AGENT_DRIVER ?? "runner";
    logger.info("Selected agent driver", { driver });

    const params: AgentDriverParams = {
      initialState,
      engine,
      ports,
      ctx,
      logger,
    };

    if (driver === "xstate") {
      return this.runWithXState(params);
    }

    return this.runWithRunner(params);
  }

  private async runWithRunner(params: AgentDriverParams): Promise<AgentWorkerExecutionResult> {
    const { initialState, engine, ports, ctx, logger } = params;
    const runner = new AgentRunner(engine);
    let latestState = initialState;

    const result = await runner.run({
      state: initialState,
      entryNode: "EnsureDevice",
      ports,
      ctx,
      seed: this.options.orchestrator.nextSeed.bind(this.options.orchestrator),
      shouldStop: async () => this.evaluateShouldStop(latestState),
      callbacks: {
        onAttempt: async (attempt) => {
          logger.info("Agent runner attempt completed", {
            nodeName: attempt.nodeName,
            outcome: attempt.outcome,
            nextNode: attempt.nextNode,
            backtracked: attempt.backtracked,
          });
        },
        onPersist: async (state, events, nodeName) => {
          latestState = state;
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

  private async runWithXState(params: AgentDriverParams): Promise<AgentWorkerExecutionResult> {
    const { initialState, engine, ports, ctx, logger } = params;

    const dependencies: AgentMachineDependencies = {
      engine,
      ports,
      ctx,
      seed: this.options.orchestrator.nextSeed.bind(this.options.orchestrator),
      shouldStop: async (state) => this.evaluateShouldStop(state),
      logger,
      callbacks: {
        onAttempt: async (attempt) => {
          logger.info("Agent runner attempt completed", {
            nodeName: attempt.nodeName,
            outcome: attempt.outcome,
            nextNode: attempt.nextNode,
            backtracked: attempt.backtracked,
          });
        },
        onPersist: async (state, events, nodeName) => {
          await this.options.orchestrator.recordNodeEvents(state, nodeName, events as never);
          await this.options.orchestrator.saveSnapshot(state);
        },
      },
    };

    const machine = createAgentMachine({
      initialState,
      entryNode: "EnsureDevice",
      dependencies,
    });

    const actor = createActor(machine);

    const completion = new Promise<AgentMachineOutput>((resolve, reject) => {
      const subscription = actor.subscribe({
        next: (snapshot) => {
          if (snapshot.status === "done") {
            subscription.unsubscribe?.();
            resolve(snapshot.output as AgentMachineOutput);
          }
        },
        error: (err) => {
          subscription.unsubscribe?.();
          reject(err);
        },
      });
    });

    actor.start();
    actor.send({ type: "START" });

    const output = await completion;
    actor.stop();

    logger.info("Agent XState completed", {
      status: output.status,
      stopReason: output.stopReason,
      lastNode: output.lastNode,
    });

    return {
      state: output.state,
      status: output.status,
      stopReason: output.stopReason,
    };
  }

  private async evaluateShouldStop(state: AgentState): Promise<ShouldStopResult> {
    if (await this.isCancellationRequested()) {
      const now = new Date().toISOString();
      const canceledState: AgentState = {
        ...state,
        status: "canceled",
        stopReason: "user_cancelled",
        timestamps: { ...state.timestamps, updatedAt: now },
      };
      await this.options.runDb.updateRunStatus(
        state.runId,
        "canceled",
        now,
        canceledState.stopReason,
      );
      await this.options.orchestrator.saveSnapshot(canceledState);
      return { stop: true, reason: "user_cancelled" };
    }

    const startMs = Date.parse(state.timestamps.createdAt);
    const elapsedMs = Date.now() - startMs;
    const { budgets } = this.options;
    const budgetExceeded =
      state.counters.stepsTotal >= budgets.maxSteps ||
      elapsedMs >= budgets.maxTimeMs ||
      state.counters.restartsUsed >= budgets.restartLimit;

    if (budgetExceeded) {
      const now = new Date().toISOString();
      const failedState: AgentState = {
        ...state,
        status: "failed",
        stopReason: "budget_exhausted",
        timestamps: { ...state.timestamps, updatedAt: now },
      };
      await this.options.orchestrator.saveSnapshot(failedState);
      return { stop: true, reason: "budget_exhausted" };
    }

    return { stop: false, reason: null };
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

/**
 * AgentWorkerOptions: Configuration inputs that tailor each worker run while keeping the driver
 * stack fixed to WebDriverIO.
 */
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

interface AgentDriverParams {
  initialState: AgentState;
  engine: NodeEngine<AgentNodeName, AgentPorts, AgentContext>;
  ports: AgentPorts;
  ctx: AgentContext;
  logger: ReturnType<typeof log.with>;
}
