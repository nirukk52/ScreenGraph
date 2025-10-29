import { advanceStep } from "../domain/state";
import type { StopReason } from "../domain/state";
import type {
  EngineNodeExecutionResult,
  EngineRunOnceArgs,
  EngineRunOnceResult,
  NodeRegistry,
} from "./types";
import type { NodeOutputBase } from "./types";
import { computeBackoffDelayMs } from "./transition-policy";

/**
 * NodeEngine coordinates typed node execution and transition policy.
 * PURPOSE: Pure control plane used by Worker; persistence is delegated to Orchestrator.
 */
export class NodeEngine<N extends string, P, C> {
  constructor(private readonly registry: NodeRegistry<N, P, C>) {}

  /**
   * runOnce executes the current node and returns the next transition decision.
   */
  async runOnce(
    args: EngineRunOnceArgs<P, C> & { currentNode: N },
  ): Promise<EngineRunOnceResult<N>> {
    const execution = await this.runNode(args);
    const { state, outcome, successTarget, policy, retryable, events, attemptNumber, nodeName } = execution;

    if (outcome === "SUCCESS") {
      return {
        state: { ...state, iterationOrdinalNumber: 0 },
        nodeName,
        outcome,
        nextNode: successTarget,
        backtracked: false,
        retryDelayMs: null,
        stopReason: null as StopReason,
        events,
      };
    }

    const { retry, backtrackTo } = policy;
    const canRetry = retryable !== false;
    if (attemptNumber < retry.maxAttempts && canRetry) {
      const retryDelayMs = computeBackoffDelayMs(
        attemptNumber,
        retry.baseDelayMs,
        retry.maxDelayMs,
        execution.seedUsed,
      );
      return {
        state: { ...state, iterationOrdinalNumber: attemptNumber },
        nodeName,
        outcome,
        nextNode: nodeName,
        backtracked: false,
        retryDelayMs,
        stopReason: null as StopReason,
        events,
      };
    }

    if (backtrackTo) {
      return {
        state: {
          ...state,
          nodeName: backtrackTo,
          iterationOrdinalNumber: 0,
          counters: { ...state.counters, restartsUsed: state.counters.restartsUsed + 1 },
          stopReason: state.stopReason,
        },
        nodeName,
        outcome,
        nextNode: backtrackTo,
        backtracked: true,
        retryDelayMs: null,
        stopReason: null as StopReason,
        events,
      };
    }

    return {
      state: { ...state, status: "failed", stopReason: state.stopReason ?? "crash" },
      nodeName,
      outcome,
      nextNode: null,
      backtracked: false,
      retryDelayMs: null,
      stopReason: state.stopReason ?? "crash",
      events,
    };
  }

  /**
   * runNode executes a handler and returns the raw execution outcome without transition policy.
   */
  async runNode(
    args: EngineRunOnceArgs<P, C> & { currentNode: N },
  ): Promise<EngineNodeExecutionResult<N>> {
    const { state, nowIso, seed, ports, ctx, currentNode } = args;

    const handler = this.resolveHandler(currentNode);

    const input = handler.buildInput(state, ctx);
    const { output, events } = await handler.execute(input as never, ports);

    const advanced = advanceStep(state, handler.name, nowIso, seed);
    const updated = handler.applyOutput(advanced, output as NodeOutputBase);

    const retryable = (output as NodeOutputBase & { retryable?: boolean | null }).retryable ?? null;
    const attemptNumber = (state.iterationOrdinalNumber ?? 0) + 1;

    return {
      state: updated,
      nodeName: handler.name,
      outcome: output.nodeExecutionOutcomeStatus,
      retryable,
      policy: handler.onFailure,
      successTarget: handler.onSuccess,
      events,
      attemptNumber,
      seedUsed: seed,
    };
  }

  private resolveHandler(nodeName: N) {
    const handler = this.registry[nodeName];
    if (!handler) throw new Error(`Handler not registered for node: ${nodeName as string}`);
    return handler as any;
  }
}
