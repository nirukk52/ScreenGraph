import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * PerceivePolicy defines retry behavior for perception capture failures.
 * PURPOSE: Allow transient Appium hiccups to retry without backtracking into setup nodes.
 */
export const PerceivePolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};

