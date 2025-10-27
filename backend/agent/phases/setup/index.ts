import type { NodeRegistry } from "../../engine/types";
import type { SetupPhaseContext, SetupPhasePorts, SetupNodeName } from "./types";
import { buildSetupRegistry } from "./registry/build";
import { buildSetupContext } from "./context/build";

/**
 * Setup Phase Facade - exports ONLY buildRegistry and buildContext.
 * PURPOSE: Provides the minimal interface Orchestrator needs to wire the setup phase.
 */
export function buildRegistry(generateId: () => string): NodeRegistry<SetupNodeName, SetupPhasePorts, SetupPhaseContext> {
  return buildSetupRegistry(generateId);
}

export function buildContext(run: { appConfigId: string }): SetupPhaseContext {
  return buildSetupContext(run as any);
}

