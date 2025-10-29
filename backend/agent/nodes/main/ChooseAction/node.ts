import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { EventKind } from "../../../domain/events";
import type { ActionCandidate, ActionDecision } from "../../../domain/actions";
import type { LLMPort } from "../../../ports/llm";

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
 * chooseAction selects the next action to execute from available candidates.
 * PURPOSE: Encapsulates LLM-based action selection with strategy selection (greedy/exploratory/balanced).
 */
export async function chooseAction(
  input: ChooseActionInput,
  llm: LLMPort,
): Promise<{
  output: ChooseActionOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  // TODO: Implement action selection logic
  throw new Error("chooseAction not yet implemented");
}

