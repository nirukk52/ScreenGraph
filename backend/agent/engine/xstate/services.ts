import { fromPromise } from "xstate";
import type { AgentState } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import type { EngineNodeExecutionResult } from "../types";
import type { AgentMachineDependencies, ShouldStopResult } from "./types";
import { computeTransitionDecision, applyTransitionToState } from "./policy";

/**
 * RunNodeActorInput contains the mutable state required for a single NodeEngine execution.
 * PURPOSE: Keeps the XState invoke call strongly typed while allowing the service to remain pure.
 */
export interface RunNodeActorInput {
  agentState: AgentState;
  currentNode: AgentNodeName;
}

/**
 * createRunNodeActor produces a typed promise actor that executes NodeEngine.runNode.
 * PURPOSE: Centralizes callback invocation and logging so that the state machine remains declarative.
 */
export function createRunNodeActor(deps: AgentMachineDependencies) {
  return fromPromise<{ execution: EngineNodeExecutionResult<AgentNodeName>; decision: any }, RunNodeActorInput>(async ({ input }) => {
    const { engine, ports, ctx, callbacks, seed, logger, computeNextNode } = deps;

    logger.info("Running node", {
      currentNode: input.currentNode,
      attempt: input.agentState.iterationOrdinalNumber,
    });

    try {
      const execution = await engine.runNode({
        state: input.agentState,
        nowIso: new Date().toISOString(),
        seed: seed(),
        ports,
        ctx,
        currentNode: input.currentNode,
      });

      const decision = computeTransitionDecision(execution, input.agentState, computeNextNode);
      const updatedState = applyTransitionToState(execution.state, decision);

      logger.info("Node execution", {
        nodeName: execution.nodeName,
        outcome: execution.outcome,
        decision: decision.kind,
      });

      await callbacks.onPersist(updatedState, execution.events, execution.nodeName);
      await callbacks.onAttempt({
        nodeName: execution.nodeName,
        outcome: execution.outcome,
        nextNode: decision.kind === "advance" ? decision.nextNode : null,
        backtracked: decision.kind === "backtrack",
      } as any);

      return { execution, decision };
    } catch (err) {
      logger.error("RunNode actor failed", { error: err });
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

