import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { applyChooseActionOutput, buildChooseActionInput } from "./mappers";
import type { ChooseActionInput, ChooseActionOutput } from "./node";
import { chooseAction } from "./node";
import { ChooseActionPolicy } from "./policy";

/**
 * createChooseActionHandler wires ChooseAction node with typed input builders and retry policy.
 * PURPOSE: Keeps registry construction declarative without embedding node-specific wiring.
 */
export function createChooseActionHandler(): NodeHandler<
  ChooseActionInput,
  ChooseActionOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "ChooseAction",
    buildInput: buildChooseActionInput,
    async execute(input, ports) {
      const result = await chooseAction(input, ports.llmPort);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyChooseActionOutput,
    onSuccess: "Act",
    onFailure: ChooseActionPolicy,
  };
}
