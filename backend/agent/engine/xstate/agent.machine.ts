import { assign, setup, fromPromise } from "xstate";
import { advanceStep } from "../../domain/state";
import type { StopReason } from "../../domain/state";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../nodes/types";
import type {
  AgentMachineContext,
  AgentMachineDependencies,
  AgentMachineEvent,
  AgentMachineOutput,
  AgentMachineParams,
  AgentTransitionDecision,
  ShouldStopResult,
} from "./types";
import type { EngineNodeExecutionResult, NodeHandler, NodeOutputBase } from "../types";

interface RunNodeActorOutput {
  execution: EngineNodeExecutionResult<AgentNodeName>;
  decision: AgentTransitionDecision;
  nextState: AgentMachineContext["agentState"];
}

/**
 * createAgentMachine builds the XState-based orchestration loop around node handlers directly.
 * PURPOSE: Centralizes retries, backtracks, and terminal handling without intermediate runners.
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
      runNode: fromPromise(createRunNodeActor(dependencies)),
      shouldStop: fromPromise(createShouldStopActor(dependencies)),
    },
    actions: {
      cacheStopDecision: assign(({ event }) => {
        const stop = "output" in event ? (event.output as ShouldStopResult | undefined) : undefined;
        if (!stop) {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return { pendingStop: stop } satisfies Partial<AgentMachineContext>;
      }),
      clearPendingStop: assign(() => ({ pendingStop: null } satisfies Partial<AgentMachineContext>)),
      storeExecutionResult: assign(({ event }) => {
        const output = "output" in event ? (event.output as RunNodeActorOutput | undefined) : undefined;
        if (!output) {
          return {} satisfies Partial<AgentMachineContext>;
        }
        return {
          agentState: output.nextState,
          latestExecution: output.execution,
          latestDecision: output.decision,
          currentNode: output.nextState.nodeName as AgentNodeName,
          lastDecision: output.decision.kind,
        } satisfies Partial<AgentMachineContext>;
      }),
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
      retryDelay: ({ context }) => {
        const decision = context.latestDecision;
        return decision?.kind === "retry" ? decision.delayMs : 0;
      },
    },
    guards: {
      shouldAbort: ({ context }) => Boolean(context.pendingStop?.stop),
      hasRetryDecision: ({ context }) => context.latestDecision?.kind === "retry",
      hasBacktrackDecision: ({ context }) => context.latestDecision?.kind === "backtrack",
      hasAdvanceDecision: ({ context }) => context.latestDecision?.kind === "advance",
      hasTerminalSuccess: ({ context }) => context.latestDecision?.kind === "terminalSuccess",
      hasTerminalFailure: ({ context }) => context.latestDecision?.kind === "terminalFailure",
    },
  }).createMachine({
    id: "agent-orchestrator",
    initial: "idle",
    context: {
      agentState: withEntryNode(initialState, entryNode),
      currentNode: resolveInitialNode(initialState, entryNode),
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
      waitingRetry: {
        after: {
          retryDelay: {
            target: "checkStop",
          },
        },
      },
      finished: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: "completed",
          stopReason: context.agentState.stopReason ?? "success",
          lastNode: context.latestExecution?.nodeName ?? context.currentNode,
        }),
      },
      failed: {
        type: "final",
        output: ({ context }): AgentMachineOutput => ({
          state: context.agentState,
          status: context.agentState.status === "canceled" ? "canceled" : "failed",
          stopReason: context.agentState.stopReason ?? "crash",
          lastNode: context.latestExecution?.nodeName ?? context.currentNode,
        }),
      },
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

function createRunNodeActor(deps: AgentMachineDependencies) {
  return async ({ input }: { input: { agentState: AgentMachineContext["agentState"]; currentNode: AgentNodeName } }) => {
    const handler = resolveHandler(deps.registry, input.currentNode);
    const attemptNumber = (input.agentState.iterationOrdinalNumber ?? 0) + 1;
    const seed = deps.seed();
    const nowIso = deps.now();

    deps.logger.info("Running node", {
      nodeName: handler.name,
      attempt: attemptNumber,
    });

    const execution = await executeHandler({
      handler,
      state: input.agentState,
      ctx: deps.ctx,
      ports: deps.ports,
      seed,
      nowIso,
      attemptNumber,
    });

    const budgetStopReason = evaluateBudget(execution.state, nowIso);
    const decision = budgetStopReason
      ? ({ kind: "terminalFailure", stopReason: budgetStopReason } as AgentTransitionDecision)
      : computeTransitionDecision(execution);

    const nextState = applyDecisionToState(execution.state, decision);

    await deps.callbacks.onPersist(nextState, execution.events, execution.nodeName);
    await deps.callbacks.onAttempt({
      nodeName: execution.nodeName,
      outcome: execution.outcome,
      nextNode: decision.kind === "advance" ? decision.nextNode : null,
      backtracked: decision.kind === "backtrack",
      attempt: attemptNumber,
    });

    deps.logger.info("Node execution", {
      nodeName: execution.nodeName,
      outcome: execution.outcome,
      decision: decision.kind,
    });

    return {
      execution,
      decision,
      nextState,
    } satisfies RunNodeActorOutput;
  };
}

function createShouldStopActor(deps: AgentMachineDependencies) {
  return async ({ input }: { input: { agentState: AgentMachineContext["agentState"] } }) =>
    deps.shouldStop(input.agentState);
}

function resolveHandler(
  registry: AgentMachineDependencies["registry"],
  node: AgentNodeName,
): NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext> {
  const handler = registry[node];
  if (!handler) {
    throw new Error(`Handler not registered for node: ${node}`);
  }
  return handler as NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext>;
}

async function executeHandler(params: {
  handler: NodeHandler<unknown, NodeOutputBase, AgentNodeName, AgentPorts, AgentContext>;
  state: AgentMachineContext["agentState"];
  ctx: AgentContext;
  ports: AgentPorts;
  seed: number;
  nowIso: string;
  attemptNumber: number;
}): Promise<EngineNodeExecutionResult<AgentNodeName>> {
  const { handler, state, ctx, ports, seed, nowIso, attemptNumber } = params;
  const input = handler.buildInput(state, ctx);
  const { output, events } = await handler.execute(input as never, ports);
  const advanced = advanceStep(state, handler.name, nowIso, seed);
  const updated = handler.applyOutput(advanced, output as NodeOutputBase);
  const retryable = (output as NodeOutputBase & { retryable?: boolean | null }).retryable ?? null;

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

function computeTransitionDecision(
  execution: EngineNodeExecutionResult<AgentNodeName>,
): AgentTransitionDecision {
  const { outcome, retryable, policy, successTarget, attemptNumber, seedUsed } = execution;

  if (outcome === "SUCCESS") {
    if (successTarget === null) {
      return { kind: "terminalSuccess" };
    }
    return { kind: "advance", nextNode: successTarget };
  }

  const { retry, backtrackTo } = policy;
  const canRetry = retryable !== false;

  if (canRetry && attemptNumber < retry.maxAttempts) {
    const delayMs = computeBackoffDelayMs(attemptNumber, retry.baseDelayMs, retry.maxDelayMs, seedUsed);
    return { kind: "retry", delayMs, attempt: attemptNumber };
  }

  if (backtrackTo) {
    return { kind: "backtrack", targetNode: backtrackTo };
  }

  return { kind: "terminalFailure", stopReason: execution.state.stopReason ?? "crash" };
}

function applyDecisionToState(
  state: AgentMachineContext["agentState"],
  decision: AgentTransitionDecision,
): AgentMachineContext["agentState"] {
  switch (decision.kind) {
    case "advance":
      return {
        ...state,
        nodeName: decision.nextNode,
        iterationOrdinalNumber: 0,
      };
    case "retry":
      return {
        ...state,
        iterationOrdinalNumber: decision.attempt,
      };
    case "backtrack":
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
      return {
        ...state,
        status: "completed",
        stopReason: "success",
      };
    case "terminalFailure":
      return {
        ...state,
        status: "failed",
        stopReason: decision.stopReason,
      };
    case "stop":
      return {
        ...state,
        status: "failed",
        stopReason: decision.stopReason,
      };
    case "unexpected":
    default:
      return {
        ...state,
        status: "failed",
        stopReason: "crash",
      };
  }
}

function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  seed: number,
): number {
  const exp = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(exp, maxDelayMs);
  const jitter = (seed & 0xfff) / 0xfff;
  const jittered = Math.floor(capped * (0.75 + 0.25 * jitter));
  return Math.max(baseDelayMs, Math.min(jittered, maxDelayMs));
}

function evaluateBudget(state: AgentMachineContext["agentState"], nowIso: string): StopReason | null {
  const { budgets, counters, timestamps } = state;
  if (counters.stepsTotal >= budgets.maxSteps) {
    return "budget_exhausted" as const;
  }
  if (counters.outsideAppSteps >= budgets.outsideAppLimit) {
    return "budget_exhausted" as const;
  }
  if (counters.restartsUsed >= budgets.restartLimit) {
    return "budget_exhausted" as const;
  }

  const elapsedMs = Date.parse(nowIso) - Date.parse(timestamps.createdAt);
  if (elapsedMs >= budgets.maxTimeMs) {
    return "budget_exhausted" as const;
  }

  return null;
}

function withEntryNode(state: AgentMachineContext["agentState"], entryNode: AgentNodeName) {
  if (state.nodeName && state.nodeName !== "InitialSetup") {
    return state;
  }
  return {
    ...state,
    nodeName: entryNode,
  };
}

function resolveInitialNode(state: AgentMachineContext["agentState"], entryNode: AgentNodeName) {
  return (state.nodeName && state.nodeName !== "InitialSetup"
    ? (state.nodeName as AgentNodeName)
    : entryNode);
}

