import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { ProgressEvaluation, ProgressState } from "../../domain/progress";
import { GraphPort } from "../../ports/graph";

export interface DetectProgressInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  iterationStartTimestampMs: number;
  isNewScreenDiscovered: boolean;
  consecutiveNoProgressCount: number;
}

export interface DetectProgressOutput extends CommonNodeOutput {
  progressEvaluation: ProgressEvaluation;
}

/**
 * DetectProgress node evaluates whether the agent is making forward progress.
 * Checks for new screen discoveries and detects stalls or loops.
 */
export async function detectProgress(
  input: DetectProgressInput,
  graph: GraphPort,
): Promise<{
  output: DetectProgressOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  // Check for new screens discovered in this iteration
  const newScreensDiscoveredInIteration = await graph.getScreenDiscoveryCount(
    input.iterationStartTimestampMs,
  );

  let progressState: ProgressState = "FORWARD_PROGRESS";
  let consecutiveStallCount = input.consecutiveNoProgressCount;
  let loopDetectionDetails: string | null = null;
  let recommendedAction = "Continue exploration";

  if (newScreensDiscoveredInIteration === 0) {
    consecutiveStallCount++;

    if (consecutiveStallCount >= 5) {
      progressState = "LOOP_DETECTED";
      loopDetectionDetails = `No new screens discovered in ${consecutiveStallCount} consecutive iterations`;
      recommendedAction = "Consider switching policy or restarting app";
    } else if (consecutiveStallCount >= 3) {
      progressState = "STALL";
      loopDetectionDetails = `Limited progress: ${consecutiveStallCount} iterations without new discoveries`;
      recommendedAction = "Consider exploratory strategy or policy switch";
    }
  } else {
    // Reset stall count on progress
    consecutiveStallCount = 0;
    progressState = "FORWARD_PROGRESS";
    recommendedAction = "Continue current exploration strategy";
  }

  const progressEvaluation: ProgressEvaluation = {
    progressState,
    newScreensDiscoveredInIteration,
    consecutiveStallCount,
    loopDetectionDetails,
    recommendedAction,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "DetectProgress",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      progressEvaluation,
    },
    events: [
      {
        kind: "agent.run.progress_evaluated",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          iterationOrdinal: input.iterationOrdinalNumber,
          progressState,
          newScreensDiscoveredInIteration,
          consecutiveStallCount,
          recommendedAction,
        },
      },
    ],
  };
}
