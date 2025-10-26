import { type AgentState, createInitialState, type Budgets } from "../domain/state";
import {
  createDomainEvent,
  createRunStartedEvent,
  createRunFinishedEvent,
  type DomainEvent,
  type EventKind,
  type EventPayloadMap,
} from "../domain/events";
import type { RunRecord, RunDbPort } from "../ports/run-db.port";
import type { RunEventsDbPort } from "../ports/run-events.port";
import type { AgentStateDbPort } from "../ports/agent-state.port";
import type { RunOutboxDbPort } from "../ports/run-outbox.port";

export class Orchestrator {
  private sequenceCounter = 0;
  private seedCounter = 123456;
  private cachedRun: RunRecord | null = null;

  constructor(
    private readonly runDb: RunDbPort,
    private readonly eventsDb: RunEventsDbPort,
    private readonly agentStateDb: AgentStateDbPort,
    private readonly outboxDb: RunOutboxDbPort,
  ) {}

  async initialize(
    run: RunRecord,
    budgets: Budgets,
  ): Promise<{ state: AgentState; isResume: boolean }> {
    this.cachedRun = run;
    const latestSnapshot = await this.agentStateDb.getLatestSnapshot(run.runId);
    const lastSequence = await this.eventsDb.getLastEventSequence(run.runId);

    // Ensure outbox cursor exists for this run
    await this.outboxDb.ensureOutboxCursor(run.runId);

    if (latestSnapshot) {
      this.sequenceCounter = lastSequence;
      this.seedCounter = latestSnapshot.randomSeed;
      return { state: latestSnapshot, isResume: true };
    }

    const now = new Date().toISOString();
    const state = createInitialState(run.tenantId, run.projectId, run.runId, budgets, now);

    const startEvent = createRunStartedEvent(
      this.generateId(),
      run.runId,
      run.tenantId,
      run.projectId,
      this.nextSequence(),
      now,
    );

    await this.recordEvent(startEvent);
    await this.agentStateDb.saveSnapshot(run.runId, 0, state);

    return { state, isResume: false };
  }

  async recordEvent(event: DomainEvent): Promise<void> {
    await this.eventsDb.appendEvent(event);
  }

  async recordNodeEvents<K extends EventKind>(
    state: AgentState,
    nodeName: string,
    nodeEvents: Array<{ kind: K; payload: EventPayloadMap[K] }>,
  ): Promise<void> {
    const now = new Date().toISOString();

    const startEvent = createDomainEvent(
      this.generateId(),
      state.runId,
      state.tenantId,
      state.projectId,
      this.nextSequence(),
      now,
      "agent.node.started",
      { nodeName, stepOrdinal: state.stepOrdinal },
    );
    await this.recordEvent(startEvent);

    for (const evt of nodeEvents) {
      const domainEvent = createDomainEvent(
        this.generateId(),
        state.runId,
        state.tenantId,
        state.projectId,
        this.nextSequence(),
        now,
        evt.kind,
        evt.payload,
      );
      await this.recordEvent(domainEvent);
    }

    const finishEvent = createDomainEvent(
      this.generateId(),
      state.runId,
      state.tenantId,
      state.projectId,
      this.nextSequence(),
      now,
      "agent.node.finished",
      { nodeName, stepOrdinal: state.stepOrdinal, outcomeStatus: "SUCCESS" },
    );
    await this.recordEvent(finishEvent);
  }

  async finalizeRun(state: AgentState, stopReason: string): Promise<void> {
    const now = new Date().toISOString();

    const success = await this.runDb.updateRunStatus(state.runId, "completed", now, stopReason);

    if (!success) {
      throw new Error("Failed to update run status (CAS violation)");
    }

    const finishedEvent = createRunFinishedEvent(
      this.generateId(),
      state.runId,
      state.tenantId,
      state.projectId,
      this.nextSequence(),
      now,
      stopReason,
    );

    await this.recordEvent(finishedEvent);
  }

  nextSequence(): number {
    return ++this.sequenceCounter;
  }

  nextSeed(): number {
    this.seedCounter = (this.seedCounter * 1103515245 + 12345) & 0x7fffffff;
    return this.seedCounter;
  }

  generateId(): string {
    return `01${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  reset(): void {
    this.sequenceCounter = 0;
    this.seedCounter = 123456;
    this.cachedRun = null;
  }
}
