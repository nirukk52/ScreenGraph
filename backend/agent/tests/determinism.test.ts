import { describe, it, expect, beforeEach } from "vitest";
import { Orchestrator } from "../orchestrator/orchestrator";
import { InMemoryRepo } from "../persistence/in-memory-repo";
import { Budgets } from "../domain/state";

describe("Determinism Tests", () => {
  let repo: InMemoryRepo;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    repo = new InMemoryRepo();
    orchestrator = new Orchestrator(repo);
  });

  it("should generate monotonic sequences", () => {
    const seq1 = orchestrator.nextSequence();
    const seq2 = orchestrator.nextSequence();
    const seq3 = orchestrator.nextSequence();

    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
    expect(seq3).toBe(3);
  });

  it("should generate deterministic seeds", () => {
    orchestrator.reset();
    const seed1 = orchestrator.nextSeed();

    orchestrator.reset();
    const seed2 = orchestrator.nextSeed();

    expect(seed1).toBe(seed2);
  });

  it("should create runs with valid initial state", async () => {
    const budgets: Budgets = {
      maxSteps: 50,
      maxTimeMs: 300000,
      maxTaps: 100,
      outsideAppLimit: 3,
      restartLimit: 2,
    };

    const state = await orchestrator.createRun(
      "01TENANT00000000000000",
      "01PROJECT0000000000000",
      "01RUN00000000000000000",
      budgets,
    );

    expect(state.runId).toBe("01RUN00000000000000000");
    expect(state.status).toBe("running");
    expect(state.counters.stepsTotal).toBe(0);
    expect(state.budgets.maxSteps).toBe(50);
  });
});
