import { type AgentState, createInitialState, type Budgets } from "../domain/state";
import {
  createDomainEvent,
  createRunStartedEvent,
  createRunFinishedEvent,
  type DomainEvent,
  type EventKind,
  type EventPayloadMap,
} from "../domain/events";
import type { RunRecord, RunDbPort } from "../ports/db-ports/run-db.port";
import type { RunEventsDbPort } from "../ports/db-ports/run-events.port";
import type { AgentStateDbPort } from "../ports/db-ports/agent-state.port";
import type { RunOutboxDbPort } from "../ports/db-ports/run-outbox.port";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

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
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      runId: run.runId,
    });
    logger.info("Initialize start");
    this.cachedRun = run;
    const latestSnapshot = await this.agentStateDb.getLatestSnapshot(run.runId);
    const lastSequence = await this.eventsDb.getLastEventSequence(run.runId);

    // Ensure outbox cursor exists for this run
    await this.outboxDb.ensureOutboxCursor(run.runId);

    if (latestSnapshot) {
      this.sequenceCounter = lastSequence;
      this.seedCounter = latestSnapshot.randomSeed;
      logger.info("Initialize resume from snapshot");
      return { state: latestSnapshot, isResume: true };
    }

    const now = new Date().toISOString();
    const state = createInitialState(run.runId, budgets, now);

    const startEvent = createRunStartedEvent(
      this.generateId(),
      run.runId,
      this.nextSequence(),
      now,
    );

    await this.recordEvent(startEvent);
    await this.agentStateDb.saveSnapshot(run.runId, 0, state);

    logger.info("Initialize new run snapshot created");
    return { state, isResume: false };
  }

  async recordEvent(event: DomainEvent): Promise<void> {
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      runId: event.runId,
      eventSeq: event.sequence,
    });
    await this.eventsDb.appendEvent(event);
    logger.info(`Event recorded: ${event.kind}`);
  }

  async recordNodeEvents<K extends EventKind>(
    state: AgentState,
    nodeName: string,
    nodeEvents: Array<{ kind: K; payload: EventPayloadMap[K] }>,
  ): Promise<void> {
    const now = new Date().toISOString();
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      runId: state.runId,
      nodeName,
      stepOrdinal: state.stepOrdinal,
    });

    const startEvent = createDomainEvent(
      this.generateId(),
      state.runId,
      this.nextSequence(),
      now,
      "agent.node.started",
      { nodeName, stepOrdinal: state.stepOrdinal },
    );
    await this.recordEvent(startEvent);
    logger.info("Node started");

    for (const evt of nodeEvents) {
      const domainEvent = createDomainEvent(
        this.generateId(),
        state.runId,
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
      this.nextSequence(),
      now,
      "agent.node.finished",
      { nodeName, stepOrdinal: state.stepOrdinal, outcomeStatus: "SUCCESS" },
    );
    await this.recordEvent(finishEvent);
    logger.info("Node finished");
  }

  async finalizeRun(state: AgentState, stopReason: string): Promise<void> {
    const now = new Date().toISOString();
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      runId: state.runId,
    });

    logger.info("Starting finalizeRun", {
      runId: state.runId,
      stopReason,
      currentStatus: state.status,
    });

    try {
      logger.info("Calling updateRunStatus", {
        runId: state.runId,
        newStatus: "completed",
        now,
        stopReason,
      });

      const success = await this.runDb.updateRunStatus(state.runId, "completed", now, stopReason);

      logger.info("updateRunStatus completed", { success });

      if (!success) {
        logger.error("Failed to update run status (CAS violation)");
        throw new Error("Failed to update run status (CAS violation)");
      }

      logger.info("Creating finished event");

      const finishedEvent = createRunFinishedEvent(
        this.generateId(),
        state.runId,
        this.nextSequence(),
        now,
        stopReason,
      );

      logger.info("Recording finished event");
      await this.recordEvent(finishedEvent);
      
      logger.info("Run finalized successfully");
    } catch (err) {
      logger.error("Error in finalizeRun", {
        err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  }

  /**
   * saveSnapshot persists the given state snapshot for the current step.
   * PURPOSE: Exposes controlled persistence to the Worker after node execution.
   */
  async saveSnapshot(state: AgentState): Promise<void> {
    const logger = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.ORCHESTRATOR,
      runId: state.runId,
      stepOrdinal: state.stepOrdinal,
    });
    await this.agentStateDb.saveSnapshot(state.runId, state.stepOrdinal, state);
    logger.info("Snapshot saved", {
      snapshot: {
        runId: state.runId,
        stepOrdinal: state.stepOrdinal,
        status: state.status,
        stopReason: state.stopReason,
        counters: state.counters,
        budgets: state.budgets,
        timestamps: state.timestamps,
        randomSeed: state.randomSeed,
      },
    });
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
    log
      .with({ module: MODULES.AGENT, actor: AGENT_ACTORS.ORCHESTRATOR })
      .info("Reset orchestrator state");
  }
}
