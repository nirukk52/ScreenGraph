import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * ChooseActionPolicy defines retry behavior for action selection failures.
 * PURPOSE: Allow transient LLM hiccups to retry without backtracking into setup nodes.
 */
export const ChooseActionPolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};

