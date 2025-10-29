import type { AgentContext, AgentNodeName, AgentPorts } from "../../nodes/types";
import type {
  AgentMachineContext,
  AgentMachineDependencies,
  AgentTransitionDecision,
} from "./types";
import type { EngineNodeExecutionResult, NodeHandler, NodeOutputBase } from "../types";
import { advanceStep } from "../../domain/state";

/**
 * AgentMachineExecutor handles the execution of individual nodes within the agent state machine.
 * 
 * PURPOSE: This class encapsulates all node execution logic, including handler resolution,
 * input building, execution, output application, and result packaging. It provides a clean
 * separation between execution concerns and the broader machine orchestration.
 * 
 * RESPONSIBILITIES:
 * - Resolve node handlers from the registry
 * - Build input for node execution from current state and context
 * - Execute node handlers with proper error handling
 * - Apply node outputs to update agent state
 * - Package execution results with metadata
 * - Handle retryable flag extraction
 * - Manage execution attempt numbering
 * 
 * DESIGN PATTERNS:
 * - Single Responsibility: Only handles node execution
 * - Dependency Injection: Receives all dependencies through parameters
 * - Pure Functions: Execution methods are side-effect free except for logging
 * - Error Boundaries: Encapsulates execution errors for machine handling
 */
export class AgentMachineExecutor {
  /**
   * Executes a single node and returns the complete execution result.
   * 
   * PURPOSE: This is the main entry point for node execution. It orchestrates the complete
   * flow from handler resolution to result packaging, providing all necessary metadata
   * for the machine to make transition decisions.
   * 
   * @param input - Execution input containing current state and node to execute
   * @param deps - Machine dependencies including registry, ports, callbacks
   * @returns Complete execution result with state, events, and metadata
   */
  async executeNode(
    input: { agentState: AgentMachineContext["agentState"]; currentNode: AgentNodeName },
    deps: AgentMachineDependencies
  ): Promise<NodeExecutionOutput> {
    const handler = this.resolveHandler(deps.registry, input.currentNode);
    const attemptNumber = (input.agentState.iterationOrdinalNumber ?? 0) + 1;
    const seed = deps.seed();
    const nowIso = deps.now();

    deps.logger.info("Running node", {
      nodeName: handler.name,
      attempt: attemptNumber,
    });

    const execution = await this.executeHandler({
      handler,
      state: input.agentState,
      ctx: deps.ctx,
      ports: deps.ports,
      seed,
      nowIso,
      attemptNumber,
    });

    // Note: Budget evaluation and decision computation are handled by AgentTransitionEngine
    // This separation ensures execution logic remains focused on node execution only

    await deps.callbacks.onPersist(execution.state, execution.events, execution.nodeName);
    await deps.callbacks.onAttempt({
      nodeName: execution.nodeName,
      outcome: execution.outcome,
      nextNode: null, // Will be determined by transition engine
      backtracked: false, // Will be determined by transition engine
      attempt: attemptNumber,
    });

    deps.logger.info("Node execution", {
      nodeName: execution.nodeName,
      outcome: execution.outcome,
    });

    return {
      execution,
      nextState: execution.state,
    };
  }

  /**
   * Resolves a node handler from the registry by node name.
   * 
   * PURPOSE: Provides type-safe handler resolution with proper error handling.
   * This method ensures that only registered nodes can be executed and provides
   * clear error messages for debugging.
   * 
   * @param registry - The node registry containing all available handlers
   * @param node - The name of the node to resolve
   * @returns The resolved node handler
   * @throws Error if handler is not found in registry
   */
  private resolveHandler(
    registry: AgentMachineDependencies["registry"],
    node: AgentNodeName,
  ): NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext> {
    const handler = registry[node];
    if (!handler) {
      throw new Error(`Handler not registered for node: ${node}`);
    }
    return handler as NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext>;
  }

  /**
   * Executes a node handler with the provided parameters.
   * 
   * PURPOSE: This method encapsulates the complete node execution flow including
   * input building, handler execution, state advancement, and output application.
   * It provides a consistent interface for executing any node type.
   * 
   * EXECUTION FLOW:
   * 1. Build input from current state and context
   * 2. Execute handler with input and ports
   * 3. Advance step counter and update timestamps
   * 4. Apply handler output to updated state
   * 5. Extract retryable flag from output
   * 6. Package complete execution result
   * 
   * @param params - Execution parameters including handler, state, context, ports, etc.
   * @returns Complete execution result with updated state and metadata
   */
  private async executeHandler(params: {
    handler: NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext>;
    state: AgentMachineContext["agentState"];
    ctx: AgentContext;
    ports: AgentPorts;
    seed: number;
    nowIso: string;
    attemptNumber: number;
  }): Promise<EngineNodeExecutionResult<AgentNodeName>> {
    const { handler, state, ctx, ports, seed, nowIso, attemptNumber } = params;
    
    // Step 1: Build input from current state and context
    // This transforms the agent state into the specific input format expected by the handler
    const input = handler.buildInput(state, ctx);
    
    // Step 2: Execute the handler with input and ports
    // This is where the actual node logic runs (e.g., device operations, app provisioning)
    const { output, events } = await handler.execute(input as never, ports);
    
    // Step 3: Advance step counter and update timestamps
    // This maintains the execution history and timing information
    const advanced = advanceStep(state, handler.name, nowIso, seed);
    
    // Step 4: Apply handler output to update agent state
    // This incorporates the node's results into the overall agent state
    const updated = handler.applyOutput(advanced, output as NodeOutputBase);
    
    // Step 5: Extract retryable flag from output
    // This determines whether the node can be retried on failure
    const retryable = (output as NodeOutputBase & { retryable?: boolean | null }).retryable ?? null;

    // Step 6: Package complete execution result
    // This provides all necessary information for transition decisions
    return {
      state: updated,
      nodeName: handler.name,
      outcome: output.nodeExecutionOutcomeStatus,
      retryable,
      policy: handler.onFailure,
      successTarget: handler.onSuccess,
      events,
      attemptNumber,
      seedUsed: seed,
    } satisfies EngineNodeExecutionResult<AgentNodeName>;
  }
}

/**
 * Output interface for node execution.
 * 
 * PURPOSE: Defines the structure of data returned by node execution,
 * including execution results and updated state. The transition decision
 * is computed separately by the AgentTransitionEngine.
 */
interface NodeExecutionOutput {
  execution: EngineNodeExecutionResult<AgentNodeName>;
  nextState: AgentMachineContext["agentState"];
}
