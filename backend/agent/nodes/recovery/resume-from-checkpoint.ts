import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";

export interface ResumeFromCheckpointInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  requestedCheckpointKind: "LAST_SUCCESSFUL_NODE";
  allowPartialState: boolean;
}

export interface ResumeFromCheckpointOutput extends CommonNodeOutput {
  runId: string;
  restoredAgentStateReference: string;
}

export async function resumeFromCheckpoint(
  input: ResumeFromCheckpointInput
): Promise<{ output: ResumeFromCheckpointOutput; events: Array<{ kind: EventKind; payload: Record<string, unknown> }> }> {
  return {
    output: {
      runId: input.runId,
      restoredAgentStateReference: `obj://checkpoints/${input.runId}/iter-0003.json`,
      nodeName: "ResumeFromCheckpoint",
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
        kind: "agent.run.checkpoint_restored",
        payload: {
          checkpointKind: input.requestedCheckpointKind,
        },
      },
    ],
  };
}
