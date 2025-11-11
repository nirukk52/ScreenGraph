import type { NodeRegistry } from "../engine/types";
import { createChooseActionHandler } from "./main/ChooseAction/handler";
import { createDetectProgressHandler } from "./main/DetectProgress/handler";
import { createPerceiveHandler } from "./main/Perceive/handler";
import { createSwitchPolicyHandler } from "./policy/SwitchPolicy/handler";
import { createEnsureDeviceHandler } from "./setup/EnsureDevice/handler";
import { createLaunchOrAttachHandler } from "./setup/LaunchOrAttach/handler";
import { createProvisionAppHandler } from "./setup/ProvisionApp/handler";
import { createWaitIdleHandler } from "./setup/WaitIdle/handler";
import { createStopHandler } from "./terminal/Stop/handler";
import type { AgentContext, AgentNodeName, AgentPorts } from "./types";

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
