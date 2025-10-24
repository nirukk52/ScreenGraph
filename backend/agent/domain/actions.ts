export type ActionKind = "TAP" | "SWIPE" | "BACK" | "TEXT_INPUT" | "LONG_PRESS";

export interface ActionCandidate {
  candidateId: string;
  actionKind: ActionKind;
  targetElementXPath: string | null;
  targetCoordinates: { x: number; y: number } | null;
  swipeDirection: "UP" | "DOWN" | "LEFT" | "RIGHT" | null;
  textInputValue: string | null;
  actionDescription: string;
  estimatedSuccessProbability: number;
  reasoning: string;
}

export interface ActionDecision {
  selectedActionCandidateId: string;
  selectionRationale: string;
  selectedActionDetails: ActionCandidate;
}

export interface ActionExecutionResult {
  actionCandidateId: string;
  executionStatus: "SUCCESS" | "FAILURE" | "TIMEOUT";
  executionDurationMs: number;
  errorMessage: string | null;
}
