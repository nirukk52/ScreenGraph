import { AgentState, createInitialState, Budgets, RunStatus } from "../domain/state";
import {
  createDomainEvent,
  createRunStartedEvent,
  createRunFinishedEvent,
  DomainEvent,
  EventKind,
} from "../domain/events";
import { RepoPort } from "../ports/repo.port";
import { Outbox } from "./outbox";

export class Orchestrator {
  private sequenceCounter = 0;
  private outbox = new Outbox();
  private seedCounter = 123456;

  constructor(private repo: RepoPort) {}

  async createRun(
    tenantId: string,
    projectId: string,
    runId: string,
    budgets: Budgets,
  ): Promise<AgentState> {
    const now = new Date().toISOString();
    await this.repo.createRun(runId, tenantId, projectId, now);

    const state = createInitialState(tenantId, projectId, runId, budgets, now);

    const startEvent = createRunStartedEvent(
      this.generateId(),
      runId,
      tenantId,
      projectId,
      this.nextSequence(),
      now,
    );

    await this.recordEvent(startEvent);
    await this.repo.saveSnapshot(runId, 0, state);

    return state;
  }

  async recordEvent(event: DomainEvent): Promise<void> {
    await this.repo.appendEvent(event);
    this.outbox.enqueue(event);
  }

  async recordNodeEvents(
    state: AgentState,
    nodeName: string,
    nodeEvents: Array<{ kind: EventKind; payload: Record<string, unknown> }>,
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

    const success = await this.repo.updateRunStatus(state.runId, "completed" as RunStatus, now);

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

  publishEvents(): DomainEvent[] {
    return this.outbox.publishAll();
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
    this.outbox.reset();
    this.seedCounter = 123456;
  }
}
