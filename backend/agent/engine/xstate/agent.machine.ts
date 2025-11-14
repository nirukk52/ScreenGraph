import { assign, fromPromise, setup } from "xstate";
import type { StopReason } from "../../domain/state";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../nodes/types";
import type { EngineNodeExecutionResult, NodeHandler, NodeOutputBase } from "../types";
import { AgentMachineExecutor } from "./agent.machine.executor";
import { AgentMachineFactory } from "./agent.machine.factory";
import { AgentTransitionEngine } from "./agent.transition.engine";
import type {
  AgentMachineContext,
  AgentMachineDependencies,
  AgentMachineEvent,
  AgentMachineOutput,
  AgentMachineParams,
  AgentTransitionDecision,
  ShouldStopResult,
} from "./types";

interface RunNodeActorOutput {
  execution: EngineNodeExecutionResult<AgentNodeName>;
  decision: AgentTransitionDecision;
  nextState: AgentMachineContext["agentState"];
}

/**
 * createAgentMachine builds the XState-based orchestration loop around node handlers directly.
 *
 * PURPOSE: This function serves as the main entry point for creating agent machines.
 * It delegates to the AgentMachineFactory class which handles the complex machine
 * configuration and setup. This separation allows for better testability and
 * maintainability of the machine creation logic.
 *
 * ARCHITECTURE:
 * - AgentMachineFactory: Creates and configures the XState machine
 * - AgentMachineExecutor: Handles individual node execution
 * - AgentTransitionEngine: Manages transition decisions and retry logic
 *
 * @param params - Configuration parameters for the agent machine
 * @returns Configured XState machine ready for execution
 */
export function createAgentMachine(params: AgentMachineParams) {
  const factory = new AgentMachineFactory();
  return factory.createMachine(params);
}
