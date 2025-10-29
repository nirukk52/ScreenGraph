import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import { createAgentMachine } from "./machine";
import type { AgentMachineDependencies, AgentMachineOutput } from "./types";
import type { AgentNodeName, AgentPorts, AgentContext } from "../../nodes/types";
import type { EngineRunOnceResult, NodeEvent } from "../types";
import type { AgentState } from "../../domain/state";
import { createInitialState } from "../../domain/state";

class FakeEngine {
  constructor(private readonly results: EngineRunOnceResult<AgentNodeName>[]) {}

  async runOnce(): Promise<EngineRunOnceResult<AgentNodeName>> {
    const next = this.results.shift();
    if (!next) {
      throw new Error("No engine result available");
    }
    return next;
  }
}

const baseBudgets = {
  maxSteps: 100,
  maxTimeMs: 60_000,
  maxTaps: 100,
  outsideAppLimit: 10,
  restartLimit: 3,
  appLaunchTimeoutMs: 10_000,
  appRestartTimeoutMs: 10_000,
} as const;

const testContext: AgentContext = {
  ensureDevice: {
    deviceConfiguration: {
      platformName: "android",
      deviceName: "test-device",
      platformVersion: "15",
      automationName: "UiAutomator2",
    },
    driverReusePolicy: "REUSE_OR_CREATE",
  },
  provisionApp: {
    installationPolicy: "INSTALL_IF_MISSING",
    reinstallIfOlder: false,
    applicationUnderTestDescriptor: {
      androidPackageId: "com.example.app",
      apkStorageObjectReference: "apk-ref",
      expectedBuildSignatureSha256: null,
      expectedVersionCode: null,
      expectedVersionName: null,
    },
  },
  launchOrAttach: {
    applicationUnderTestDescriptor: {
      androidPackageId: "com.example.app",
    },
    launchAttachMode: "LAUNCH_OR_ATTACH",
  },
  perceive: {
    captureDirectives: {
      includeScreenshotPng: true,
      includeUiHierarchyXml: true,
      delayBeforeCaptureMs: 0,
    },
  },
  waitIdle: {
    idleHeuristicsConfiguration: {
      minQuietMillis: 250,
      maxWaitMillis: 5_000,
    },
  },
} as const;

const events: NodeEvent[] = [];

function withStep(state: AgentState, nodeName: AgentNodeName): AgentState {
  const nextOrdinal = state.stepOrdinal + 1;
  return {
    ...state,
    nodeName,
    stepOrdinal: nextOrdinal,
    resumeToken: `${state.runId}-${String(nextOrdinal).padStart(3, "0")}`,
    counters: {
      ...state.counters,
      stepsTotal: state.counters.stepsTotal + 1,
    },
    timestamps: {
      ...state.timestamps,
      updatedAt: new Date(Date.parse(state.timestamps.updatedAt) + 1_000).toISOString(),
    },
  };
}

function buildDependencies(
  engine: FakeEngine,
  shouldStopImpl: AgentMachineDependencies["shouldStop"],
): AgentMachineDependencies {
  const loggerMocks = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const callbackMocks = {
    onAttempt: vi.fn().mockResolvedValue(undefined),
    onPersist: vi.fn().mockResolvedValue(undefined),
  };

  return Object.assign(
    {
      engine: engine as unknown as AgentMachineDependencies["engine"],
      ports: {} as AgentPorts,
      ctx: testContext,
      seed: () => 42,
      shouldStop: shouldStopImpl,
      logger: loggerMocks as unknown as AgentMachineDependencies["logger"],
      callbacks: callbackMocks,
    },
    { __loggerMocks: loggerMocks, __callbackMocks: callbackMocks },
  ) as AgentMachineDependencies;
}

async function runMachine(machineDeps: {
  initialState: AgentState;
  dependencies: AgentMachineDependencies;
}): Promise<
  AgentMachineOutput & {
    history: Array<{ value: unknown; status: AgentState["status"]; latestNode: AgentNodeName | null; decision: string | null }>;
  }
> {
  const machine = createAgentMachine({
    initialState: machineDeps.initialState,
    entryNode: "EnsureDevice",
    dependencies: machineDeps.dependencies,
  });

  const actor = createActor(machine);
  const history: Array<{
    value: unknown;
    status: AgentState["status"];
    latestNode: AgentNodeName | null;
    decision: string | null;
  }> = [];

  const outputPromise = new Promise<AgentMachineOutput>((resolve, reject) => {
    const subscription = actor.subscribe({
      next: (snapshot) => {
        history.push({
          value: snapshot.value,
          status: snapshot.context.agentState.status,
          latestNode: snapshot.context.latestResult?.nodeName ?? null,
          decision: snapshot.context.lastDecision ?? null,
          latestResultExists: Boolean(snapshot.context.latestResult),
          currentNode: snapshot.context.currentNode,
          nextNodeFromResult: snapshot.context.latestResult?.nextNode ?? null,
        });
        if (snapshot.status === "done") {
          subscription.unsubscribe?.();
          const derived: AgentMachineOutput =
            (snapshot.output as AgentMachineOutput | undefined) ?? {
              state: snapshot.context.agentState,
              status:
                snapshot.context.agentState.status === "canceled"
                  ? "canceled"
                  : snapshot.context.agentState.status === "failed"
                    ? "failed"
                    : "completed",
              stopReason: snapshot.context.agentState.stopReason ?? null,
              lastNode: snapshot.context.latestResult?.nodeName ?? snapshot.context.currentNode,
            };
          resolve(derived);
        }
      },
      error: (err) => {
        subscription.unsubscribe?.();
        reject(err);
      },
    });
  });

  actor.start();
  actor.send({ type: "START" });

  const output = await outputPromise;
  actor.stop();
  return { ...output, history };
}

describe("createAgentMachine", () => {
  it("completes the nominal setup path", async () => {
    const initialState = createInitialState(
      "tenant",
      "project",
      "run",
      { ...baseBudgets },
      new Date("2025-01-01T00:00:00.000Z").toISOString(),
    );

    const ensureDeviceState = withStep(initialState, "EnsureDevice");
    const launchState = withStep(ensureDeviceState, "LaunchOrAttach");
    const perceiveState = withStep(launchState, "Perceive");
    const waitIdleState = withStep(perceiveState, "WaitIdle");
    const switchPolicyState = withStep(waitIdleState, "SwitchPolicy");

    const engine = new FakeEngine([
      {
        state: ensureDeviceState,
        nodeName: "EnsureDevice",
        outcome: "SUCCESS",
        nextNode: "LaunchOrAttach",
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
      {
        state: launchState,
        nodeName: "LaunchOrAttach",
        outcome: "SUCCESS",
        nextNode: "Perceive",
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
      {
        state: perceiveState,
        nodeName: "Perceive",
        outcome: "SUCCESS",
        nextNode: "WaitIdle",
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
      {
        state: waitIdleState,
        nodeName: "WaitIdle",
        outcome: "SUCCESS",
        nextNode: "SwitchPolicy",
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
      {
        state: switchPolicyState,
        nodeName: "SwitchPolicy",
        outcome: "SUCCESS",
        nextNode: null,
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
    ]);

    const dependencies = buildDependencies(engine, async () => ({ stop: false, reason: null }));

    const output = await runMachine({ initialState, dependencies });
    expect(output.status).toBe("completed");
    expect(output.stopReason).toBe("success");
    expect(output.lastNode).toBe("SwitchPolicy");
    expect(dependencies.callbacks.onPersist).toHaveBeenCalledTimes(5);
    expect(dependencies.callbacks.onAttempt).toHaveBeenCalledTimes(5);
  });

  it("respects external stop requests before execution", async () => {
    const initialState = createInitialState(
      "tenant",
      "project",
      "run",
      { ...baseBudgets },
      new Date("2025-01-01T00:00:00.000Z").toISOString(),
    );

    const engine = new FakeEngine([]);
    const dependencies = buildDependencies(engine, async () => ({
      stop: true,
      reason: "user_cancelled",
    }));

    const output = await runMachine({ initialState, dependencies });

    expect(output.status).toBe("canceled");
    expect(output.stopReason).toBe("user_cancelled");
    expect(dependencies.callbacks.onPersist).not.toHaveBeenCalled();
    expect(dependencies.callbacks.onAttempt).not.toHaveBeenCalled();
  });

  it("retries and then succeeds when engine indicates retry", async () => {
    const initialState = createInitialState(
      "tenant",
      "project",
      "run",
      { ...baseBudgets },
      new Date("2025-01-01T00:00:00.000Z").toISOString(),
    );

    const ensureDeviceState = withStep(initialState, "EnsureDevice");
    const retryState: AgentState = {
      ...ensureDeviceState,
      iterationOrdinalNumber: 1,
    };
    const successState = withStep(retryState, "EnsureDevice");

    const engine = new FakeEngine([
      {
        state: retryState,
        nodeName: "EnsureDevice",
        outcome: "FAILURE",
        nextNode: "EnsureDevice",
        backtracked: false,
        retryDelayMs: 0,
        stopReason: null,
        events,
      },
      {
        state: successState,
        nodeName: "EnsureDevice",
        outcome: "SUCCESS",
        nextNode: null,
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      },
    ]);

    const dependencies = buildDependencies(engine, async () => ({ stop: false, reason: null }));

    const output = await runMachine({ initialState, dependencies });

    expect(output.status).toBe("completed");
    expect(dependencies.callbacks.onPersist).toHaveBeenCalledTimes(2);
  });
});

