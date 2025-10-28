import type { AgentState } from "../../../domain/state";
import type { WaitIdleInput, WaitIdleOutput } from "./node";
import type { AgentContext } from "../../types";

/**
 * Maps AgentState and AgentContext to WaitIdleInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildWaitIdleInput(state: AgentState, ctx: AgentContext): WaitIdleInput {
  return {
    runId: state.runId,
    idleHeuristicsConfiguration: ctx.waitIdle.idleHeuristicsConfiguration,
  };
}

/**
 * Applies WaitIdleOutput to AgentState.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 * Current implementation is a no-op; future versions may persist UI stability assessment.
 */
export function applyWaitIdleOutput(prev: AgentState, _output: WaitIdleOutput): AgentState {
  return {
    ...prev,
    // No direct state mutation for now; WaitIdle output contains uiStabilityAssessment
    // but doesn't update AgentState fields yet
  };
}
