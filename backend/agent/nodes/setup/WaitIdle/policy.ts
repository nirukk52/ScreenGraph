import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * WaitIdlePolicy defines retry/backtrack policy for WaitIdle node.
 * PURPOSE: Encodes deterministic failure handling; no backtracking on idle timeout.
 */
export const WaitIdlePolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};

