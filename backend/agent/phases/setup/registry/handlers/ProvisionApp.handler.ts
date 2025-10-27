import type { AgentState } from "../../../../domain/state";
import type { ProvisionAppInput, ProvisionAppOutput } from "../../../../nodes/setup/provision-app";
import { provisionApp } from "../../../../nodes/setup/provision-app";
import type { NodeHandler, NodeExecutorResult } from "../../../../engine/types";
import type { SetupPhaseContext, SetupPhasePorts, SetupNodeName } from "../../types";
import { buildProvisionAppInput } from "../../mappers/inputs/ProvisionApp";
import { applyProvisionAppOutput } from "../../mappers/outputs/ProvisionApp";
import { ProvisionAppPolicy } from "../../policies/defaults";

/**
 * Creates the ProvisionApp node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createProvisionAppHandler(): NodeHandler<
  ProvisionAppInput,
  ProvisionAppOutput,
  SetupNodeName,
  SetupPhasePorts,
  SetupPhaseContext
> {
  return {
    name: "ProvisionApp",
    buildInput: buildProvisionAppInput,
    async execute(input, _ports) {
      const result = await provisionApp(input);
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

