import type { AgentState } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";

/**
 * computeNextNodeFromState determines the next node based on current state and orchestration rules.
 * PURPOSE: Centralizes routing decisions without relying on SwitchPolicy for green-path flow.
 */
export function computeNextNodeFromState(state: AgentState): AgentNodeName | null {
  // Terminal states
  if (state.status === "completed" || state.status === "failed" || state.status === "canceled") {
    return null;
  }

  // Setup phase transitions
  if (state.nodeName === "EnsureDevice") {
    return "ProvisionApp";
  }
  if (state.nodeName === "ProvisionApp") {
    return "LaunchOrAttach";
  }
  if (state.nodeName === "LaunchOrAttach") {
    return "Perceive";
  }
  if (state.nodeName === "Perceive") {
    return "WaitIdle";
  }
  if (state.nodeName === "WaitIdle") {
    return "Perceive"; // Main loop
  }

  // For now, default to null (terminal) until main loop nodes are implemented
  return null;
}

