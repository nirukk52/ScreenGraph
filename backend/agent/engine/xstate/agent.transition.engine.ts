import type { StopReason } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import type { EngineNodeExecutionResult, NodeHandler, NodeOutputBase } from "../types";
import type { AgentMachineContext, AgentTransitionDecision } from "./types";

/**
 * AgentTransitionEngine handles all transition decisions, retry logic, and state updates
 * for the agent state machine.
 *
 * PURPOSE: This class centralizes the complex logic for determining what happens next
 * after a node execution completes. It handles success/failure transitions, retry policies,
 * backtracking, budget evaluation, and state updates based on transition decisions.
 *
 * RESPONSIBILITIES:
 * - Compute transition decisions based on execution results
 * - Evaluate budget constraints and stop conditions
 * - Apply transition decisions to update agent state
 * - Calculate retry delays with exponential backoff
 * - Handle backtracking logic and restart counting
 * - Manage terminal state transitions
 *
 * DESIGN PATTERNS:
 * - Strategy Pattern: Different transition strategies for different outcomes
 * - Command Pattern: Transition decisions as commands that modify state
 * - Template Method: Consistent decision flow with customizable steps
 * - Pure Functions: All methods are side-effect free for testability
 */
export class AgentTransitionEngine {
  /**
   * Computes the transition decision based on execution results.
   *
   * PURPOSE: This is the core decision-making method that determines what happens next
   * after a node execution. It considers success/failure outcomes, retry policies,
   * attempt limits, and backtracking options to make the optimal transition decision.
   *
   * DECISION LOGIC:
   * 1. SUCCESS → Advance to next node or terminal success
   * 2. FAILURE + RETRYABLE + UNDER LIMIT → Retry with delay
   * 3. FAILURE + RETRYABLE + OVER LIMIT + BACKTRACK → Backtrack to recovery node
   * 4. FAILURE + NOT RETRYABLE + BACKTRACK → Backtrack to recovery node
   * 5. FAILURE + NO BACKTRACK → Terminal failure
   *
   * @param execution - The complete execution result from a node
   * @returns Transition decision indicating next action
   */
  computeTransitionDecision(
    execution: EngineNodeExecutionResult<AgentNodeName>,
  ): AgentTransitionDecision {
    const { outcome, retryable, policy, successTarget, attemptNumber, seedUsed } = execution;

    // SUCCESS PATH: Node executed successfully
    if (outcome === "SUCCESS") {
      // If no success target, we've reached terminal success
      if (successTarget === null) {
        return { kind: "terminalSuccess" };
      }
      // Otherwise, advance to the next node
      return { kind: "advance", nextNode: successTarget };
    }

    // FAILURE PATH: Node execution failed, determine recovery strategy
    const { retry, backtrackTo } = policy;
    const canRetry = retryable !== false;

    // RETRY STRATEGY: Attempt retry if conditions are met
    if (canRetry && attemptNumber < retry.maxAttempts) {
      const delayMs = this.computeBackoffDelayMs(
        attemptNumber,
        retry.baseDelayMs,
        retry.maxDelayMs,
        seedUsed,
      );
      return { kind: "retry", delayMs, attempt: attemptNumber };
    }

    // BACKTRACK STRATEGY: Move to recovery node if available
    if (backtrackTo) {
      return { kind: "backtrack", targetNode: backtrackTo };
    }

    // TERMINAL FAILURE: No recovery options available
    return { kind: "terminalFailure", stopReason: execution.state.stopReason ?? "crash" };
  }

  /**
   * Evaluates budget constraints to determine if execution should stop.
   *
   * PURPOSE: This method checks all budget limits to ensure the agent doesn't
   * exceed resource constraints. It provides early termination when budgets
   * are exhausted, preventing runaway execution.
   *
   * BUDGET CHECKS:
   * - maxSteps: Total step limit across all nodes
   * - outsideAppLimit: Steps taken outside the target app
   * - restartLimit: Number of backtrack/restart operations
   * - maxTimeMs: Wall-clock time limit
   *
   * @param state - Current agent state with budgets and counters
   * @param nowIso - Current timestamp for time calculations
   * @returns Stop reason if budget exceeded, null if within limits
   */
  evaluateBudget(state: AgentMachineContext["agentState"], nowIso: string): StopReason | null {
    const { budgets, counters, timestamps } = state;

    // Check step-based budgets
    if (counters.stepsTotal >= budgets.maxSteps) {
      return "budget_exhausted" as const;
    }
    if (counters.outsideAppSteps >= budgets.outsideAppLimit) {
      return "budget_exhausted" as const;
    }
    if (counters.restartsUsed >= budgets.restartLimit) {
      return "budget_exhausted" as const;
    }

    // Check time-based budget
    const elapsedMs = Date.parse(nowIso) - Date.parse(timestamps.createdAt);
    if (elapsedMs >= budgets.maxTimeMs) {
      return "budget_exhausted" as const;
    }

    return null;
  }

  /**
   * Applies a transition decision to update the agent state.
   *
   * PURPOSE: This method transforms transition decisions into state updates,
   * ensuring that the agent state accurately reflects the current execution
   * context and next steps. It handles all transition types consistently.
   *
   * TRANSITION TYPES:
   * - advance: Move to next node, reset iteration counter
   * - retry: Stay on current node, update iteration counter
   * - backtrack: Move to recovery node, increment restart counter
   * - terminalSuccess: Mark as completed with success status
   * - terminalFailure: Mark as failed with failure status
   * - stop: Mark as stopped with appropriate status
   *
   * @param state - Current agent state
   * @param decision - Transition decision to apply
   * @returns Updated agent state reflecting the transition
   */
  applyDecisionToState(
    state: AgentMachineContext["agentState"],
    decision: AgentTransitionDecision,
  ): AgentMachineContext["agentState"] {
    switch (decision.kind) {
      case "advance":
        // Move to next node and reset iteration counter
        return {
          ...state,
          nodeName: decision.nextNode,
          iterationOrdinalNumber: 0,
        };

      case "retry":
        // Stay on current node, update iteration counter
        return {
          ...state,
          iterationOrdinalNumber: decision.attempt,
        };

      case "backtrack":
        // Move to recovery node, increment restart counter
        return {
          ...state,
          nodeName: decision.targetNode,
          iterationOrdinalNumber: 0,
          counters: {
            ...state.counters,
            restartsUsed: state.counters.restartsUsed + 1,
          },
        };

      case "terminalSuccess":
        // Mark execution as completed successfully
        return {
          ...state,
          status: "completed",
          stopReason: "success",
        };

      case "terminalFailure":
        // Mark execution as failed with specific reason
        return {
          ...state,
          status: "failed",
          stopReason: decision.stopReason,
        };

      case "stop":
        // Mark execution as stopped with specific reason
        return {
          ...state,
          status: "failed",
          stopReason: decision.stopReason,
        };
      default:
        // Handle unexpected decisions as crashes
        return {
          ...state,
          status: "failed",
          stopReason: "crash",
        };
    }
  }

  /**
   * Computes retry delay using exponential backoff with deterministic jitter.
   *
   * PURPOSE: This method implements a robust retry strategy that balances
   * immediate retry attempts with exponential backoff to avoid overwhelming
   * external systems. The deterministic jitter ensures reproducible behavior
   * while preventing thundering herd problems.
   *
   * BACKOFF ALGORITHM:
   * 1. Calculate exponential delay: baseDelay * 2^(attempt-1)
   * 2. Cap at maximum delay to prevent excessive waits
   * 3. Apply deterministic jitter using seed for reproducibility
   * 4. Ensure minimum delay for immediate retry attempts
   *
   * @param attempt - Current attempt number (1-based)
   * @param baseDelayMs - Base delay in milliseconds
   * @param maxDelayMs - Maximum delay in milliseconds
   * @param seed - Random seed for deterministic jitter
   * @returns Computed delay in milliseconds
   */
  computeBackoffDelayMs(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    seed: number,
  ): number {
    // Calculate exponential backoff: base * 2^(attempt-1)
    const exp = baseDelayMs * 2 ** Math.max(0, attempt - 1);

    // Cap at maximum delay to prevent excessive waits
    const capped = Math.min(exp, maxDelayMs);

    // Apply deterministic jitter using seed for reproducibility
    // Extract 12 bits from seed for jitter calculation
    const jitter = (seed & 0xfff) / 0xfff;

    // Apply jitter: 75% to 100% of capped delay
    const jittered = Math.floor(capped * (0.75 + 0.25 * jitter));

    // Ensure minimum delay and cap at maximum
    return Math.max(baseDelayMs, Math.min(jittered, maxDelayMs));
  }
}
