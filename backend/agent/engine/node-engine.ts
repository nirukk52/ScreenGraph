import { advanceStep } from "../domain/state";
import type { StopReason } from "../domain/state";
import type { EngineRunOnceArgs, EngineRunOnceResult, NodeRegistry } from "./types";
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
  async runOnce(args: EngineRunOnceArgs<P, C> & { currentNode: N }): Promise<EngineRunOnceResult<N>> {
    const { state, nowIso, seed, ports, ctx, currentNode } = args;

    const handler = this.resolveHandler(currentNode);

    const input = handler.buildInput(state, ctx);
    const { output, events } = await handler.execute(input as never, ports);

    const advanced = advanceStep(state, handler.name, nowIso, seed);
    const updated = handler.applyOutput(advanced, output as NodeOutputBase);

    const outcome = output.nodeExecutionOutcomeStatus;

    if (outcome === "SUCCESS") {
      return {
        state: { ...updated, iterationOrdinalNumber: 0 },
        nodeName: handler.name,
        outcome,
        nextNode: handler.onSuccess,
        backtracked: false,
        retryDelayMs: null,
        stopReason: null as StopReason,
        events,
      };
    }

    const attempt = (state.iterationOrdinalNumber ?? 0) + 1;
    const { retry, backtrackTo } = handler.onFailure;
    if (attempt < retry.maxAttempts) {
      const retryDelayMs = computeBackoffDelayMs(attempt, retry.baseDelayMs, retry.maxDelayMs, seed);
      return {
        state: { ...updated, iterationOrdinalNumber: attempt },
        nodeName: handler.name,
        outcome,
        nextNode: handler.name,
        backtracked: false,
        retryDelayMs,
        stopReason: null as StopReason,
        events,
      };
    }

    if (backtrackTo) {
      return {
        state: {
          ...updated,
          nodeName: backtrackTo,
          iterationOrdinalNumber: 0,
          counters: { ...updated.counters, restartsUsed: updated.counters.restartsUsed + 1 },
        },
        nodeName: handler.name,
        outcome,
        nextNode: backtrackTo,
        backtracked: true,
        retryDelayMs: null,
        stopReason: null as StopReason,
        events,
      };
    }

    return {
      state: { ...updated, status: "failed", stopReason: "crash" },
      nodeName: handler.name,
      outcome,
      nextNode: null,
      backtracked: false,
      retryDelayMs: null,
      stopReason: "crash",
      events,
    };
  }

  private resolveHandler(nodeName: N) {
    const handler = this.registry[nodeName];
    if (!handler) throw new Error(`Handler not registered for node: ${nodeName as string}`);
    return handler as any;
  }
}


