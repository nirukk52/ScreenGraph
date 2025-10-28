import type { TransitionPolicy } from "../../../engine/types";
import type { AgentNodeName } from "../../types";

/**
 * ProvisionAppPolicy defines retry/backtrack policy for ProvisionApp node.
 * PURPOSE: Encodes deterministic failure handling; backtrack to EnsureDevice on retry exhaustion.
 */
export const ProvisionAppPolicy: TransitionPolicy<AgentNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: "EnsureDevice",
};
