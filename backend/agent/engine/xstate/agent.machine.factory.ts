import { assign, fromPromise, setup } from "xstate";
import { advanceStep } from "../../domain/state";
import type { StopReason } from "../../domain/state";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../nodes/types";
import type { EngineNodeExecutionResult, NodeHandler, NodeOutputBase } from "../types";
import { AgentMachineExecutor } from "./agent.machine.executor";
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

/**
 * AgentMachineFactory is responsible for creating and configuring the XState-based orchestration machine.
 *
 * PURPOSE: This class centralizes the machine definition, state management, and actor configuration
 * without handling the actual execution logic. It provides a clean separation between machine
 * configuration and execution concerns.
 *
 * RESPONSIBILITIES:
 * - Define XState machine structure and states
 * - Configure actors (runNode, shouldStop)
 * - Define actions for state transitions
 * - Set up guards for decision making
 * - Configure delays for retry mechanisms
 * - Handle final state outputs
 */
export class AgentMachineFactory {
  private executor: AgentMachineExecutor;
  private transitionEngine: AgentTransitionEngine;

  constructor() {
    this.executor = new AgentMachineExecutor();
    this.transitionEngine = new AgentTransitionEngine();
  }

  /**
   * Creates the main XState machine that orchestrates the agent execution flow.
   *
   * PURPOSE: This is the entry point for creating a configured XState machine that handles
   * the complete agent lifecycle from idle to completion/failure.
   *
   * @param params - Configuration parameters including initial state, entry node, and dependencies
   * @returns Configured XState machine ready for execution
   */
  createMachine(params: AgentMachineParams) {
    const { initialState, entryNode, dependencies } = params;

    return setup({
      types: {
        context: {} as AgentMachineContext,
        events: {} as AgentMachineEvent,
        output: {} as AgentMachineOutput,
      },
      actors: {
        // Actor that executes individual nodes and returns execution results
        runNode: fromPromise(this.createRunNodeActor(dependencies)),
        // Actor that checks if execution should stop based on budgets/constraints
        shouldStop: fromPromise(this.createShouldStopActor(dependencies)),
      },
      actions: {
        // Caches the stop decision from shouldStop actor for later evaluation
        cacheStopDecision: assign(({ event }) => {
          const stop =
            "output" in event ? (event.output as ShouldStopResult | undefined) : undefined;
          if (!stop) {
            return {} satisfies Partial<AgentMachineContext>;
          }
          return { pendingStop: stop } satisfies Partial<AgentMachineContext>;
        }),

        // Clears any pending stop decision when continuing execution
        clearPendingStop: assign(
          () => ({ pendingStop: null }) satisfies Partial<AgentMachineContext>,
        ),

        // Stores the execution result and updates machine context with new state
        storeExecutionResult: assign(({ event, context }) => {
          const output =
            "output" in event ? (event.output as RunNodeActorOutput | undefined) : undefined;
          if (!output) {
            dependencies.logger.warn("storeExecutionResult: no output in event", { event });
            return {} satisfies Partial<AgentMachineContext>;
          }
          dependencies.logger.info("storeExecutionResult", {
            nodeName: output.execution.nodeName,
            decision: output.decision.kind,
            nextNode: output.decision.kind === "advance" ? output.decision.nextNode : null,
          });
          return {
            agentState: output.nextState,
            latestExecution: output.execution,
            latestDecision: output.decision,
            currentNode: output.nextState.nodeName as AgentNodeName,
            lastDecision: output.decision.kind,
          } satisfies Partial<AgentMachineContext>;
        }),

        // Marks the final stop disposition based on pending stop decision
        markStopDisposition: assign(({ context }) => {
          const disposition = context.pendingStop;
          if (!disposition) {
            return {
              agentState: {
                ...context.agentState,
                status: "failed",
                stopReason: "crash",
              },
              lastDecision: "stop" as const,
            } satisfies Partial<AgentMachineContext>;
          }
          const status = disposition.reason === "user_cancelled" ? "canceled" : "failed";
          return {
            agentState: {
              ...context.agentState,
              status,
              stopReason: disposition.reason,
            },
            lastDecision: "stop" as const,
          } satisfies Partial<AgentMachineContext>;
        }),
      },
      delays: {
        // Computes retry delay based on the latest decision
        retryDelay: ({ context }) => {
          const decision = context.latestDecision;
          return decision?.kind === "retry" ? decision.delayMs : 0;
        },
      },
      guards: {
        // Checks if execution should be aborted due to pending stop
        // Allow Stop node to execute even if cancellation requested (terminal node must run)
        shouldAbort: ({ context }) => {
          if (context.currentNode === "Stop") {
            return false;
          }
          return Boolean(context.pendingStop?.stop);
        },
        // Checks if the latest decision is to retry
        hasRetryDecision: ({ context }) => context.latestDecision?.kind === "retry",
        // Checks if the latest decision is to backtrack
        hasBacktrackDecision: ({ context }) => context.latestDecision?.kind === "backtrack",
        // Checks if the latest decision is to advance to next node
        hasAdvanceDecision: ({ context }) => context.latestDecision?.kind === "advance",
        // Checks if execution reached terminal success state
        hasTerminalSuccess: ({ context }) => context.latestDecision?.kind === "terminalSuccess",
        // Checks if execution reached terminal failure state
        hasTerminalFailure: ({ context }) => context.latestDecision?.kind === "terminalFailure",
      },
    }).createMachine({
      id: "agent-orchestrator",
      initial: "idle",
      context: {
        agentState: this.withEntryNode(initialState, entryNode),
        currentNode: this.resolveInitialNode(initialState, entryNode),
        latestExecution: null,
        latestDecision: null,
        pendingStop: null,
        lastDecision: null,
      },
      states: {
        // Initial state waiting for START event
        idle: {
          on: {
            START: {
              target: "checkStop",
            },
          },
        },

        // Checks if execution should stop based on budgets/constraints
        checkStop: {
          invoke: {
            src: "shouldStop",
            input: ({ context }) => ({ agentState: context.agentState }),
            onDone: {
              target: "evaluateStop",
              actions: "cacheStopDecision",
            },
            onError: {
              target: "failed",
            },
          },
        },

        // Evaluates the stop decision and either continues or stops
        evaluateStop: {
          always: [
            {
              guard: "shouldAbort",
              target: "stopped",
              actions: "markStopDisposition",
            },
            {
              target: "executing",
              actions: "clearPendingStop",
            },
          ],
        },

        // Executes the current node and waits for completion
        executing: {
          invoke: {
            src: "runNode",
            input: ({ context }) => ({
              agentState: context.agentState,
              currentNode: context.currentNode,
            }),
            onDone: {
              target: "decide",
              actions: "storeExecutionResult",
            },
            onError: {
              target: "failed",
            },
          },
        },

        // Decides next action based on execution result
        decide: {
          always: [
            {
              guard: "hasTerminalSuccess",
              target: "finished",
            },
            {
              guard: "hasTerminalFailure",
              target: "failed",
            },
            {
              guard: "hasRetryDecision",
              target: "waitingRetry",
            },
            {
              guard: "hasBacktrackDecision",
              target: "checkStop",
            },
            {
              guard: "hasAdvanceDecision",
              target: "checkStop",
            },
            {
              target: "failed",
            },
          ],
        },

        // Waits for retry delay before attempting again
        waitingRetry: {
          after: {
            retryDelay: {
              target: "checkStop",
            },
          },
        },

        // Terminal success state - execution completed successfully
        finished: {
          type: "final",
          output: ({ context }): AgentMachineOutput => ({
            state: context.agentState,
            status: "completed",
            stopReason: context.agentState.stopReason ?? "success",
            lastNode: context.latestExecution?.nodeName ?? context.currentNode,
          }),
        },

        // Terminal failure state - execution failed
        failed: {
          type: "final",
          output: ({ context }): AgentMachineOutput => ({
            state: context.agentState,
            status: context.agentState.status === "canceled" ? "canceled" : "failed",
            stopReason: context.agentState.stopReason ?? "crash",
            lastNode: context.latestExecution?.nodeName ?? context.currentNode,
          }),
        },

        // Stopped state - execution was stopped externally
        stopped: {
          type: "final",
          output: ({ context }): AgentMachineOutput => ({
            state: context.agentState,
            status: context.agentState.status === "canceled" ? "canceled" : "failed",
            stopReason: context.agentState.stopReason ?? "crash",
            lastNode: context.latestExecution?.nodeName ?? context.currentNode,
          }),
        },
      },
    });
  }

  /**
   * Creates the runNode actor that executes individual nodes.
   *
   * PURPOSE: This actor encapsulates the complete node execution flow including
   * handler resolution, execution, decision computation, and persistence.
   *
   * @param deps - Machine dependencies including registry, ports, callbacks
   * @returns Actor function that executes nodes and returns results
   */
  private createRunNodeActor(deps: AgentMachineDependencies) {
    return async ({
      input,
    }: {
      input: { agentState: AgentMachineContext["agentState"]; currentNode: AgentNodeName };
    }) => {
      // Execute the node using the executor
      const executionResult = await this.executor.executeNode(input, deps);

      // Compute transition decision using the transition engine
      const budgetStopReason = this.transitionEngine.evaluateBudget(
        executionResult.execution.state,
        deps.now(),
      );
      const decision = budgetStopReason
        ? ({ kind: "terminalFailure", stopReason: budgetStopReason } as AgentTransitionDecision)
        : this.transitionEngine.computeTransitionDecision(executionResult.execution);

      // Apply decision to state
      const nextState = this.transitionEngine.applyDecisionToState(
        executionResult.execution.state,
        decision,
      );

      // Update callbacks with decision information
      await deps.callbacks.onAttempt({
        nodeName: executionResult.execution.nodeName,
        outcome: executionResult.execution.outcome,
        nextNode: decision.kind === "advance" ? decision.nextNode : null,
        backtracked: decision.kind === "backtrack",
        attempt: executionResult.execution.attemptNumber,
      });

      deps.logger.info("Node execution", {
        nodeName: executionResult.execution.nodeName,
        outcome: executionResult.execution.outcome,
        decision: decision.kind,
        nextNode: decision.kind === "advance" ? decision.nextNode : null,
        budgetExhausted: budgetStopReason !== null,
      });

      return {
        execution: executionResult.execution,
        decision,
        nextState,
      } satisfies RunNodeActorOutput;
    };
  }

  /**
   * Creates the shouldStop actor that evaluates stop conditions.
   *
   * PURPOSE: This actor checks if execution should stop based on budgets,
   * time limits, or external cancellation signals.
   *
   * @param deps - Machine dependencies
   * @returns Actor function that evaluates stop conditions
   */
  private createShouldStopActor(deps: AgentMachineDependencies) {
    return async ({ input }: { input: { agentState: AgentMachineContext["agentState"] } }) =>
      deps.shouldStop(input.agentState);
  }

  /**
   * Ensures the initial state has the correct entry node set.
   *
   * PURPOSE: Handles the transition from InitialSetup to the actual entry node
   * when starting execution from a clean state.
   *
   * @param state - Current agent state
   * @param entryNode - The node to start execution from
   * @returns State with entry node properly set
   */
  private withEntryNode(state: AgentMachineContext["agentState"], entryNode: AgentNodeName) {
    if (state.nodeName && state.nodeName !== "InitialSetup") {
      return state;
    }
    return {
      ...state,
      nodeName: entryNode,
    };
  }

  /**
   * Resolves the initial node for execution.
   *
   * PURPOSE: Determines which node to start execution from, either from
   * the current state or the provided entry node.
   *
   * @param state - Current agent state
   * @param entryNode - Fallback entry node
   * @returns The node name to start execution from
   */
  private resolveInitialNode(state: AgentMachineContext["agentState"], entryNode: AgentNodeName) {
    return state.nodeName && state.nodeName !== "InitialSetup"
      ? (state.nodeName as AgentNodeName)
      : entryNode;
  }
}

/**
 * Output interface for the runNode actor.
 *
 * PURPOSE: Defines the structure of data returned by node execution,
 * including execution results, transition decisions, and updated state.
 */
interface RunNodeActorOutput {
  execution: EngineNodeExecutionResult<AgentNodeName>;
  decision: AgentTransitionDecision;
  nextState: AgentMachineContext["agentState"];
}
