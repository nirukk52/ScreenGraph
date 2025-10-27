import type { AgentState } from "../../../../domain/state";
import type { EnsureDeviceInput } from "../../../../nodes/setup/ensure-device";
import type { SetupPhaseContext } from "../../types";

/**
 * Maps AgentState and SetupPhaseContext to EnsureDeviceInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildEnsureDeviceInput(state: AgentState, ctx: SetupPhaseContext): EnsureDeviceInput {
  return {
    runId: state.runId,
    tenantId: state.tenantId,
    projectId: state.projectId,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    deviceConfiguration: ctx.ensureDevice.deviceConfiguration,
    driverReusePolicy: ctx.ensureDevice.driverReusePolicy,
  };
}

