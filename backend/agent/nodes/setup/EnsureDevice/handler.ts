import type { AgentState } from "../../../domain/state";
import type { EnsureDeviceInput, EnsureDeviceOutput } from "./node";
import { ensureDevice } from "./node";
import type { NodeHandler, NodeExecutorResult } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { buildEnsureDeviceInput, applyEnsureDeviceOutput } from "./mappers";
import { EnsureDevicePolicy } from "./policy";

/**
 * Creates the EnsureDevice node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createEnsureDeviceHandler(
  generateId: () => string,
): NodeHandler<EnsureDeviceInput, EnsureDeviceOutput, AgentNodeName, AgentPorts, AgentContext> {
  return {
    name: "EnsureDevice",
    buildInput: buildEnsureDeviceInput,
    async execute(input, ports) {
      const result = await ensureDevice(input, ports.sessionPort, generateId);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyEnsureDeviceOutput,
    onSuccess: "ProvisionApp",
    onFailure: EnsureDevicePolicy,
  };
}



