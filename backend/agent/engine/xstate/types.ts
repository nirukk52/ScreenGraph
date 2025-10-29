import type { AgentState, StopReason } from "../../domain/state";
import type { AgentNodeName, AgentContext, AgentPorts } from "../../nodes/types";
import type { EngineNodeExecutionResult, NodeEvent, NodeRegistry } from "../types";
import type log from "encore.dev/log";

/**
 * ShouldStopResult captures the outcome of cancellation or budget interception checks.
 * PURPOSE: Carries deterministic stop signals from the worker into the state machine loop.
 */
export interface ShouldStopResult {
  stop: boolean;
  reason: StopReason | null;
}

/**
 * ShouldStopFn resolves whether orchestration should halt before the next node attempt.
 * PURPOSE: Allows feature-flagged drivers to reuse worker stop logic without duplication.
 */
export type ShouldStopFn = (state: AgentState) => Promise<ShouldStopResult>;

/**
 * AgentMachineContext stores mutable orchestration state shared across XState transitions.
 * PURPOSE: Tracks the latest agent snapshot and decision outputs while executing node handlers directly.
 */
export interface AgentMachineContext {
  agentState: AgentState;
  currentNode: AgentNodeName;
  latestExecution: EngineNodeExecutionResult<AgentNodeName> | null;
  latestDecision: AgentTransitionDecision | null;
  pendingStop: ShouldStopResult | null;
  lastDecision: AgentDecisionKind | null;
}

/**
 * AgentDecisionKind enumerates decision branches taken by the XState driver.
 * PURPOSE: Supports debugging and tracing during orchestration.
 */
export type AgentDecisionKind =
  | "terminalSuccess"
  | "terminalFailure"
  | "retry"
  | "backtrack"
  | "advance"
  | "stop"
  | "unexpected";

/**
 * AgentTransitionDecision enumerates deterministic driver choices derived from a node execution.
 * PURPOSE: Allows guards/actions to reason over retry/backoff/backtrack without embedding policy in machine states.
 */
export type AgentTransitionDecision =
  | { kind: "advance"; nextNode: AgentNodeName }
  | { kind: "retry"; delayMs: number; attempt: number }
  | { kind: "backtrack"; targetNode: AgentNodeName }
  | { kind: "terminalSuccess" }
  | { kind: "terminalFailure"; stopReason: StopReason }
  | { kind: "stop"; stopReason: StopReason }
  | { kind: "unexpected" };

/**
 * AgentMachineEvent enumerates events consumed by the orchestration XState machine.
 * PURPOSE: Keeps the machine fully typed while supporting deterministic transitions.
 */
export type AgentMachineEvent =
  | { type: "START" }
  | { type: "RETRY_TIMEOUT" };

/**
 * AgentMachineOutput mirrors AgentRunnerResult for consumers awaiting machine completion.
 * PURPOSE: Provides a drop-in replacement for existing worker outcome handling.
 */
export interface AgentMachineOutput {
  state: AgentState;
  status: "completed" | "failed" | "canceled";
  stopReason: StopReason | null;
  lastNode: AgentNodeName;
}

/**
 * AgentMachineAttemptTelemetry captures per-node metadata surfaced to the worker.
 * PURPOSE: Preserves structured logging and analytics outside the machine.
 */
export interface AgentMachineAttemptTelemetry {
  nodeName: AgentNodeName;
  outcome: "SUCCESS" | "FAILURE";
  nextNode: AgentNodeName | null;
  backtracked: boolean;
  attempt: number;
}

/**
 * AgentMachineCallbacks provide persistence and telemetry hooks owned by the worker.
 * PURPOSE: Keeps machine pure while allowing side effects via orchestrator.
 */
export interface AgentMachineCallbacks {
  onPersist: (state: AgentState, events: NodeEvent[], nodeName: AgentNodeName) => Promise<void>;
  onAttempt: (attempt: AgentMachineAttemptTelemetry) => Promise<void>;
}

/**
 * AgentMachineDependencies encapsulates shared orchestration dependencies needed by the machine.
 * PURPOSE: Ensures a single wiring surface when constructing the XState actor.
 */
export interface AgentMachineDependencies {
  registry: NodeRegistry<AgentNodeName, AgentPorts, AgentContext>;
  ports: AgentPorts;
  ctx: AgentContext;
  callbacks: AgentMachineCallbacks;
  seed: () => number;
  shouldStop: ShouldStopFn;
  logger: ReturnType<typeof log.with>;
  now: () => string;
}

/**
 * AgentMachineParams defines inputs required to instantiate the orchestrator machine.
 * PURPOSE: Provides a typed constructor contract for feature-flagged drivers.
 */
export interface AgentMachineParams {
  initialState: AgentState;
  entryNode: AgentNodeName;
  dependencies: AgentMachineDependencies;
}

