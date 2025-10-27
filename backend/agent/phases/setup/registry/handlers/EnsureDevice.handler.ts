import type { AgentState } from "../../../../domain/state";
import type { EnsureDeviceInput, EnsureDeviceOutput } from "../../../../nodes/setup/ensure-device";
import { ensureDevice } from "../../../../nodes/setup/ensure-device";
import type { NodeHandler, NodeExecutorResult } from "../../../../engine/types";
import type { SetupPhaseContext, SetupPhasePorts, SetupNodeName } from "../../types";
import { buildEnsureDeviceInput } from "../../mappers/inputs/EnsureDevice";
import { applyEnsureDeviceOutput } from "../../mappers/outputs/EnsureDevice";
import { EnsureDevicePolicy } from "../../policies/defaults";

/**
 * Creates the EnsureDevice node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createEnsureDeviceHandler(
  generateId: () => string,
): NodeHandler<EnsureDeviceInput, EnsureDeviceOutput, SetupNodeName, SetupPhasePorts, SetupPhaseContext> {
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

