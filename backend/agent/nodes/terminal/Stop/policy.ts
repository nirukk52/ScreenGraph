import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * StopPolicy enforces no retries for terminal nodes.
 * PURPOSE: Guarantees the loop halts after a single successful stop invocation.
 */
export const StopPolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 },
  backtrackTo: undefined,
};
