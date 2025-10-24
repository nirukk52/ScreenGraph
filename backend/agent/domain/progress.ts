export type ProgressState = "FORWARD_PROGRESS" | "STALL" | "LOOP_DETECTED";

export interface ProgressEvaluation {
  progressState: ProgressState;
  newScreensDiscoveredInIteration: number;
  consecutiveStallCount: number;
  loopDetectionDetails: string | null;
  recommendedAction: string;
}

export type RoutingDirective = "CONTINUE" | "SWITCH_POLICY" | "RESTART_APP" | "STOP";

export interface ContinuationDecision {
  routingDirective: RoutingDirective;
  stoppingReason: string | null;
  budgetStatus: {
    stepsRemaining: number;
    timeRemainingMs: number;
    budgetExhausted: boolean;
  };
  shouldContinue: boolean;
}
