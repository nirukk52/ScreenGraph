import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { NodeHandler } from "../../../engine/types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../types";
import { applyStopOutput, buildStopInput } from "./mappers";
import type { StopInput, StopOutput } from "./node";
import { stop } from "./node";
import { StopPolicy } from "./policy";

/**
 * createStopHandler wires the terminal Stop node with null onSuccess to end the loop.
 * PURPOSE: Provides a clean termination path after setup-integrated splash capture.
 */
export function createStopHandler(): NodeHandler<
  StopInput,
  StopOutput,
  AgentNodeName,
  AgentPorts,
  AgentContext
> {
  return {
    name: "Stop",
    buildInput: buildStopInput,
    async execute(input, ports) {
      const logger = log.with({
        module: MODULES.AGENT,
        actor: AGENT_ACTORS.ORCHESTRATOR,
        runId: input.runId,
        nodeName: "Stop",
      });

      // Clean up BrowserStack/Appium session before stopping
      try {
        const context = ports.sessionPort.getContext();
        if (context?.driver?.sessionId) {
          logger.info("Closing BrowserStack session", { sessionId: context.driver.sessionId });
          await context.driver.deleteSession();
          logger.info("BrowserStack session closed successfully");
        }
      } catch (cleanupErr) {
        // Log but don't fail - cleanup is best-effort
        logger.warn("Session cleanup failed", {
          error: cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
        });
      }

      const result = await stop(input);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput: applyStopOutput,
    onSuccess: null,
    onFailure: StopPolicy,
  };
}
