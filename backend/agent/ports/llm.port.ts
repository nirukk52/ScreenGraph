import type { ActionCandidate } from "../domain/entities";

export interface LLMPort {
  enumerateActions(uiHierarchyXmlRefId: string, maxActions: number): Promise<ActionCandidate[]>;

  chooseAction(candidates: ActionCandidate[], strategy: string): Promise<string>;
}
