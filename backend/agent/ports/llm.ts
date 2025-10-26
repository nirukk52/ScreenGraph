import type { ActionCandidate, ActionDecision } from "../domain/actions";

export interface LLMPort {
  enumerateActions(
    uiHierarchyXmlRefId: string,
    maxActions: number,
    context?: Record<string, unknown>,
  ): Promise<ActionCandidate[]>;

  chooseAction(
    candidates: ActionCandidate[],
    strategy: "greedy" | "exploratory" | "balanced",
    context?: Record<string, unknown>,
  ): Promise<ActionDecision>;
}
