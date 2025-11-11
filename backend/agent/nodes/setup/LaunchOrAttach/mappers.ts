import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { LaunchOrAttachInput, LaunchOrAttachOutput } from "./node";

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
    applicationUnderTestDescriptor: ctx.launchOrAttach.applicationUnderTestDescriptor,
    launchAttachMode: ctx.launchOrAttach.launchAttachMode,
    installOrRestart: ctx.launchOrAttach.installOrRestart,
    appLaunchTimeoutMs: state.budgets.appLaunchTimeoutMs,
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
