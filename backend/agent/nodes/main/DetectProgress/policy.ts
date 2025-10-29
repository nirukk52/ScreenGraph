import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * DetectProgressPolicy defines retry behavior for progress detection failures.
 * PURPOSE: Allow transient graph query hiccups to retry without backtracking into setup nodes.
 */
export const DetectProgressPolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};
