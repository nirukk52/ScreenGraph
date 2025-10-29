import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import type { DetectProgressInput, DetectProgressOutput } from "./node";
import { detectProgress } from "./node";
import { buildDetectProgressInput, applyDetectProgressOutput } from "./mappers";
import { DetectProgressPolicy } from "./policy";

/**
 * createDetectProgressHandler wires DetectProgress node with typed input builders and retry policy.
 * PURPOSE: Keeps registry construction declarative without embedding node-specific wiring.
 */
export function createDetectProgressHandler(): NodeHandler<
  DetectProgressInput,
  DetectProgressOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "DetectProgress",
    buildInput: buildDetectProgressInput,
    async execute(input, ports) {
      const result = await detectProgress(input, ports.graphPort);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyDetectProgressOutput,
    onSuccess: "SwitchPolicy",
    onFailure: DetectProgressPolicy,
  };
}

