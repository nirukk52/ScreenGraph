import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { DriverPort } from "../../ports/driver.port";

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
  driver: DriverPort,
  sessionId: string,
): Promise<{
  output: WaitIdleOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const quietMillis = await driver.waitIdle(
    sessionId,
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
