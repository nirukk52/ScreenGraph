import type { AgentState } from "../../../domain/state";
import type { NodeExecutorResult, NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { applyProvisionAppOutput, buildProvisionAppInput } from "./mappers";
import type { ProvisionAppInput, ProvisionAppOutput } from "./node";
import { provisionApp } from "./node";
import { ProvisionAppPolicy } from "./policy";

/**
 * Creates the ProvisionApp node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createProvisionAppHandler(): NodeHandler<
  ProvisionAppInput,
  ProvisionAppOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "ProvisionApp",
    buildInput: buildProvisionAppInput,
    async execute(input, ports) {
      const result = await provisionApp(input, ports.packageManagerPort, ports.sessionPort);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyProvisionAppOutput,
    onSuccess: "LaunchOrAttach",
    onFailure: ProvisionAppPolicy,
  };
}
