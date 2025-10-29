import type { NodeRegistry } from "../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "./types";
import { createEnsureDeviceHandler } from "./setup/EnsureDevice/handler";
import { createProvisionAppHandler } from "./setup/ProvisionApp/handler";
import { createLaunchOrAttachHandler } from "./setup/LaunchOrAttach/handler";
import { createWaitIdleHandler } from "./setup/WaitIdle/handler";
import { createPerceiveHandler } from "./main/Perceive/handler";
import { createChooseActionHandler } from "./main/ChooseAction/handler";
import { createDetectProgressHandler } from "./main/DetectProgress/handler";
import { createSwitchPolicyHandler } from "./policy/SwitchPolicy/handler";
import { createStopHandler } from "./terminal/Stop/handler";

/**
 * Builds a fully-wired registry with all agent node handlers.
 * PURPOSE: Composes registry without encoding handler creation logic.
 */
export function buildNodeRegistry(
  generateId: () => string,
): NodeRegistry<AgentNodeName, AgentPorts, AgentContext> {
  return {
    EnsureDevice: createEnsureDeviceHandler(generateId),
    ProvisionApp: createProvisionAppHandler(),
    LaunchOrAttach: createLaunchOrAttachHandler(),
    Perceive: createPerceiveHandler(),
    WaitIdle: createWaitIdleHandler(),
    ChooseAction: createChooseActionHandler(),
    DetectProgress: createDetectProgressHandler(),
    SwitchPolicy: createSwitchPolicyHandler(),
    Stop: createStopHandler(),
  };
}
