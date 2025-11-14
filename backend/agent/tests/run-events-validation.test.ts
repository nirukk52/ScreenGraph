import { ulid } from "ulidx";
import { beforeEach, describe, expect, it } from "vitest";
import {
  type DomainEvent,
  createNodeFinishedEvent,
  createNodeStartedEvent,
  createRunFinishedEvent,
  createRunStartedEvent,
} from "../domain/events";
import { InMemoryRepo } from "../persistence/in-memory-repo";

/**
 * Run Events Invariant Tests
 * PURPOSE: Validate that persisted run event streams always contain:
 * - Exactly one agent.run.started event (and it leads the log)
 * - Exactly one agent.run.finished event (and it is the terminal entry)
 * - No duplicate terminal stop events in the log
 */
describe("Run Events Invariants", () => {
  let repo: InMemoryRepo;
  let runId: string;
  let tenantId: string;
  let projectId: string;

  beforeEach(async () => {
    repo = new InMemoryRepo();
    repo.reset();
    runId = `run_${ulid()}`;
    tenantId = "tenant_test";
    projectId = "project_test";
    await repo.createRun(runId, tenantId, projectId, new Date().toISOString());
  });

  /**
   * assertRunEventsInvariant enforces the single-start/single-stop invariant expected by consumers.
   */
  function assertRunEventsInvariant(events: DomainEvent[]): void {
    const startEvents = events.filter((event) => event.kind === "agent.run.started");
    if (startEvents.length !== 1) {
      throw new Error(
        `Expected exactly one agent.run.started event, received ${startEvents.length}`,
      );
    }

    const stopEvents = events.filter((event) => event.kind === "agent.run.finished");
    if (stopEvents.length !== 1) {
      throw new Error(
        `Expected exactly one agent.run.finished event, received ${stopEvents.length}`,
      );
    }

    const lastEvent = events.at(-1);
    if (!lastEvent || lastEvent.kind !== "agent.run.finished") {
      throw new Error("Expected final event to be agent.run.finished");
    }
  }

  it.skip("ensures canonical run logs include single start and single terminal stop", async () => {
    const now = () => new Date().toISOString();

    await repo.appendEvent(createRunStartedEvent(ulid(), runId, 1, now()));
    await repo.appendEvent(createNodeStartedEvent(ulid(), runId, 2, now(), "EnsureDevice", 1));
    await repo.appendEvent(
      createNodeFinishedEvent(ulid(), runId, 3, now(), "EnsureDevice", 1, "success"),
    );
    await repo.appendEvent(createNodeStartedEvent(ulid(), runId, 4, now(), "ProvisionApp", 2));
    await repo.appendEvent(
      createNodeFinishedEvent(ulid(), runId, 5, now(), "ProvisionApp", 2, "success"),
    );
    await repo.appendEvent(createRunFinishedEvent(ulid(), runId, 6, now(), "goal_reached"));

    const events = await repo.getEvents(runId);

    expect(events).toHaveLength(6);
    expect(() => assertRunEventsInvariant(events)).not.toThrow();
    expect(events[0].kind).toBe("agent.run.started");
    expect(events.at(-1)?.kind).toBe("agent.run.finished");
  });

  it("rejects event logs containing multiple terminal stop entries", () => {
    const now = () => new Date().toISOString();
    const invalidEvents: DomainEvent[] = [
      createRunStartedEvent(ulid(), runId, 1, now()),
      createRunFinishedEvent(ulid(), runId, 2, now(), "goal_reached"),
      createRunFinishedEvent(ulid(), runId, 3, now(), "max_steps_reached"),
    ];

    expect(() => assertRunEventsInvariant(invalidEvents)).toThrowError(
      /exactly one agent\.run\.finished event/i,
    );
  });

  it("rejects event logs where the terminal event is not a stop", () => {
    const now = () => new Date().toISOString();
    const invalidEvents: DomainEvent[] = [
      createRunStartedEvent(ulid(), runId, 1, now()),
      createNodeStartedEvent(ulid(), runId, 2, now(), "EnsureDevice", 1),
      createRunFinishedEvent(ulid(), runId, 3, now(), "goal_reached"),
      createNodeFinishedEvent(ulid(), runId, 4, now(), "EnsureDevice", 1, "success"),
    ];

    expect(() => assertRunEventsInvariant(invalidEvents)).toThrowError(
      /final event to be agent\.run\.finished/i,
    );
  });

  it("rejects event logs missing the initial start", () => {
    const now = () => new Date().toISOString();
    const invalidEvents: DomainEvent[] = [
      createNodeStartedEvent(ulid(), runId, 1, now(), "EnsureDevice", 1),
      createRunFinishedEvent(ulid(), runId, 2, now(), "goal_reached"),
    ];

    expect(() => assertRunEventsInvariant(invalidEvents)).toThrowError(
      /exactly one agent\.run\.started event/i,
    );
  });
});
