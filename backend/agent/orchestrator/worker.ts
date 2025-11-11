import log from "encore.dev/log";
import { createActor } from "xstate";
import { AGENT_ACTORS, MODULES } from "../../logging/logger";
import { WebDriverIOAppLifecycleAdapter } from "../adapters/appium/webdriverio/app-lifecycle.adapter";
import { WebDriverIODeviceInfoAdapter } from "../adapters/appium/webdriverio/device-info.adapter";
import { WebDriverIOIdleDetectorAdapter } from "../adapters/appium/webdriverio/idle-detector.adapter";
import { WebDriverIOPackageManagerAdapter } from "../adapters/appium/webdriverio/package-manager.adapter";
import { WebDriverIOPerceptionAdapter } from "../adapters/appium/webdriverio/perception.adapter";
import { WebDriverIOSessionAdapter } from "../adapters/appium/webdriverio/session.adapter";
import { FakeLLM } from "../adapters/fakes/fake-llm";
import { EncoreStorageAdapter } from "../adapters/storage/encore-storage.adapter";
import type { AgentState, Budgets } from "../domain/state";
import type { NodeRegistry } from "../engine/types";
import { createAgentMachine } from "../engine/xstate/agent.machine";
import { getInspector } from "../engine/xstate/inspector";
import type {
  AgentMachineContext,
  AgentMachineDependencies,
  AgentMachineOutput,
  ShouldStopResult,
} from "../engine/xstate/types";
import { buildAgentContext } from "../nodes/context";
import { buildNodeRegistry } from "../nodes/registry";
import type { AgentContext, AgentNodeName, AgentPorts } from "../nodes/types";
import type { RunDbPort, RunLifecycleStatus, RunRecord } from "../ports/db-ports/run-db.port";
import type { GraphPort } from "../ports/graph";
import type { Orchestrator } from "./orchestrator";

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
  // TODO: Replace with real LLM adapter implementation
  const llmPort = new FakeLLM(123456);
  // TODO: Wire real graph persistence adapter once storage service is ready.
  const graphPort: GraphPort = {
    async persistScreen() {
      throw new Error("GraphPort.persistScreen not yet implemented");
    },
    async persistAction() {
      throw new Error("GraphPort.persistAction not yet implemented");
    },
    async getGraphStatistics() {
      return {
        totalScreens: 0,
        totalActions: 0,
        totalUniqueScreens: 0,
      };
    },
    async findScreenByHash() {
      return null;
    },
    async getScreenDiscoveryCount() {
      return 0;
    },
  };
  return {
    sessionPort,
    appLifecyclePort,
    idleDetectorPort,
    packageManagerPort,
    perceptionPort,
    deviceInfoPort,
    storagePort,
    llmPort,
    graphPort,
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
    const ctx = buildAgentContext(this.options.jobConfig);
    await this.options.orchestrator.saveSnapshot(initialState);

    return this.runWithXState({
      initialState,
      ports,
      ctx,
      registry,
      logger,
    });
  }

  private async runWithXState(params: AgentDriverParams): Promise<AgentWorkerExecutionResult> {
    const { initialState, ports, ctx, registry, logger } = params;

    const dependencies: AgentMachineDependencies = {
      registry,
      ports,
      ctx,
      seed: this.options.orchestrator.nextSeed.bind(this.options.orchestrator),
      shouldStop: async (state) => this.evaluateShouldStop(state),
      logger,
      now: () => new Date().toISOString(),
      callbacks: {
        onAttempt: async (attempt) => {
          logger.info("Agent runner attempt completed", {
            nodeName: attempt.nodeName,
            outcome: attempt.outcome,
            nextNode: attempt.nextNode,
            backtracked: attempt.backtracked,
            attempt: attempt.attempt,
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

    // XState Inspector: Dev-only WebSocket inspector; pass inspect fn when enabled
    const inspector = getInspector();
    const actor = createActor(machine, { inspect: inspector?.inspect });

    const completion = new Promise<AgentMachineOutput>((resolve, reject) => {
      const subscription = actor.subscribe({
        next: (snapshot) => {
          if (!snapshot) return;
          if (snapshot.status === "done") {
            subscription.unsubscribe?.();
            const out = (snapshot as unknown as { output?: AgentMachineOutput }).output;
            if (out) {
              resolve(out);
              return;
            }
            // Fallback: derive final output from context when snapshot has no explicit output
            const ctx = snapshot.context as unknown as AgentMachineContext;
            const derived: AgentMachineOutput = {
              state: ctx.agentState,
              status:
                ctx.agentState.status === "completed" ||
                ctx.agentState.status === "failed" ||
                ctx.agentState.status === "canceled"
                  ? (ctx.agentState.status as "completed" | "failed" | "canceled")
                  : "failed",
              stopReason: ctx.agentState.stopReason ?? null,
              lastNode: ctx.latestExecution?.nodeName ?? ctx.currentNode,
            };
            resolve(derived);
          }
        },
        error: (err) => {
          subscription.unsubscribe?.();
          reject(err);
        },
      });
    });

    // Start actor before inspector connection - inspector needs active actor
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
    return latest?.status === "canceled";
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
  jobConfig: {
    runId: string;
    appiumServerUrl: string;
    packageName: string;
    apkPath: string;
    appActivity?: string;
  };
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
  ports: AgentPorts;
  ctx: AgentContext;
  registry: NodeRegistry<AgentNodeName, AgentPorts, AgentContext>;
  logger: ReturnType<typeof log.with>;
}
