import type { AgentState, StopReason, NodeExecutionOutcomeStatus } from "../domain/state";
import type { EventKind } from "../domain/events";

/**
 * NodeNameBrand is a generic brand for node identifiers used by a phase.
 * PURPOSE: Enables phase-specific unions like "EnsureDevice" | "ProvisionApp" while keeping the engine generic.
 */
export type NodeNameBrand = string & { readonly __nodeNameBrand?: unique symbol };

/**
 * NodeEvent represents a node-emitted domain event envelope.
 * PURPOSE: Carries node-local telemetry to Orchestrator for durable append.
 */
export interface NodeEvent {
  kind: EventKind;
  payload: Record<string, unknown>;
}

/**
 * NodeOutputBase defines the minimal shape the engine requires from node outputs.
 * PURPOSE: Allows the engine to make transition decisions without knowing full node-specific payloads.
 */
export interface NodeOutputBase {
  nodeExecutionOutcomeStatus: NodeExecutionOutcomeStatus;
}

/**
 * TransitionPolicy defines retry/backtrack semantics for failed node executions.
 * PURPOSE: Encodes deterministic control flow without hardcoding in Worker.
 */
export interface TransitionPolicy<N extends string> {
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  backtrackTo?: N;
}

/**
 * NodeExecutorResult is the typed outcome returned by individual node executors.
 * PURPOSE: Wraps output payload and any node-generated events for persistence.
 */
export interface NodeExecutorResult<OutputT extends NodeOutputBase> {
  output: OutputT;
  events: NodeEvent[];
}

/**
 * NodeHandler describes a single node executor with typed IO and transitions.
 * PURPOSE: Enables a registry of strongly-typed, composable nodes.
 */
export interface NodeHandler<InputT, OutputT extends NodeOutputBase, N extends string, P, C> {
  name: N;
  buildInput(state: AgentState, ctx: C): InputT;
  execute(input: InputT, ports: P): Promise<NodeExecutorResult<OutputT>>;
  applyOutput(prev: AgentState, output: OutputT): AgentState;
  onSuccess: N | null;
  onFailure: TransitionPolicy<N>;
}

/**
 * NodeRegistry maintains handlers for each orchestrated node.
 * PURPOSE: Central source of truth for node wiring and policies per phase.
 */
export type NodeRegistry<N extends string, P, C> = Partial<
  Record<N, NodeHandler<unknown, NodeOutputBase, N, P, C>>
>;

/**
 * EngineRunOnceArgs contains inputs required to execute a single engine step.
 * PURPOSE: Decouples timing/seed generation (owned by Worker/Orchestrator).
 */
export interface EngineRunOnceArgs<P, C> {
  state: AgentState;
  nowIso: string;
  seed: number;
  ports: P;
  ctx: C;
}

/**
 * EngineRunOnceResult represents the effect of a single node attempt.
 * PURPOSE: Feeds Worker loop with next state and transition hints.
 */
export interface EngineRunOnceResult<N extends string> {
  state: AgentState;
  nodeName: N;
  outcome: "SUCCESS" | "FAILURE";
  nextNode: N | null;
  backtracked: boolean;
  retryDelayMs: number | null;
  stopReason: StopReason;
  events: NodeEvent[];
}
