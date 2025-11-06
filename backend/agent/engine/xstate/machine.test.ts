import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import { createAgentMachine } from "./agent.machine";
import type { AgentMachineDependencies, AgentMachineOutput } from "./types";
import type { AgentContext, AgentNodeName, AgentPorts } from "../../nodes/types";
import type { NodeHandler, NodeOutputBase, NodeRegistry } from "../types";
import { createInitialState } from "../../domain/state";
import type { AgentState, StopReason } from "../../domain/state";

interface StubOutcome {
  status: "SUCCESS" | "FAILURE";
  retryable?: boolean | null;
}

type StubOutput = NodeOutputBase & { retryable?: boolean | null };

type OutcomeScript = StubOutcome[];

const baseBudgets = {
  maxSteps: 100,
  maxTimeMs: 600_000,
  maxTaps: 500,
  outsideAppLimit: 20,
  restartLimit: 3,
  appLaunchTimeoutMs: 30_000,
  appRestartTimeoutMs: 30_000,
} as const;

const transitionMap: Record<AgentNodeName, AgentNodeName | null> = {
  EnsureDevice: "ProvisionApp",
  ProvisionApp: "LaunchOrAttach",
  LaunchOrAttach: "Perceive",
  Perceive: "WaitIdle",
  WaitIdle: "SwitchPolicy",
  SwitchPolicy: "Stop",
  RestartApp: "WaitIdle",
  Stop: null,
};

const defaultPolicy = {
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1_000,
    maxDelayMs: 5_000,
  },
} as const;

const testContext: AgentContext = {
  ensureDevice: {
    deviceConfiguration: {
      platformName: "android",
      deviceName: "pixel-test",
      platformVersion: "15",
      appiumServerUrl: "http://localhost:4723",
    },
    driverReusePolicy: "REUSE_OR_CREATE",
  },
  provisionApp: {
    installationPolicy: "INSTALL_IF_MISSING",
    reinstallIfOlder: false,
    applicationUnderTestDescriptor: {
      androidPackageId: "com.example.app",
      apkStorageObjectReference: "apk://example",
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
    installOrRestart: "RESTART",
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
  policy: {
    switchPolicy: {
      currentStrategyConfiguration: {
        strategyName: "BASIC",
        policyVersion: 1,
      },
      requestedStrategyConfiguration: {
        strategyName: "BASIC",
        policyVersion: 1,
      },
      reasonPlaintext: "default",
    },
  },
  terminal: {
    intendedTerminalDisposition: "SUCCEEDED",
    terminalizationBasis: "test",
  },
};

function createStubHandler(
  name: AgentNodeName,
  nextNode: AgentNodeName | null,
  script: OutcomeScript,
): NodeHandler<undefined, StubOutput, AgentNodeName, AgentPorts, AgentContext> {
  const outcomes = script.length > 0 ? script : [{ status: "SUCCESS", retryable: null }];
  let index = 0;

  return {
    name,
    buildInput() {
      return undefined;
    },
    async execute() {
      const outcome = outcomes[Math.min(index, outcomes.length - 1)];
      index += 1;
      const output: StubOutput = {
        nodeExecutionOutcomeStatus: outcome.status,
        retryable: outcome.retryable ?? null,
      };
      return { output, events: [] };
    },
    applyOutput(prev) {
      return prev;
    },
    onSuccess: nextNode,
    onFailure: defaultPolicy,
  };
}

function createStubRegistry(
  scripts: Partial<Record<AgentNodeName, OutcomeScript>> = {},
): NodeRegistry<AgentNodeName, AgentPorts, AgentContext> {
  const registry: NodeRegistry<AgentNodeName, AgentPorts, AgentContext> = {};
  (Object.keys(transitionMap) as AgentNodeName[]).forEach((node) => {
    const sequence = scripts[node] ?? [{ status: "SUCCESS", retryable: null }];
    registry[node] = createStubHandler(node, transitionMap[node], sequence);
  });
  return registry;
}

function createStubPorts(): AgentPorts {
  return {
    sessionPort: {
      ensureDevice: async () => ({
        deviceRuntimeContextId: "context-1",
        deviceId: "device-1",
        capabilitiesEcho: {},
        healthProbeStatus: "HEALTHY",
      }),
      closeSession: async () => {},
    },
    appLifecyclePort: {
      launchApp: async () => ({
        currentPackageId: "com.example.app",
        currentActivityName: "MainActivity",
        appBroughtToForegroundTimestamp: new Date().toISOString(),
      }),
      restartApp: async () => true,
      getCurrentApp: async () => "com.example.app",
    },
    idleDetectorPort: {
      waitIdle: async () => 250,
    },
    packageManagerPort: {
      isInstalled: async () => ({ installed: true }),
      installFromObjectStorage: async () => ({ packageId: "com.example.app" }),
      getSignatureSha256: async () => "deadbeef",
      uninstall: async () => true,
    },
    perceptionPort: {
      captureScreenshot: async () => ({
        base64Image: "",
        format: "png",
        widthPx: 1080,
        heightPx: 1920,
      }),
      dumpUiHierarchy: async () => ({
        xmlContent: "<hierarchy />",
        captureTimestampMs: Date.now(),
      }),
    },
    deviceInfoPort: {
      getScreenDimensions: async () => ({ widthPx: 1080, heightPx: 1920 }),
      isDeviceReady: async () => true,
    },
    storagePort: {
      storeArtifact: async () => ({ refId: "artifact-ref" }),
      retrieveArtifact: async () => ({ content: "", metadata: {} }),
    },
  };
}

interface BuiltDependencies {
  dependencies: AgentMachineDependencies;
  callbacks: {
    onAttempt: ReturnType<typeof vi.fn>;
    onPersist: ReturnType<typeof vi.fn>;
  };
  logger: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
}

function buildDependencies(
  registry: NodeRegistry<AgentNodeName, AgentPorts, AgentContext>,
  overrides: {
    shouldStop?: AgentMachineDependencies["shouldStop"];
    now?: () => string;
  } = {},
): BuiltDependencies {
  let seedValue = 123456;
  let currentTimeMs = Date.parse("2025-01-01T00:00:00.000Z");

  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const callbacks = {
    onAttempt: vi.fn().mockResolvedValue(undefined),
    onPersist: vi.fn().mockResolvedValue(undefined),
  };

  const dependencies: AgentMachineDependencies = {
    registry,
    ports: createStubPorts(),
    ctx: testContext,
    seed: () => {
      seedValue = (seedValue * 1103515245 + 12345) & 0x7fffffff;
      return seedValue;
    },
    shouldStop: overrides.shouldStop ?? (async () => ({ stop: false, reason: null })),
    logger: logger as unknown as AgentMachineDependencies["logger"],
    callbacks,
    now:
      overrides.now ??
      (() => {
        currentTimeMs += 1_000;
        return new Date(currentTimeMs).toISOString();
      }),
  };

  return { dependencies, callbacks, logger };
}

async function runMachine(
  initialState: AgentState,
  machineDependencies: AgentMachineDependencies,
): Promise<{
  output: AgentMachineOutput;
  history: Array<{ status: AgentState["status"]; latestNode: AgentNodeName | null; decision: string | null }>;
}> {
  const machine = createAgentMachine({
    initialState,
    entryNode: "EnsureDevice",
    dependencies: machineDependencies,
  });

  const actor = createActor(machine);
  const history: Array<{ status: AgentState["status"]; latestNode: AgentNodeName | null; decision: string | null }> = [];

  const completion = new Promise<AgentMachineOutput>((resolve, reject) => {
    const subscription = actor.subscribe({
      next: (snapshot) => {
        history.push({
          status: snapshot.context.agentState.status,
          latestNode: snapshot.context.latestExecution?.nodeName ?? null,
          decision: snapshot.context.lastDecision ?? null,
        });
        if (snapshot.status === "done") {
          subscription.unsubscribe?.();
          const derived = snapshot.output ?? {
            state: snapshot.context.agentState,
            status:
              snapshot.context.agentState.status === "completed"
                ? "completed"
                : snapshot.context.agentState.status === "canceled"
                  ? "canceled"
                  : "failed",
            stopReason: snapshot.context.agentState.stopReason ?? null,
            lastNode: snapshot.context.latestExecution?.nodeName ?? snapshot.context.currentNode,
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
  const finalOutput = await completion;
  actor.stop();
  return { output: finalOutput, history };
}

function createState(overrides?: Partial<AgentState>, budgetsOverride?: Partial<AgentState["budgets"]>) {
  const createdAt = new Date("2025-01-01T00:00:00.000Z").toISOString();
  const state = createInitialState("tenant", "project", "run", { ...baseBudgets, ...budgetsOverride }, createdAt);
  return { ...state, ...overrides };
}

describe("createAgentMachine", () => {
  it.skip("completes the nominal orchestration path", async () => {
    const registry = createStubRegistry();
    const built = buildDependencies(registry);
    const initialState = createState();

    const { output } = await runMachine(initialState, built.dependencies);

    expect(output.status).toBe("completed");
    expect(output.stopReason).toBe("success");
    expect(output.lastNode).toBe("Stop");
    expect(built.callbacks.onPersist).toHaveBeenCalledTimes(7);
    expect(built.callbacks.onAttempt).toHaveBeenCalledTimes(7);
  });

  it("stops before execution when shouldStop requests cancellation", async () => {
    const registry = createStubRegistry();
    const built = buildDependencies(registry, {
      shouldStop: async () => ({ stop: true, reason: "user_cancelled" as StopReason }),
    });
    const initialState = createState();

    const { output } = await runMachine(initialState, built.dependencies);

    expect(output.status).toBe("canceled");
    expect(output.stopReason).toBe("user_cancelled");
    expect(built.callbacks.onPersist).not.toHaveBeenCalled();
    expect(built.callbacks.onAttempt).not.toHaveBeenCalled();
  });

  it("retries a node before succeeding", async () => {
    const registry = createStubRegistry({
      EnsureDevice: [
        { status: "FAILURE", retryable: true },
        { status: "SUCCESS", retryable: null },
      ],
    });
    const built = buildDependencies(registry);
    const initialState = createState();

    const { output } = await runMachine(initialState, built.dependencies);

    expect(output.status).toBe("completed");
    expect(built.callbacks.onPersist).toHaveBeenCalledTimes(8);
    expect(built.callbacks.onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ nodeName: "EnsureDevice", backtracked: false }),
    );
  });

  it.skip("fails when budgets are exhausted", async () => {
    const registry = createStubRegistry();
    const built = buildDependencies(registry);
    const initialState = createState(undefined, { maxSteps: 0 });

    const { output } = await runMachine(initialState, built.dependencies);

    expect(output.status).toBe("failed");
    expect(output.stopReason).toBe("budget_exhausted");
    expect(output.lastNode).toBe("EnsureDevice");
    expect(built.callbacks.onPersist).toHaveBeenCalledTimes(1);
  });
});

