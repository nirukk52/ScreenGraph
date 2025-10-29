import { assign, setup } from "xstate";
import type { StopReason } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import { createRunNodeActor, createShouldStopActor } from "./services";
import type {
  AgentMachineContext,
  AgentMachineEvent,
  AgentMachineOutput,
  AgentMachineParams,
  AgentDecisionKind,
  ShouldStopResult,
  AgentTransitionDecision,
} from "./types";

/**
 * createAgentMachine builds the XState driver wrapping NodeEngine with explicit transition policy.
 * PURPOSE: Provides deterministic orchestration loop with retry/backoff/backtrack logic centralized in guards/actions.
 */
export function createAgentMachine(params: AgentMachineParams) {
  const { initialState, entryNode, dependencies } = params;

  return setup({
    types: {
      context: {} as AgentMachineContext,
      events: {} as AgentMachineEvent,
      output: {} as AgentMachineOutput,
    },
    actors: {
      runNode: createRunNodeActor(dependencies),
      shouldStop: createShouldStopActor(dependencies),
    },
    actions: {
      clearPendingStop: assign(() => ({
        pendingStop: null,
      } satisfies Partial<AgentMachineContext>)),
      clearLatestExecution: assign(() => ({
        latestExecution: null,
        latestDecision: null,
      } satisfies Partial<AgentMachineContext>)),
      prepareRetry: assign(({ context }) => {
        const decision = context.latestDecision;
        if (!decision || decision.kind !== "retry") {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return {
          agentState: context.agentState,
          currentNode: context.currentNode,
          lastDecision: "retry" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      applyBacktrack: assign(({ context }) => {
        const decision = context.latestDecision;
        if (!decision || decision.kind !== "backtrack") {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return {
          agentState: {
            ...context.agentState,
            nodeName: decision.targetNode,
            iterationOrdinalNumber: 0,
            counters: { ...context.agentState.counters, restartsUsed: context.agentState.counters.restartsUsed + 1 },
          },
          currentNode: decision.targetNode,
          lastDecision: "backtrack" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      advanceToNextNode: assign(({ context }) => {
        const decision = context.latestDecision;
        if (!decision || decision.kind !== "advance") {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return {
          agentState: { ...context.agentState, nodeName: decision.nextNode, iterationOrdinalNumber: 0 },
          currentNode: decision.nextNode,
          lastDecision: "advance" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      markSuccess: assign(({ context }) => ({
        agentState: { ...context.agentState, status: "completed", stopReason: "success" },
        lastDecision: "terminalSuccess" as AgentDecisionKind,
      } satisfies Partial<AgentMachineContext>)),
      markFailure: assign(({ context }) => {
        const decision = context.latestDecision;
        const stopReason: StopReason = decision?.kind === "terminalFailure" ? decision.stopReason : "crash";
        return {
          agentState: { ...context.agentState, status: "failed", stopReason },
          lastDecision: "terminalFailure" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      applyStopDisposition: assign(({ context }) => {
        const { agentState, pendingStop } = context;
        if (!pendingStop) {
          return {
            agentState: { ...agentState, status: "failed", stopReason: "crash" },
            lastDecision: "stop" as AgentDecisionKind,
          } satisfies Partial<AgentMachineContext>;
        }
        const disposition: "canceled" | "failed" =
          pendingStop.reason === "user_cancelled" ? "canceled" : "failed";
        return {
          agentState: { ...agentState, status: disposition, stopReason: pendingStop.reason },
          lastDecision: "stop" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      markUnexpectedFailure: assign(({ context }) => ({
        agentState: { ...context.agentState, status: "failed", stopReason: "crash" },
        lastDecision: "unexpected" as AgentDecisionKind,
      } satisfies Partial<AgentMachineContext>)),
    },
    delays: {
      retryDelay: ({ context }) => {
        const decision = context.latestDecision;
        return decision?.kind === "retry" ? decision.delayMs : 0;
      },
    },
    guards: {
      shouldAbort: ({ context }) => Boolean(context.pendingStop?.stop),
      shouldRetry: ({ context }) => context.latestDecision?.kind === "retry",
      shouldBacktrack: ({ context }) => context.latestDecision?.kind === "backtrack",
      hasNextNode: ({ context }) => context.latestDecision?.kind === "advance",
      isTerminalSuccess: ({ context }) => context.latestDecision?.kind === "terminalSuccess",
      isTerminalFailure: ({ context }) => context.latestDecision?.kind === "terminalFailure",
    },
  }).createMachine({
    id: "agent-orchestrator",
    initial: "idle",
    context: {
      agentState: initialState,
      currentNode: entryNode,
      latestExecution: null,
      latestDecision: null,
      pendingStop: null,
      lastDecision: null,
    },
    states: {
      idle: {
        on: {
          START: {
            target: "checkStop",
          },
        },
      },
      checkStop: {
        entry: "clearLatestExecution",
        invoke: {
          src: "shouldStop",
          input: ({ context }) => ({ agentState: context.agentState }),
          onDone: {
            target: "evaluateStop",
            actions: assign(({ event }) => {
              const stop = event.output as ShouldStopResult | undefined;
              if (!stop) {
                return {} satisfies Partial<AgentMachineContext>;
              }
              return {
                pendingStop: stop,
              } satisfies Partial<AgentMachineContext>;
            }),
          },
          onError: {
            target: "failed",
            actions: ["markUnexpectedFailure"],
          },
        },
      },
      evaluateStop: {
        always: [
          {
            guard: "shouldAbort",
            target: "stopped",
            actions: ["applyStopDisposition"],
          },
          {
            target: "executing",
            actions: ["clearPendingStop"],
          },
        ],
      },
      executing: {
        invoke: {
          src: "runNode",
          input: ({ context }) => ({
            agentState: context.agentState,
            currentNode: context.currentNode,
          }),
          onDone: {
            target: "decide",
            actions: assign(({ event }) => {
              const output = event.output as { execution: any; decision: AgentTransitionDecision } | undefined;
              if (!output) {
                return {} satisfies Partial<AgentMachineContext>;
              }
              return {
                agentState: output.execution.state,
                latestExecution: output.execution,
                latestDecision: output.decision,
              } satisfies Partial<AgentMachineContext>;
            }),
          },
          onError: {
            target: "failed",
            actions: ["markUnexpectedFailure"],
          },
        },
      },
      decide: {
        always: [
          {
            guard: "isTerminalSuccess",
            target: "finished",
            actions: ["markSuccess"],
          },
          {
            guard: "isTerminalFailure",
            target: "failed",
            actions: ["markFailure"],
          },
          {
            guard: "shouldRetry",
            target: "waitingRetry",
            actions: ["prepareRetry"],
          },
          {
            guard: "shouldBacktrack",
            target: "checkStop",
            actions: ["applyBacktrack"],
          },
          {
            guard: "hasNextNode",
            target: "checkStop",
            actions: ["advanceToNextNode"],
          },
          {
            target: "failed",
            actions: ["markUnexpectedFailure"],
          },
        ],
      },
      waitingRetry: {
        after: {
          retryDelay: {
            target: "checkStop",
            actions: ["clearPendingStop"],
          },
        },
      },
      finished: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: "completed",
          stopReason: "success",
          lastNode: context.latestExecution?.nodeName ?? context.currentNode,
        }),
      },
      failed: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: context.agentState.status === "failed" ? "failed" : "failed",
          stopReason: context.agentState.stopReason ?? "crash",
          lastNode: context.latestExecution?.nodeName ?? context.currentNode,
        }),
      },
      stopped: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: context.agentState.status,
          stopReason: context.agentState.stopReason,
          lastNode: context.latestExecution?.nodeName ?? context.currentNode,
        }),
      },
    },
  });
}
