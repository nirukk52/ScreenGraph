import { describe, it, expect } from "vitest";
import { NodeEngine } from "../engine/node-engine";
import type { NodeRegistry, NodeHandler, NodeExecutorResult } from "../engine/types";
import type { AgentState, Budgets } from "../domain/state";
import { createInitialState } from "../domain/state";

type TestNodeName = "NodeA" | "NodeB" | "FailingNode" | "RecoveryNode";
type TestPorts = Record<string, never>;
type TestContext = Record<string, never>;

interface SuccessOutput {
  nodeExecutionOutcomeStatus: "SUCCESS";
  marker: "success";
}

interface FailureOutput {
  nodeExecutionOutcomeStatus: "FAILURE";
  marker: "failure";
}

const BASE_BUDGETS: Budgets = {
  maxSteps: 10,
  maxTimeMs: 10_000,
  maxTaps: 10,
  outsideAppLimit: 5,
  restartLimit: 3,
};

/**
 * createState builds a minimal AgentState for node engine tests.
 * PURPOSE: Ensures deterministic starting conditions without orchestrator setup.
 */
function createState(nodeName: TestNodeName, iterationOrdinalNumber = 0): AgentState {
  const base = createInitialState("tenant-test", "project-test", "run-test", BASE_BUDGETS, new Date().toISOString());
  return {
    ...base,
    nodeName,
    iterationOrdinalNumber,
  };
}

/**
 * createEngine constructs a NodeEngine with the given registry.
 * PURPOSE: Keeps tests concise by centralizing engine instantiation.
 */
function createEngine(registry: NodeRegistry<TestNodeName, TestPorts, TestContext>): NodeEngine<TestNodeName, TestPorts, TestContext> {
  return new NodeEngine<TestNodeName, TestPorts, TestContext>(registry);
}

describe("NodeEngine", () => {
  it("advances to next node on success", async () => {
    const successHandler: NodeHandler<void, SuccessOutput, "NodeA", TestPorts, TestContext> = {
      name: "NodeA",
      buildInput: () => undefined,
      async execute(): Promise<NodeExecutorResult<SuccessOutput>> {
        return {
          output: { nodeExecutionOutcomeStatus: "SUCCESS", marker: "success" },
          events: [],
        };
      },
      applyOutput(prev: AgentState): AgentState {
        return { ...prev };
      },
      onSuccess: "NodeB",
      onFailure: {
        retry: { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 },
      },
    };

    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: successHandler,
    };

    const engine = createEngine(registry);
    const state = createState("NodeA");

    const result = await engine.runOnce({
      state,
      nowIso: new Date().toISOString(),
      seed: 123,
      ports: {} as TestPorts,
      ctx: {} as TestContext,
      currentNode: "NodeA",
    });

    expect(result.outcome).toBe("SUCCESS");
    expect(result.nextNode).toBe("NodeB");
    expect(result.state.iterationOrdinalNumber).toBe(0);
    expect(result.retryDelayMs).toBeNull();
    expect(result.backtracked).toBe(false);
  });

  it("retries the same node on failure within attempt budget", async () => {
    const failingHandler: NodeHandler<void, FailureOutput, "FailingNode", TestPorts, TestContext> = {
      name: "FailingNode",
      buildInput: () => undefined,
      async execute(): Promise<NodeExecutorResult<FailureOutput>> {
        return {
          output: { nodeExecutionOutcomeStatus: "FAILURE", marker: "failure" },
          events: [],
        };
      },
      applyOutput(prev: AgentState): AgentState {
        return prev;
      },
      onSuccess: "RecoveryNode",
      onFailure: {
        retry: { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 500 },
      },
    };

    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      FailingNode: failingHandler,
    };

    const engine = createEngine(registry);
    const state = createState("FailingNode");

    const result = await engine.runOnce({
      state,
      nowIso: new Date().toISOString(),
      seed: 321,
      ports: {} as TestPorts,
      ctx: {} as TestContext,
      currentNode: "FailingNode",
    });

    expect(result.outcome).toBe("FAILURE");
    expect(result.nextNode).toBe("FailingNode");
    expect(result.state.iterationOrdinalNumber).toBe(1);
    expect(result.retryDelayMs).not.toBeNull();
    expect(result.backtracked).toBe(false);
  });

  it("backtracks when retry budget is exhausted", async () => {
    const backtrackingHandler: NodeHandler<void, FailureOutput, "FailingNode", TestPorts, TestContext> = {
      name: "FailingNode",
      buildInput: () => undefined,
      async execute(): Promise<NodeExecutorResult<FailureOutput>> {
        return {
          output: { nodeExecutionOutcomeStatus: "FAILURE", marker: "failure" },
          events: [],
        };
      },
      applyOutput(prev: AgentState): AgentState {
        return prev;
      },
      onSuccess: "RecoveryNode",
      onFailure: {
        retry: { maxAttempts: 1, baseDelayMs: 100, maxDelayMs: 100 },
        backtrackTo: "RecoveryNode",
      },
    };

    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      FailingNode: backtrackingHandler,
    };

    const engine = createEngine(registry);
    const state = createState("FailingNode");

    const result = await engine.runOnce({
      state,
      nowIso: new Date().toISOString(),
      seed: 999,
      ports: {} as TestPorts,
      ctx: {} as TestContext,
      currentNode: "FailingNode",
    });

    expect(result.outcome).toBe("FAILURE");
    expect(result.nextNode).toBe("RecoveryNode");
    expect(result.backtracked).toBe(true);
    expect(result.retryDelayMs).toBeNull();
    expect(result.state.nodeName).toBe("RecoveryNode");
    expect(result.state.iterationOrdinalNumber).toBe(0);
  });
});


