import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * SwitchPolicyPolicy defines retry semantics for policy switching.
 * PURPOSE: Keeps policy selection robust to transient orchestration errors without backtracking.
 */
export const SwitchPolicyPolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 2000 },
  backtrackTo: undefined,
};

