import { describe, it, expect, vi } from "vitest";
import { AgentRunner } from "../engine/agent-runner";
import { NodeEngine } from "../engine/node-engine";
import type { NodeRegistry, NodeHandler, NodeExecutorResult } from "../engine/types";
import type { AgentState, Budgets } from "../domain/state";
import { createInitialState } from "../domain/state";

type TestNodeName = "NodeA" | "NodeB" | "FailingNode";
type TestPorts = Record<string, never>;
type TestContext = Record<string, never>;

interface SuccessOutput {
  nodeExecutionOutcomeStatus: "SUCCESS";
  marker: "success";
}

interface FailureOutput {
  nodeExecutionOutcomeStatus: "FAILURE";
  marker: "failure";
  retryable: boolean | null;
}

const BASE_BUDGETS: Budgets = {
  maxSteps: 10,
  maxTimeMs: 10_000,
  maxTaps: 10,
  outsideAppLimit: 5,
  restartLimit: 3,
};

/**
 * createState builds a minimal AgentState for agent runner tests.
 * PURPOSE: Ensures deterministic starting conditions without orchestrator setup.
 */
function createState(nodeName: TestNodeName, iterationOrdinalNumber = 0): AgentState {
  const base = createInitialState(
    "tenant-test",
    "project-test",
    "run-test",
    BASE_BUDGETS,
    new Date().toISOString(),
  );
  return {
    ...base,
    nodeName,
    iterationOrdinalNumber,
  };
}

/**
 * createSuccessHandler creates a handler that always succeeds.
 * PURPOSE: Provides a deterministic node for testing transitions.
 */
function createSuccessHandler(
  name: TestNodeName,
  onSuccess: TestNodeName,
): NodeHandler<never, SuccessOutput, TestNodeName, TestPorts, TestContext> {
  return {
    name,
    buildInput: () => ({}) as never,
    execute: async () => ({
      output: { nodeExecutionOutcomeStatus: "SUCCESS", marker: "success" },
      events: [],
    }),
    applyOutput: (prev) => prev,
    onSuccess,
    onFailure: { retry: { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 500 } },
  };
}

/**
 * createFailureHandler creates a handler that fails with retryable flag.
 * PURPOSE: Tests retry and backtrack behavior in AgentRunner.
 */
function createFailureHandler(
  name: TestNodeName,
  attempt: number,
  retryable: boolean,
): NodeHandler<never, FailureOutput, TestNodeName, TestPorts, TestContext> {
  return {
    name,
    buildInput: () => ({}) as never,
    execute: async () => ({
      output: { nodeExecutionOutcomeStatus: "FAILURE", marker: "failure", retryable },
      events: [],
    }),
    applyOutput: (prev) => ({ ...prev, iterationOrdinalNumber: attempt }),
    onSuccess: "NodeB",
    onFailure: {
      retry: { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 500 },
      backtrackTo: undefined,
    },
  };
}

describe("AgentRunner", () => {
  it("transitions to next node on success", async () => {
    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: createSuccessHandler("NodeA", "NodeB"),
      NodeB: createSuccessHandler("NodeB", "NodeB"),
    };
    const engine = new NodeEngine(registry);
    const runner = new AgentRunner(engine);

    const onAttempt = vi.fn();
    const onPersist = vi.fn();

    const result = await runner.run({
      state: createState("NodeA"),
      entryNode: "NodeA",
      ports: {},
      ctx: {},
      seed: () => 123,
      shouldStop: async () => ({ stop: false, reason: null }),
      callbacks: { onAttempt, onPersist },
    });

    expect(result.lastNode).toBe("NodeB");
    expect(result.status).toBe("completed");
    expect(onAttempt).toHaveBeenCalled();
    expect(onPersist).toHaveBeenCalled();
  });

  it("retries on failure when retryable is true", async () => {
    let attempt = 0;
    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: {
        name: "NodeA",
        buildInput: () => ({}) as never,
        execute: async () => {
          attempt++;
          return {
            output: {
              nodeExecutionOutcomeStatus: attempt < 2 ? "FAILURE" : "SUCCESS",
              marker: attempt < 2 ? "failure" : "success",
              retryable: true,
            },
            events: [],
          };
        },
        applyOutput: (prev) => ({ ...prev, iterationOrdinalNumber: attempt }),
        onSuccess: "NodeB",
        onFailure: { retry: { maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 200 } },
      },
    };
    const engine = new NodeEngine(registry);
    const runner = new AgentRunner(engine);

    const result = await runner.run({
      state: createState("NodeA"),
      entryNode: "NodeA",
      ports: {},
      ctx: {},
      seed: () => 123,
      shouldStop: async () => ({ stop: false, reason: null }),
      callbacks: {
        onAttempt: async () => {},
        onPersist: async () => {},
      },
    });

    expect(attempt).toBe(2);
    expect(result.lastNode).toBe("NodeA");
    expect(result.status).toBe("completed");
  });

  it("stops on non-retryable failure", async () => {
    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: createFailureHandler("NodeA", 1, false),
    };
    const engine = new NodeEngine(registry);
    const runner = new AgentRunner(engine);

    const result = await runner.run({
      state: createState("NodeA"),
      entryNode: "NodeA",
      ports: {},
      ctx: {},
      seed: () => 123,
      shouldStop: async () => ({ stop: false, reason: null }),
      callbacks: {
        onAttempt: async () => {},
        onPersist: async () => {},
      },
    });

    expect(result.status).toBe("failed");
    expect(result.stopReason).toBe("crash");
  });

  it("honors shouldStop callback for cancellation", async () => {
    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: createSuccessHandler("NodeA", "NodeB"),
    };
    const engine = new NodeEngine(registry);
    const runner = new AgentRunner(engine);

    const result = await runner.run({
      state: createState("NodeA"),
      entryNode: "NodeA",
      ports: {},
      ctx: {},
      seed: () => 123,
      shouldStop: async () => ({ stop: true, reason: "user_cancelled" }),
      callbacks: {
        onAttempt: async () => {},
        onPersist: async () => {},
      },
    });

    expect(result.status).toBe("canceled");
    expect(result.stopReason).toBe("user_cancelled");
  });

  it("honors shouldStop callback for budget exhaustion", async () => {
    const registry: NodeRegistry<TestNodeName, TestPorts, TestContext> = {
      NodeA: createSuccessHandler("NodeA", "NodeB"),
    };
    const engine = new NodeEngine(registry);
    const runner = new AgentRunner(engine);

    const result = await runner.run({
      state: createState("NodeA"),
      entryNode: "NodeA",
      ports: {},
      ctx: {},
      seed: () => 123,
      shouldStop: async () => ({ stop: true, reason: "budget_exhausted" }),
      callbacks: {
        onAttempt: async () => {},
        onPersist: async () => {},
      },
    });

    expect(result.status).toBe("failed");
    expect(result.stopReason).toBe("budget_exhausted");
  });
});
