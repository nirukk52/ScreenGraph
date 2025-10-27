import type { AgentState } from "../../../../domain/state";
import type { ProvisionAppOutput } from "../../../../nodes/setup/provision-app";

/**
 * Applies ProvisionAppOutput to AgentState.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 * Current implementation is a no-op; future versions may persist app provisioning outcome.
 */
export function applyProvisionAppOutput(prev: AgentState, _output: ProvisionAppOutput): AgentState {
  return {
    ...prev,
    // No direct state mutation for now; ProvisionApp output contains applicationProvisioningOutcome
    // but doesn't update AgentState fields yet
  };
}

