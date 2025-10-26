import { CommonNodeInput, CommonNodeOutput, StopReason } from "../../domain/state";
import { EventKind } from "../../domain/events";

export interface StopInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  intendedTerminalDisposition: "SUCCEEDED" | "FAILED";
  terminalizationBasis: string;
  finalRunMetrics: {
    totalIterationsExecuted: number;
    uniqueScreensDiscoveredCount: number;
    uniqueActionsPersistedCount: number;
    runDurationInMilliseconds: number;
  };
}

export interface StopOutput extends CommonNodeOutput {
  runId: string;
  confirmedTerminalDisposition: "SUCCEEDED" | "FAILED";
}

export async function stop(input: StopInput): Promise<{
  output: StopOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  return {
    output: {
      runId: input.runId,
      confirmedTerminalDisposition: input.intendedTerminalDisposition,
      nodeName: "Stop",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [
      {
        kind: "agent.run.finished",
        payload: {
          disposition: input.intendedTerminalDisposition,
          basis: input.terminalizationBasis,
          metrics: input.finalRunMetrics,
        },
      },
    ],
  };
}
