import type { AgentState } from "../../../../domain/state";
import type { EnsureDeviceOutput } from "../../../../nodes/setup/ensure-device";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../../logging/logger";

/**
 * Applies EnsureDeviceOutput to AgentState, updating device runtime context.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 */
export function applyEnsureDeviceOutput(prev: AgentState, output: EnsureDeviceOutput): AgentState {
  const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.ORCHESTRATOR, runId: prev.runId, nodeName: "EnsureDevice" });
  
  logger.info("applyEnsureDeviceOutput - Previous State", { prev });
  logger.info("applyEnsureDeviceOutput - Node Output", { output });
  
  const updatedState: AgentState = {
    ...prev,
    deviceRuntimeContextId: output.deviceRuntimeContextId || prev.deviceRuntimeContextId,
    iterationOrdinalNumber: output.iterationOrdinalNumber ?? prev.iterationOrdinalNumber,
    stopReason: output.nodeExecutionOutcomeStatus === "FAILURE" ? "crash" : prev.stopReason,
  };
  
  logger.info("applyEnsureDeviceOutput - Updated State", { updatedState });
  
  return updatedState;
}

