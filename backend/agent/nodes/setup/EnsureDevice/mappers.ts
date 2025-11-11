import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { EnsureDeviceInput, EnsureDeviceOutput } from "./node";

/**
 * Maps AgentState and AgentContext to EnsureDeviceInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildEnsureDeviceInput(state: AgentState, ctx: AgentContext): EnsureDeviceInput {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: state.runId,
    nodeName: "EnsureDevice",
  });

  const input: EnsureDeviceInput = {
    runId: state.runId,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    deviceConfiguration: ctx.ensureDevice.deviceConfiguration,
    driverReusePolicy: ctx.ensureDevice.driverReusePolicy,
  };

  logger.info("buildEnsureDeviceInput - AgentState", { state });
  logger.info("buildEnsureDeviceInput - AgentContext", { ctx });
  logger.info("buildEnsureDeviceInput - Mapped Input", { input });

  return input;
}

/**
 * Applies EnsureDeviceOutput to AgentState, updating device runtime context.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 */
export function applyEnsureDeviceOutput(prev: AgentState, output: EnsureDeviceOutput): AgentState {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: prev.runId,
    nodeName: "EnsureDevice",
  });

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
