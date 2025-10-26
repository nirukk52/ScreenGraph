import type { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import type { EventKind } from "../../domain/events";
import type { IdleDetectorPort } from "../../ports/appium/idle-detector.port";

export interface WaitIdleInput extends CommonNodeInput {
  runId: string;
  idleHeuristicsConfiguration: {
    minQuietMillis: number;
    maxWaitMillis: number;
  };
}

export interface WaitIdleOutput extends CommonNodeOutput {
  runId: string;
  uiStabilityAssessment: {
    quietWindowObservedMillis: number;
    networkInFlightStatus: "NONE" | "IN_FLIGHT";
  };
}

export async function waitIdle(
  input: WaitIdleInput,
  idleDetectorPort: IdleDetectorPort,
  sessionId: string,
): Promise<{
  output: WaitIdleOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const quietMillis = await idleDetectorPort.waitIdle(
    input.idleHeuristicsConfiguration.minQuietMillis,
    input.idleHeuristicsConfiguration.maxWaitMillis,
  );

  return {
    output: {
      runId: input.runId,
      uiStabilityAssessment: {
        quietWindowObservedMillis: quietMillis,
        networkInFlightStatus: "NONE",
      },
      nodeName: "WaitIdle",
      stepOrdinal: 3,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-003`,
      randomSeed: 333333,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [],
  };
}
