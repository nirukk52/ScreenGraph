import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import type { StopInput, StopOutput } from "./node";
import { stop } from "./node";
import { buildStopInput, applyStopOutput } from "./mappers";
import { StopPolicy } from "./policy";

/**
 * createStopHandler wires the terminal Stop node with null onSuccess to end the loop.
 * PURPOSE: Provides a clean termination path after setup-integrated splash capture.
 */
export function createStopHandler(): NodeHandler<
  StopInput,
  StopOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "Stop",
    buildInput: buildStopInput,
    async execute(input) {
      const result = await stop(input);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyStopOutput,
    onSuccess: null,
    onFailure: StopPolicy,
  };
}

