import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { ActionCandidate, ActionDecision } from "../../domain/actions";
import { LLMPort } from "../../ports/llm";

export interface ChooseActionInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  availableActionCandidates: ActionCandidate[];
  selectionStrategy: "greedy" | "exploratory" | "balanced";
}

export interface ChooseActionOutput extends CommonNodeOutput {
  chosenActionDecision: ActionDecision;
  selectionDurationMs: number;
}

/**
 * ChooseAction node selects the next action to execute from candidates.
 * Uses LLM with specified strategy (greedy, exploratory, or balanced).
 */
export async function chooseAction(
  input: ChooseActionInput,
  llm: LLMPort
): Promise<{
  output: ChooseActionOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const startTime = Date.now();

  // Call LLM to choose the best action
  const actionDecision = await llm.chooseAction(
    input.availableActionCandidates,
    input.selectionStrategy,
    {
      runId: input.runId,
      stepOrdinal: input.stepOrdinal,
      iterationOrdinal: input.iterationOrdinalNumber,
      randomSeed: input.randomSeed,
    }
  );

  const selectionDurationMs = Date.now() - startTime;

  return {
    output: {
      runId: input.runId,
      nodeName: "ChooseAction",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      chosenActionDecision: actionDecision,
      selectionDurationMs,
    },
    events: [
      {
        kind: "agent.event.action_selected",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          selectedActionCandidateId: actionDecision.selectedActionCandidateId,
          actionKind: actionDecision.selectedActionDetails.actionKind,
          actionDescription: actionDecision.selectedActionDetails.actionDescription,
          selectionRationale: actionDecision.selectionRationale,
        },
      },
    ],
  };
}
