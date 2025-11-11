import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { applyPerceiveOutput, buildPerceiveInput } from "./mappers";
import type { PerceiveInput, PerceiveOutput } from "./node";
import { perceive } from "./node";
import { PerceivePolicy } from "./policy";

/**
 * createPerceiveHandler wires Perceive node with typed input builders and retry policy.
 * PURPOSE: Keeps registry construction declarative without embedding node-specific wiring.
 */
export function createPerceiveHandler(): NodeHandler<
  PerceiveInput,
  PerceiveOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "Perceive",
    buildInput: buildPerceiveInput,
    async execute(input, ports) {
      const result = await perceive(
        input,
        ports.perceptionPort,
        ports.deviceInfoPort,
        ports.storagePort,
      );
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyPerceiveOutput,
    onSuccess: "WaitIdle",
    onFailure: PerceivePolicy,
  };
}
