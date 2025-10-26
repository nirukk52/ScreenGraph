import type { RoutingDirective } from "../domain/entities";
import type { AgentState } from "../domain/state";

export function routeNext(state: AgentState, directive: RoutingDirective): string {
  switch (directive) {
    case "CONTINUE":
      return "perceive";
    case "SWITCH_POLICY":
      return "switch_policy";
    case "RESTART_APP":
      return "restart_app";
    case "STOP":
      return "stop";
    default:
      return "stop";
  }
}

export function shouldTerminate(state: AgentState): boolean {
  if (state.counters.stepsTotal >= state.budgets.maxSteps) {
    return true;
  }
  if (state.counters.outsideAppSteps >= state.budgets.outsideAppLimit) {
    return true;
  }
  if (state.counters.restartsUsed >= state.budgets.restartLimit) {
    return true;
  }
  return false;
}
