import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { DetectProgressInput, DetectProgressOutput } from "./node";

/**
 * buildDetectProgressInput constructs DetectProgressInput from agent state and context.
 * PURPOSE: Centralize progress tracking data extraction (stall count, iteration timestamps) away from handler wiring.
 */
export function buildDetectProgressInput(state: AgentState, _ctx: AgentContext): DetectProgressInput {
  // TODO: Track iteration start timestamps explicitly once iteration bookkeeping lands.
  const iterationStartTimestampMs = Date.now();
  
  // Extract consecutive no-progress count from counters
  const consecutiveNoProgressCount = state.counters.noProgressCycles;
  
  // Check if a new screen was discovered based on graph persistence outcome
  // This is a simplification - ideally we'd check the actual graph persistence outcome
  const isNewScreenDiscovered = state.counters.screensNew > 0 && state.graphPersistenceOutcomeId !== null;

  return {
    runId: state.runId,
    stepOrdinal: state.stepOrdinal,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
    iterationStartTimestampMs,
    isNewScreenDiscovered,
    consecutiveNoProgressCount,
  };
}

/**
 * applyDetectProgressOutput mutates agent state with progress evaluation results.
 * PURPOSE: Persist progress state (stall count, progress evaluation ID) for downstream ShouldContinue routing.
 */
export function applyDetectProgressOutput(prev: AgentState, output: DetectProgressOutput): AgentState {
  return {
    ...prev,
    // Update counter for consecutive no-progress cycles
    counters: {
      ...prev.counters,
      noProgressCycles: output.progressEvaluation.consecutiveStallCount,
    },
    // Store progress evaluation reference (in production this would be an ID from storage)
    progressEvaluationId: output.progressEvaluation ? `progress-${prev.runId}-${prev.stepOrdinal}` : null,
  };
}
