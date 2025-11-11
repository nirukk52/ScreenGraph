import type { EventKind } from "../../domain/events";
import type { ContinuationDecision, ProgressState, RoutingDirective } from "../../domain/progress";
import type { CommonNodeInput, CommonNodeOutput } from "../../domain/state";

export interface ShouldContinueInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  maxSteps: number;
  maxTimeMs: number;
  maxIterations: number;
  startTimestampMs: number;
  progressState: ProgressState;
  consecutiveStallCount: number;
}

export interface ShouldContinueOutput extends CommonNodeOutput {
  continuationDecision: ContinuationDecision;
}

/**
 * ShouldContinue node determines whether to continue exploration.
 * Checks budget constraints and progress state to decide next action.
 */
export async function shouldContinue(input: ShouldContinueInput): Promise<{
  output: ShouldContinueOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const currentTime = Date.now();
  const elapsedTimeMs = currentTime - input.startTimestampMs;
  const timeRemainingMs = Math.max(0, input.maxTimeMs - elapsedTimeMs);
  const stepsRemaining = Math.max(0, input.maxSteps - input.stepOrdinal);

  let routingDirective: RoutingDirective = "CONTINUE";
  let stoppingReason: string | null = null;
  let shouldContinue = true;

  // Check budget exhaustion
  const budgetExhausted = stepsRemaining <= 0 || timeRemainingMs <= 0;

  if (budgetExhausted) {
    routingDirective = "STOP";
    shouldContinue = false;
    if (stepsRemaining <= 0) {
      stoppingReason = `Maximum steps (${input.maxSteps}) reached`;
    } else {
      stoppingReason = `Maximum time (${input.maxTimeMs}ms) reached`;
    }
  } else if (input.iterationOrdinalNumber >= input.maxIterations) {
    routingDirective = "STOP";
    shouldContinue = false;
    stoppingReason = `Maximum iterations (${input.maxIterations}) reached`;
  } else if (input.progressState === "LOOP_DETECTED") {
    // Loop detected - try switching policy first
    if (input.consecutiveStallCount >= 10) {
      routingDirective = "RESTART_APP";
      shouldContinue = false;
      stoppingReason = "Persistent loop detected after policy changes - restarting app";
    } else {
      routingDirective = "SWITCH_POLICY";
      shouldContinue = true;
      stoppingReason = "Loop detected - switching exploration policy";
    }
  } else if (input.progressState === "STALL") {
    // Stall detected - consider policy switch
    if (input.consecutiveStallCount >= 5) {
      routingDirective = "SWITCH_POLICY";
      shouldContinue = true;
      stoppingReason = "Prolonged stall - switching to exploratory policy";
    } else {
      routingDirective = "CONTINUE";
      shouldContinue = true;
    }
  }

  const continuationDecision: ContinuationDecision = {
    routingDirective,
    stoppingReason,
    budgetStatus: {
      stepsRemaining,
      timeRemainingMs,
      budgetExhausted,
    },
    shouldContinue,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "ShouldContinue",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      continuationDecision,
    },
    events: [
      {
        kind: "agent.run.continuation_decided",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          iterationOrdinal: input.iterationOrdinalNumber,
          routingDirective,
          shouldContinue,
          stoppingReason,
          stepsRemaining,
          timeRemainingMs,
          budgetExhausted,
        },
      },
    ],
  };
}
