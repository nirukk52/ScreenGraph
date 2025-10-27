import type { NodeRegistry } from "../../../engine/types";
import type { SetupPhaseContext, SetupPhasePorts, SetupNodeName } from "../types";
import { createEnsureDeviceHandler } from "./handlers/EnsureDevice.handler";
import { createProvisionAppHandler } from "./handlers/ProvisionApp.handler";

/**
 * Builds a fully-wired registry with all setup node handlers.
 * PURPOSE: Composes registry without encoding handler creation logic.
 */
export function buildSetupRegistry(
  generateId: () => string,
): NodeRegistry<SetupNodeName, SetupPhasePorts, SetupPhaseContext> {
  return {
    EnsureDevice: createEnsureDeviceHandler(generateId),
    ProvisionApp: createProvisionAppHandler(),
  };
}

