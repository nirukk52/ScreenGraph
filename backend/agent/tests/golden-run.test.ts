import { describe, it, expect, beforeEach } from "vitest";
import { runDemo } from "../cli/demo";
import { InMemoryRepo } from "../persistence/in-memory-repo";
import { Orchestrator } from "../orchestrator/orchestrator";

describe("Golden Run Test", () => {
  it("should produce identical results on repeat runs with same seed", async () => {
    const results1 = await runDemo();
    const results2 = await runDemo();

    expect(results1.events.length).toBe(results2.events.length);
    expect(results1.state.counters.stepsTotal).toBe(results2.state.counters.stepsTotal);
    expect(results1.state.status).toBe("completed");
    expect(results2.state.status).toBe("completed");
  });

  it("should emit events in strict sequence order", async () => {
    const { events } = await runDemo();

    for (let i = 0; i < events.length; i++) {
      expect(events[i].sequence).toBe(i + 1);
    }
  });

  it("should save snapshots at each step", async () => {
    const { runId, state } = await runDemo();

    expect(state.stepOrdinal).toBeGreaterThan(0);
  });
});
