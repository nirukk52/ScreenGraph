import type { AgentState } from "../../../../domain/state";
import type { EnsureDeviceInput } from "../../../../nodes/setup/ensure-device";
import type { SetupPhaseContext } from "../../types";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../../logging/logger";

/**
 * Maps AgentState and SetupPhaseContext to EnsureDeviceInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildEnsureDeviceInput(state: AgentState, ctx: SetupPhaseContext): EnsureDeviceInput {
  const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.ORCHESTRATOR, runId: state.runId, nodeName: "EnsureDevice" });
  
  const input: EnsureDeviceInput = {
    runId: state.runId,
    tenantId: state.tenantId,
    projectId: state.projectId,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    deviceConfiguration: ctx.ensureDevice.deviceConfiguration,
    driverReusePolicy: ctx.ensureDevice.driverReusePolicy,
  };
  
  logger.info("buildEnsureDeviceInput - AgentState", { state });
  logger.info("buildEnsureDeviceInput - SetupPhaseContext", { ctx });
  logger.info("buildEnsureDeviceInput - Mapped Input", { input });
  
  return input;
}

