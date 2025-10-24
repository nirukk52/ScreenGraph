import { CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { ActionCandidate } from "../../domain/actions";
import { LLMPort } from "../../ports/llm";

export interface EnumerateActionsInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  uiHierarchyXmlRefId: string;
  maxActions: number;
}

export interface EnumerateActionsOutput extends CommonNodeOutput {
  availableActionCandidates: ActionCandidate[];
  enumerationDurationMs: number;
}

/**
 * EnumerateActions node derives actionable operations from the UI hierarchy.
 * Uses LLM to analyze UI elements and generate candidate actions.
 */
export async function enumerateActions(
  input: EnumerateActionsInput,
  llm: LLMPort
): Promise<{
  output: EnumerateActionsOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const startTime = Date.now();

  // Call LLM to enumerate possible actions
  const actionCandidates = await llm.enumerateActions(
    input.uiHierarchyXmlRefId,
    input.maxActions,
    {
      runId: input.runId,
      stepOrdinal: input.stepOrdinal,
      iterationOrdinal: input.iterationOrdinalNumber,
    }
  );

  const enumerationDurationMs = Date.now() - startTime;

  return {
    output: {
      runId: input.runId,
      nodeName: "EnumerateActions",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      availableActionCandidates: actionCandidates,
      enumerationDurationMs,
    },
    events: [
      {
        kind: "agent.event.actions_enumerated",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          actionCount: actionCandidates.length,
          candidateIds: actionCandidates.map((c) => c.candidateId),
        },
      },
    ],
  };
}
