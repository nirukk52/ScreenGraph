import type { LLMPort } from "../../ports/llm";
import type { ActionCandidate, ActionDecision } from "../../domain/actions";

/**
 * FakeLLM offers deterministic LLM behavior for tests and demos.
 * PURPOSE: Provides stable action enumeration/selection without hitting external LLM services.
 */
export class FakeLLM implements LLMPort {
  constructor(private readonly seed: number) {}

  async enumerateActions(
    uiHierarchyXmlRefId: string,
    maxActions: number,
  ): Promise<ActionCandidate[]> {
    void uiHierarchyXmlRefId; // Deterministic fake does not inspect hierarchy yet.
    const baseCandidates: ActionCandidate[] = [
      {
        candidateId: "01ACTCAND-01",
        actionKind: "TAP",
        targetElementXPath: "//button[1]",
        targetCoordinates: { x: 540, y: 960 },
        swipeDirection: null,
        textInputValue: null,
        actionDescription: "Tap primary button",
        estimatedSuccessProbability: 0.9,
        reasoning: "High confidence primary CTA",
      },
      {
        candidateId: "01ACTCAND-02",
        actionKind: "SWIPE",
        targetElementXPath: null,
        targetCoordinates: null,
        swipeDirection: "UP",
        textInputValue: null,
        actionDescription: "Scroll down",
        estimatedSuccessProbability: 0.7,
        reasoning: "Attempt to uncover new content",
      },
      {
        candidateId: "01ACTCAND-03",
        actionKind: "BACK",
        targetElementXPath: null,
        targetCoordinates: null,
        swipeDirection: null,
        textInputValue: null,
        actionDescription: "Navigate back",
        estimatedSuccessProbability: 0.6,
        reasoning: "Fallback navigation option",
      },
    ];

    return baseCandidates.slice(0, Math.max(1, Math.min(maxActions, baseCandidates.length)));
  }

  async chooseAction(
    candidates: ActionCandidate[],
    strategy: "greedy" | "exploratory" | "balanced",
  ): Promise<ActionDecision> {
    if (candidates.length === 0) {
      throw new Error("No candidates available");
    }

    const seededIndex = this.seed % candidates.length;
    const selected = candidates[seededIndex];
    return {
      selectedActionCandidateId: selected.candidateId,
      selectionRationale: `FakeLLM (${strategy}) selected candidate ${selected.candidateId}`,
      selectedActionDetails: selected,
    };
  }
}
