import type { AgentState } from "../../../domain/state";
import type { WaitIdleInput, WaitIdleOutput } from "./node";
import { waitIdle } from "./node";
import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { buildWaitIdleInput, applyWaitIdleOutput } from "./mappers";
import { WaitIdlePolicy } from "./policy";

/**
 * Creates the WaitIdle node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createWaitIdleHandler(): NodeHandler<
  WaitIdleInput,
  WaitIdleOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "WaitIdle",
    buildInput: buildWaitIdleInput,
    async execute(input, ports) {
      const result = await waitIdle(input, ports.idleDetectorPort);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyWaitIdleOutput,
    onSuccess: "Perceive",
    onFailure: WaitIdlePolicy,
  };
}

