import type { TransitionPolicy } from "../../../engine/types";
import type { SetupNodeName } from "../types";

/**
 * EnsureDevicePolicy defines retry/backtrack policy for EnsureDevice node.
 * PURPOSE: Encodes deterministic failure handling without hardcoding in handler.
 */
export const EnsureDevicePolicy: TransitionPolicy<SetupNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: undefined,
};

/**
 * ProvisionAppPolicy defines retry/backtrack policy for ProvisionApp node.
 * PURPOSE: Encodes deterministic failure handling; backtrack to EnsureDevice on retry exhaustion.
 */
export const ProvisionAppPolicy: TransitionPolicy<SetupNodeName> = {
  retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
  backtrackTo: "EnsureDevice",
};

