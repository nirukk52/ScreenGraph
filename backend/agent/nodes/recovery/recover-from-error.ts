import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";

export interface RecoverFromErrorInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  lastFailedNodeName: string;
  lastFailureContext: {
    errorId: string;
    humanReadableFailureSummary: string;
  };
  retryPolicy: {
    maxRetries: number;
    backoffMillis: number;
  };
}

export interface RecoverFromErrorOutput extends CommonNodeOutput {
  runId: string;
  recoveryDisposition: "RETRY_NEXT_NODE" | "ESCALATE_TO_RESTART" | "ABORT";
}

export async function recoverFromError(input: RecoverFromErrorInput): Promise<{
  output: RecoverFromErrorOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const disposition =
    input.lastFailureContext.errorId === "DRIVER_TIMEOUT" ? "RETRY_NEXT_NODE" : "ABORT";

  return {
    output: {
      runId: input.runId,
      recoveryDisposition: disposition,
      nodeName: "RecoverFromError",
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
        kind: "agent.run.recovery_applied",
        payload: {
          disposition,
          failedNode: input.lastFailedNodeName,
          errorId: input.lastFailureContext.errorId,
        },
      },
    ],
  };
}
