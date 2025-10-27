import type { AgentState } from "../../../../domain/state";
import type { EnsureDeviceOutput } from "../../../../nodes/setup/ensure-device";

/**
 * Applies EnsureDeviceOutput to AgentState, updating device runtime context.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 */
export function applyEnsureDeviceOutput(prev: AgentState, output: EnsureDeviceOutput): AgentState {
  return {
    ...prev,
    deviceRuntimeContextId: output.deviceRuntimeContextId,
  };
}

