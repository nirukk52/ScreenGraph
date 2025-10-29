import { fromPromise } from "xstate";
import type { AgentState } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import type { EngineRunOnceResult } from "../types";
import type { AgentMachineDependencies, ShouldStopResult } from "./types";

/**
 * RunOnceActorInput contains the mutable state required for a single NodeEngine execution.
 * PURPOSE: Keeps the XState invoke call strongly typed while allowing the service to remain pure.
 */
export interface RunOnceActorInput {
  agentState: AgentState;
  currentNode: AgentNodeName;
}

/**
 * createRunOnceActor produces a typed promise actor that executes NodeEngine.runOnce.
 * PURPOSE: Centralizes callback invocation and logging so that the state machine remains declarative.
 */
export function createRunOnceActor(deps: AgentMachineDependencies) {
  return fromPromise<EngineRunOnceResult<AgentNodeName>, RunOnceActorInput>(async ({ input }) => {
    const { engine, ports, ctx, callbacks, seed, logger } = deps;

    logger.info("Running node", {
      currentNode: input.currentNode,
      attempt: input.agentState.iterationOrdinalNumber,
    });

    try {
      const result = await engine.runOnce({
        state: input.agentState,
        nowIso: new Date().toISOString(),
        seed: seed(),
        ports,
        ctx,
        currentNode: input.currentNode,
      });

      logger.info("Engine result", {
        nodeName: result.nodeName,
        outcome: result.outcome,
        nextNode: result.nextNode,
        retryDelayMs: result.retryDelayMs,
        backtracked: result.backtracked,
      });

      await callbacks.onPersist(result.state, result.events, result.nodeName);
      await callbacks.onAttempt(result);

      return result;
    } catch (err) {
      logger.error("RunOnce actor failed", { error: err });
      throw err;
    }
  });
}

/**
 * createShouldStopActor wraps the worker-provided shouldStop function in a promise actor.
 * PURPOSE: Enables the machine to gate node execution without duplicating cancellation logic.
 */
export interface ShouldStopActorInput {
  agentState: AgentState;
}

export function createShouldStopActor(deps: AgentMachineDependencies) {
  return fromPromise<ShouldStopResult, ShouldStopActorInput>(async ({ input }) =>
    deps.shouldStop(input.agentState),
  );
}

