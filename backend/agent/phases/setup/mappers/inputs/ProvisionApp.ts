import type { AgentState } from "../../../../domain/state";
import type { ProvisionAppInput } from "../../../../nodes/setup/provision-app";
import type { SetupPhaseContext } from "../../types";

/**
 * Maps AgentState and SetupPhaseContext to ProvisionAppInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildProvisionAppInput(state: AgentState, ctx: SetupPhaseContext): ProvisionAppInput {
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

