import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * EnsureDevicePolicy defines retry/backtrack policy for EnsureDevice node.
 * PURPOSE: Encodes deterministic failure handling without hardcoding in handler.
 */
export const EnsureDevicePolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};
