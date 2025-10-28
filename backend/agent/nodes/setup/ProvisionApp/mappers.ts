import type { AgentState } from "../../../domain/state";
import type { ProvisionAppInput, ProvisionAppOutput } from "./node";
import type { AgentContext } from "../../types";

/**
 * Maps AgentState and AgentContext to ProvisionAppInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildProvisionAppInput(state: AgentState, ctx: AgentContext): ProvisionAppInput {
  if (!state.deviceRuntimeContextId) {
    throw new Error("EnsureDevice must run before ProvisionApp");
  }
  return {
    runId: state.runId,
    tenantId: state.tenantId,
    projectId: state.projectId,
    deviceRuntimeContextId: state.deviceRuntimeContextId,
    applicationUnderTestDescriptor: ctx.provisionApp.applicationUnderTestDescriptor,
    installationPolicy: ctx.provisionApp.installationPolicy,
  };
}

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



