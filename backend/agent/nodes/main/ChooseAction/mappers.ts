import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { ChooseActionInput, ChooseActionOutput } from "./node";

/**
 * buildChooseActionInput constructs ChooseActionInput from agent state and context.
 * PURPOSE: Centralize action candidate retrieval and strategy selection away from handler wiring.
 */
export function buildChooseActionInput(state: AgentState, ctx: AgentContext): ChooseActionInput {
  // TODO: Map state.availableActionCandidateIds to ActionCandidate[] via storage/registry lookup
  // TODO: Extract selectionStrategy from context or state
  return {
    runId: state.runId,
    stepOrdinal: state.stepOrdinal,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
    availableActionCandidates: [],
    selectionStrategy: "balanced",
  };
}

/**
 * applyChooseActionOutput mutates agent state with the chosen action decision.
 * PURPOSE: Persist selected action for downstream Act node execution.
 */
export function applyChooseActionOutput(prev: AgentState, output: ChooseActionOutput): AgentState {
  // TODO: Store chosenActionDecisionId in state.chosenActionDecisionId
  return {
    ...prev,
    chosenActionDecisionId: null, // TODO: Extract ID from output.chosenActionDecision
  };
}
