import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { StopInput, StopOutput } from "./node";

/**
 * buildStopInput constructs terminal disposition input from state/context.
 * PURPOSE: Ensures final metrics snapshots are consistent across terminal transitions.
 */
export function buildStopInput(state: AgentState, ctx: AgentContext): StopInput {
  const runDurationInMilliseconds =
    Date.parse(state.timestamps.updatedAt) - Date.parse(state.timestamps.createdAt);

  return {
    runId: state.runId,
    stepOrdinal: state.stepOrdinal,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
    intendedTerminalDisposition: ctx.terminal.intendedTerminalDisposition,
    terminalizationBasis: ctx.terminal.terminalizationBasis,
    finalRunMetrics: {
      totalIterationsExecuted: state.counters.stepsTotal,
      uniqueScreensDiscoveredCount: state.counters.screensNew,
      uniqueActionsPersistedCount: state.availableActionCandidateIds.length,
      runDurationInMilliseconds,
    },
  };
}

/**
 * applyStopOutput mutates AgentState with completed status and stop reason.
 * PURPOSE: Marks orchestrator state as terminal for downstream persistence.
 */
export function applyStopOutput(prev: AgentState, output: StopOutput): AgentState {
  return {
    ...prev,
    status: "completed",
    stopReason: output.confirmedTerminalDisposition === "SUCCEEDED" ? "success" : "crash",
  };
}
