import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { SwitchPolicyInput, SwitchPolicyOutput } from "./node";

/**
 * buildSwitchPolicyInput maps AgentState and AgentContext into SwitchPolicyInput.
 * PURPOSE: Provides deterministic policy selection inputs without leaking registry wiring.
 */
export function buildSwitchPolicyInput(state: AgentState, ctx: AgentContext): SwitchPolicyInput {
  return {
    runId: state.runId,
    stepOrdinal: state.stepOrdinal,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
    currentStrategyConfiguration: ctx.policy.switchPolicy.currentStrategyConfiguration,
    requestedStrategyConfiguration: ctx.policy.switchPolicy.requestedStrategyConfiguration,
    reasonPlaintext: ctx.policy.switchPolicy.reasonPlaintext,
  };
}

/**
 * applySwitchPolicyOutput updates AgentState with the selected policy configuration.
 * PURPOSE: Centralizes state mutation so registry wiring stays declarative.
 */
export function applySwitchPolicyOutput(prev: AgentState, output: SwitchPolicyOutput): AgentState {
  return {
    ...prev,
    policyVersion: output.effectiveStrategyConfiguration.policyVersion,
  };
}
