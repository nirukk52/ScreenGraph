import type { AgentState } from "../../../domain/state";
import type { LaunchOrAttachInput, LaunchOrAttachOutput } from "./node";
import { launchOrAttach } from "./node";
import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { buildLaunchOrAttachInput, applyLaunchOrAttachOutput } from "./mappers";
import { LaunchOrAttachPolicy } from "./policy";

/**
 * Creates the LaunchOrAttach node handler wired with mappers and policies.
 * PURPOSE: Composes typed handler without encoding buildInput/applyOutput logic.
 */
export function createLaunchOrAttachHandler(): NodeHandler<
  LaunchOrAttachInput,
  LaunchOrAttachOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "LaunchOrAttach",
    buildInput: buildLaunchOrAttachInput,
    async execute(input, ports) {
      const result = await launchOrAttach(input, ports.appLifecyclePort);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyLaunchOrAttachOutput,
    onSuccess: "WaitIdle",
    onFailure: LaunchOrAttachPolicy,
  };
}
