import type { DomainEvent } from "../domain/events";

/**
 * RunEventsDbPort exists to abstract durable storage of ordered domain events for a run.
 * It guarantees append-only, monotonic sequence behavior and retrieval helpers for replay.
 */
export interface RunEventsDbPort {
  /** Appends a domain event to the event log for its run. */
  appendEvent(event: DomainEvent): Promise<void>;

  /** Retrieves all events for a run ordered by sequence. */
  getEvents(runId: string): Promise<DomainEvent[]>;

  /** Returns the last (max) sequence number recorded for the run; 0 if none. */
  getLastEventSequence(runId: string): Promise<number>;
}


