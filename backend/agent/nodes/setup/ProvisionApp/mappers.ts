import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { ProvisionAppInput, ProvisionAppOutput } from "./node";

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
    deviceRuntimeContextId: state.deviceRuntimeContextId,
    applicationUnderTestDescriptor: ctx.provisionApp.applicationUnderTestDescriptor,
    installationPolicy: ctx.provisionApp.installationPolicy,
    reinstallIfOlder: ctx.provisionApp.reinstallIfOlder,
    stepOrdinal: state.stepOrdinal + 1,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
  };
}

/**
 * Applies ProvisionAppOutput to AgentState.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 * Current implementation is a no-op; future versions may persist app provisioning outcome.
 */
export function applyProvisionAppOutput(prev: AgentState, output: ProvisionAppOutput): AgentState {
  return {
    ...prev,
  };
}
