import type { AgentState, StopReason } from "../domain/state";
import type { NodeEngine } from "./node-engine";
import type { NodeRegistry, EngineRunOnceResult } from "./types";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

/**
 * AgentRunnerCallbacks provides typed hooks for persistence and logging during execution.
 * PURPOSE: Decouples runner from Orchestrator persistence details.
 */
export interface AgentRunnerCallbacks<N extends string> {
  onAttempt: (result: EngineRunOnceResult<N>) => Promise<void>;
  onPersist: (
    state: AgentState,
    events: Array<{ kind: string; payload: Record<string, unknown> }>,
    nodeName: N,
  ) => Promise<void>;
}

/**
 * AgentRunnerResult represents the final outcome of runner execution.
 * PURPOSE: Feeds Worker with final state and termination reason.
 */
export interface AgentRunnerResult<N extends string> {
  state: AgentState;
  status: "completed" | "failed" | "canceled";
  stopReason: StopReason;
  lastNode: N;
}

/**
 * AgentRunner drives node execution loop with retry/backtrack semantics.
 * PURPOSE: Orchestrates engine.next/retry/backtrack decisions without encoding phase-specific logic.
 */
export class AgentRunner<N extends string, P, C> {
  constructor(private readonly engine: NodeEngine<N, P, C>) {}

  /**
   * run executes the agent loop starting from entryNode until termination.
   * PURPOSE: Single entry point for orchestrating agent execution with typed callbacks.
   */
  async run(opts: {
    state: AgentState;
    entryNode: N;
    ports: P;
    ctx: C;
    seed: () => number;
    shouldStop: () => Promise<{ stop: boolean; reason: StopReason | null }>;
    callbacks: AgentRunnerCallbacks<N>;
  }): Promise<AgentRunnerResult<N>> {
    const { state, entryNode, ports, ctx, seed, shouldStop, callbacks } = opts;
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.WORKER,
      runId: state.runId,
    });

    let currentNode: N = entryNode;
    let currentState = state;

    while (true) {
      // Check for cancellation or budget exhaustion
      const stopCheck = await shouldStop();
      if (stopCheck.stop) {
        logger.info("Stopping agent runner", { reason: stopCheck.reason });
        return {
          state: currentState,
          status: stopCheck.reason === "user_cancelled" ? "canceled" : "failed",
          stopReason: stopCheck.reason,
          lastNode: currentNode,
        };
      }

      // Execute current node via engine
      logger.info("Running node", { currentNode, attempt: currentState.iterationOrdinalNumber });

      const nowIso = new Date().toISOString();
      const engineResult = await this.engine.runOnce({
        state: currentState,
        nowIso,
        seed: seed(),
        ports,
        ctx,
        currentNode,
      });

      logger.info("Engine result", {
        nodeName: engineResult.nodeName,
        outcome: engineResult.outcome,
        nextNode: engineResult.nextNode,
        retryDelayMs: engineResult.retryDelayMs,
        backtracked: engineResult.backtracked,
      });

      // Persist events and snapshot
      await callbacks.onPersist(engineResult.state, engineResult.events, engineResult.nodeName);
      await callbacks.onAttempt(engineResult);

      currentState = engineResult.state;

      // Handle retry with backoff
      if (engineResult.retryDelayMs !== null && engineResult.nextNode === currentNode) {
        logger.warn("Retrying node with backoff", {
          delayMs: engineResult.retryDelayMs,
          attempt: currentState.iterationOrdinalNumber,
        });
        await new Promise((resolve) => setTimeout(resolve, engineResult.retryDelayMs ?? 0));
        continue;
      }

      // Handle backtrack
      if (engineResult.backtracked && engineResult.nextNode) {
        logger.info("Backtracking to node", { from: currentNode, to: engineResult.nextNode });
        currentNode = engineResult.nextNode;
        currentState = { ...engineResult.state, nodeName: engineResult.nextNode };
        continue;
      }

      // Handle transition to next node
      if (engineResult.nextNode && engineResult.outcome === "SUCCESS") {
        logger.info("Transitioning to next node", { from: currentNode, to: engineResult.nextNode });
        currentNode = engineResult.nextNode;
        currentState = { ...engineResult.state, nodeName: engineResult.nextNode };
        continue;
      }

      // Handle terminal failure
      if (engineResult.outcome === "FAILURE" && engineResult.nextNode === null) {
        logger.error("Node execution failed without recovery");
        return {
          state: {
            ...currentState,
            status: "failed",
            stopReason: engineResult.stopReason ?? "crash",
          },
          status: "failed",
          stopReason: engineResult.stopReason ?? "crash",
          lastNode: currentNode,
        };
      }

      // Handle terminal success
      if (engineResult.outcome === "SUCCESS" && engineResult.nextNode === null) {
        logger.info("Agent completed successfully");
        return {
          state: { ...currentState, status: "completed", stopReason: "success" },
          status: "completed",
          stopReason: "success",
          lastNode: currentNode,
        };
      }

      // Should never reach here
      logger.error("Unexpected engine result state", { engineResult });
      return {
        state: { ...currentState, status: "failed", stopReason: "crash" },
        status: "failed",
        stopReason: "crash",
        lastNode: currentNode,
      };
    }
  }
}
