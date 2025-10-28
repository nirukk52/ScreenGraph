import type { AgentState } from "../../../domain/state";
import type { LaunchOrAttachInput, LaunchOrAttachOutput } from "./node";
import type { AgentContext } from "../../types";

/**
 * Maps AgentState and AgentContext to LaunchOrAttachInput.
 * PURPOSE: Separates input construction from handler wiring to keep registry declarative.
 */
export function buildLaunchOrAttachInput(
  state: AgentState,
  ctx: AgentContext,
): LaunchOrAttachInput {
  return {
    runId: state.runId,
    tenantId: state.tenantId,
    projectId: state.projectId,
    applicationUnderTestDescriptor: ctx.launchOrAttach.applicationUnderTestDescriptor,
    launchAttachMode: ctx.launchOrAttach.launchAttachMode,
  };
}

/**
 * Applies LaunchOrAttachOutput to AgentState, updating application foreground context.
 * PURPOSE: Separates output mutation from handler wiring to keep registry declarative.
 */
export function applyLaunchOrAttachOutput(
  prev: AgentState,
  output: LaunchOrAttachOutput,
): AgentState {
  return {
    ...prev,
    applicationForegroundContextId: output.applicationForegroundContext.currentPackageId,
  };
}
