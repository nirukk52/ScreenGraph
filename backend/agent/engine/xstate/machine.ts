import { assign, setup } from "xstate";
import type { StopReason } from "../../domain/state";
import type { AgentNodeName } from "../../nodes/types";
import type { EngineRunOnceResult } from "../types";
import { createRunOnceActor, createShouldStopActor } from "./services";
import type {
  AgentMachineContext,
  AgentMachineEvent,
  AgentMachineOutput,
  AgentMachineParams,
  AgentDecisionKind,
  ShouldStopResult,
} from "./types";

/**
 * createAgentMachine builds the feature-flagged XState driver wrapping NodeEngine.
 * PURPOSE: Provides a deterministic orchestration loop while preserving existing node wiring.
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
      runOnce: createRunOnceActor(dependencies),
      shouldStop: createShouldStopActor(dependencies),
    },
    actions: {
      clearPendingStop: assign(() => ({
        pendingStop: null,
      } satisfies Partial<AgentMachineContext>)),
      clearLatestResult: assign(() => ({
        latestResult: null,
        lastDecision: null,
      } satisfies Partial<AgentMachineContext>)),
      prepareRetry: assign(({ context }) => {
        const result = context.latestResult;
        if (!result) {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return {
          agentState: result.state,
          currentNode: result.nextNode ?? result.nodeName,
          lastDecision: "retry" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      applyBacktrack: assign(({ context }) => {
        const result = context.latestResult;
        if (!result || !result.nextNode) {
          return {} satisfies Partial<AgentMachineContext>;
        }
        const backtrackNode = result.nextNode;
        return {
          agentState: { ...result.state, nodeName: backtrackNode },
          currentNode: backtrackNode,
          lastDecision: "backtrack" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      advanceToNextNode: assign(({ context }) => {
        const result = context.latestResult;
        if (!result || !result.nextNode) {
          return {} satisfies Partial<AgentMachineContext>;
        }
        const nextNode = result.nextNode;
        return {
          agentState: { ...result.state, nodeName: nextNode },
          currentNode: nextNode,
          lastDecision: "advance" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      markSuccess: assign(({ context }) => {
        const result = context.latestResult;
        if (!result) {
          return context;
        }
        return {
          agentState: {
            ...result.state,
            status: "completed",
            stopReason: "success",
          },
          lastDecision: "terminalSuccess" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      markFailure: assign(({ context }) => {
        const result = context.latestResult;
        const stopReason: StopReason = result?.stopReason ?? "crash";
        return {
          agentState: {
            ...(result?.state ?? context.agentState),
            status: "failed",
            stopReason,
          },
          lastDecision: "terminalFailure" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      applyStopDisposition: assign(({ context }) => {
        const { agentState, pendingStop } = context;
        if (!pendingStop) {
          return {
            agentState: {
              ...agentState,
              status: "failed",
              stopReason: "crash",
            },
            lastDecision: "stop" as AgentDecisionKind,
          } satisfies Partial<AgentMachineContext>;
        }
        const disposition: "canceled" | "failed" =
          pendingStop.reason === "user_cancelled" ? "canceled" : "failed";
        return {
          agentState: {
            ...agentState,
            status: disposition,
            stopReason: pendingStop.reason,
          },
          lastDecision: "stop" as AgentDecisionKind,
        } satisfies Partial<AgentMachineContext>;
      }),
      markUnexpectedFailure: assign(({ context }) => ({
        agentState: {
          ...context.agentState,
          status: "failed",
          stopReason: "crash",
        },
        lastDecision: "unexpected" as AgentDecisionKind,
      } satisfies Partial<AgentMachineContext>)),
    },
    delays: {
      retryDelay: ({ context }) => context.latestResult?.retryDelayMs ?? 0,
    },
    guards: {
      shouldAbort: ({ context }) => Boolean(context.pendingStop?.stop),
      shouldRetry: ({ context }) => {
        const result = context.latestResult;
        return Boolean(
          result &&
            result.retryDelayMs !== null &&
            result.nextNode !== null &&
            result.nextNode === context.currentNode,
        );
      },
      shouldBacktrack: ({ context }) => Boolean(context.latestResult?.backtracked),
      hasNextNode: ({ context }) => Boolean(context.latestResult?.nextNode),
      isTerminalSuccess: ({ context }) =>
        Boolean(context.latestResult?.outcome === "SUCCESS" && context.latestResult?.nextNode === null),
      isTerminalFailure: ({ context }) =>
        Boolean(context.latestResult?.outcome === "FAILURE" && context.latestResult?.nextNode === null),
    },
  }).createMachine({
    id: "agent-orchestrator",
    initial: "idle",
    context: {
      agentState: initialState,
      currentNode: entryNode,
      latestResult: null,
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
        entry: "clearLatestResult",
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
          src: "runOnce",
          input: ({ context }) => ({
            agentState: context.agentState,
            currentNode: context.currentNode,
          }),
          onDone: {
            target: "decide",
            actions: assign(({ event }) => {
              const output = event.output as EngineRunOnceResult<AgentNodeName> | undefined;
              if (!output) {
                return {} satisfies Partial<AgentMachineContext>;
              }
              return {
                agentState: output.state,
                latestResult: output,
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
          lastNode: context.latestResult?.nodeName ?? context.currentNode,
        }),
      },
      failed: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: context.agentState.status === "failed" ? "failed" : "failed",
          stopReason: context.agentState.stopReason ?? "crash",
          lastNode: context.latestResult?.nodeName ?? context.currentNode,
        }),
      },
      stopped: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: context.agentState.status,
          stopReason: context.agentState.stopReason,
          lastNode: context.latestResult?.nodeName ?? context.currentNode,
        }),
      },
    },
  });
}

