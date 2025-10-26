import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRepo } from "../persistence/in-memory-repo";
import { createDomainEvent } from "../domain/events";

describe("Idempotency Tests", () => {
  let repo: InMemoryRepo;

  beforeEach(async () => {
    repo = new InMemoryRepo();
    await repo.createRun(
      "01RUN00000000000000000",
      "01TENANT00000000000000",
      "01PROJECT0000000000000",
      new Date().toISOString(),
    );
  });

  it("should prevent duplicate events with same sequence", async () => {
    const event1 = createDomainEvent(
      "01EVENT000000000000001",
      "01RUN00000000000000000",
      "01TENANT00000000000000",
      "01PROJECT0000000000000",
      1,
      new Date().toISOString(),
      "agent.node.started",
      { nodeName: "Perceive" },
    );

    await repo.appendEvent(event1);
    await repo.appendEvent(event1);

    const events = await repo.getEvents("01RUN00000000000000000");
    expect(events.length).toBe(1);
  });

  it("should reject events with same sequence but different checksums", async () => {
    const ts = new Date().toISOString();

    const event1 = createDomainEvent(
      "01EVENT000000000000001",
      "01RUN00000000000000000",
      "01TENANT00000000000000",
      "01PROJECT0000000000000",
      1,
      ts,
      "agent.node.started",
      { nodeName: "Perceive" },
    );

    const event2 = createDomainEvent(
      "01EVENT000000000000002",
      "01RUN00000000000000000",
      "01TENANT00000000000000",
      "01PROJECT0000000000000",
      1,
      ts,
      "agent.node.started",
      { nodeName: "EnumerateActions" },
    );

    await repo.appendEvent(event1);

    await expect(repo.appendEvent(event2)).rejects.toThrow("Idempotency violation");
  });

  it("should allow CAS on run status only once", async () => {
    const now = new Date().toISOString();

    const success1 = await repo.updateRunStatus("01RUN00000000000000000", "completed", now);
    expect(success1).toBe(true);

    const success2 = await repo.updateRunStatus("01RUN00000000000000000", "failed", now);
    expect(success2).toBe(false);

    const run = await repo.getRun("01RUN00000000000000000");
    expect(run?.status).toBe("completed");
  });
});
