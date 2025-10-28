import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import type { SwitchPolicyInput, SwitchPolicyOutput } from "./node";
import { switchPolicy } from "./node";
import { buildSwitchPolicyInput, applySwitchPolicyOutput } from "./mappers";
import { SwitchPolicyPolicy } from "./policy";

/**
 * createSwitchPolicyHandler wires the SwitchPolicy node into the registry.
 * PURPOSE: Bridges setup phase into policy-driven main loop through typed transitions.
 */
export function createSwitchPolicyHandler(): NodeHandler<
  SwitchPolicyInput,
  SwitchPolicyOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "SwitchPolicy",
    buildInput: buildSwitchPolicyInput,
    async execute(input) {
      const result = await switchPolicy(input);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applySwitchPolicyOutput,
    onSuccess: "Stop",
    onFailure: SwitchPolicyPolicy,
  };
}

