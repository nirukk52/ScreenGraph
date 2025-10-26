import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";

export interface SwitchPolicyInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  currentStrategyConfiguration: {
    strategyName: string;
    policyVersion: number;
  };
  requestedStrategyConfiguration: {
    strategyName: string;
    policyVersion: number;
  };
  reasonPlaintext: string;
}

export interface SwitchPolicyOutput extends CommonNodeOutput {
  runId: string;
  effectiveStrategyConfiguration: {
    strategyName: string;
    policyVersion: number;
  };
}

export async function switchPolicy(input: SwitchPolicyInput): Promise<{
  output: SwitchPolicyOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  return {
    output: {
      runId: input.runId,
      effectiveStrategyConfiguration: input.requestedStrategyConfiguration,
      nodeName: "SwitchPolicy",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: input.requestedStrategyConfiguration.policyVersion,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [
      {
        kind: "agent.policy.switched",
        payload: {
          from: input.currentStrategyConfiguration,
          to: input.requestedStrategyConfiguration,
          reason: input.reasonPlaintext,
        },
      },
    ],
  };
}
