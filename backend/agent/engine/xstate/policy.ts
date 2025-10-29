import type { AgentState, StopReason } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import type { EngineNodeExecutionResult } from "../types";
import { computeBackoffDelayMs } from "../transition-policy";
import type { AgentTransitionDecision } from "./types";

/**
 * computeTransitionDecision computes deterministic retry/backtrack/advance/terminal choice given raw execution.
 * PURPOSE: Allows XState machine to own transition policy without embedding it in states.
 */
export function computeTransitionDecision<N extends AgentNodeName>(
  execution: EngineNodeExecutionResult<N>,
  state: AgentState,
  computeNextNode: (state: AgentState) => N | null,
): AgentTransitionDecision {
  const { outcome, retryable, policy, successTarget, attemptNumber } = execution;

  if (outcome === "SUCCESS") {
    const nextNode = successTarget !== null ? successTarget : computeNextNode(state);
    if (nextNode === null) {
      return { kind: "terminalSuccess" };
    }
    return { kind: "advance", nextNode };
  }

  // outcome === "FAILURE"
  const { retry, backtrackTo } = policy;
  const canRetry = retryable !== false;

  if (attemptNumber < retry.maxAttempts && canRetry) {
    const delayMs = computeBackoffDelayMs(
      attemptNumber,
      retry.baseDelayMs,
      retry.maxDelayMs,
      execution.seedUsed,
    );
    return { kind: "retry", delayMs, attempt: attemptNumber };
  }

  if (backtrackTo) {
    return { kind: "backtrack", targetNode: backtrackTo };
  }

  return { kind: "terminalFailure", stopReason: state.stopReason ?? "crash" };
}

/**
 * applyTransitionToState updates state according to a transition decision.
 * PURPOSE: Ensures deterministic state mutations on retry/backtrack/advance.
 */
export function applyTransitionToState<N extends AgentNodeName>(
  prevState: AgentState,
  decision: AgentTransitionDecision,
): AgentState {
  switch (decision.kind) {
    case "advance":
      return { ...prevState, nodeName: decision.nextNode, iterationOrdinalNumber: 0 };
    case "retry":
      return { ...prevState, iterationOrdinalNumber: decision.attempt };
    case "backtrack":
      return {
        ...prevState,
        nodeName: decision.targetNode,
        iterationOrdinalNumber: 0,
        counters: { ...prevState.counters, restartsUsed: prevState.counters.restartsUsed + 1 },
      };
    case "terminalSuccess":
      return { ...prevState, status: "completed", stopReason: "success" };
    case "terminalFailure":
      return { ...prevState, status: "failed", stopReason: decision.stopReason };
    case "stop":
      return { ...prevState, status: "failed", stopReason: decision.stopReason };
    case "unexpected":
      return { ...prevState, status: "failed", stopReason: "crash" };
  }
}

