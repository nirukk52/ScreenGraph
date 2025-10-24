export type EventKind =
  | "agent.run.started"
  | "agent.run.finished"
  | "agent.run.failed"
  | "agent.run.canceled"
  | "agent.run.continuation_decided"
  | "agent.node.started"
  | "agent.node.token_delta"
  | "agent.node.finished"
  | "agent.event.screenshot_captured"
  | "agent.event.ui_hierarchy_captured"
  | "agent.event.screen_perceived"
  | "agent.event.actions_enumerated"
  | "agent.event.action_selected"
  | "agent.event.action_performed"
  | "agent.event.action_verification_completed"
  | "graph.screen.discovered"
  | "graph.action.created"
  | "graph.updated"
  | "agent.run.progress_evaluated"
  | "agent.policy.switched"
  | "agent.app.restarted"
  | "agent.run.recovery_applied"
  | "agent.run.checkpoint_restored";

export interface DomainEvent {
  eventId: string;
  runId: string;
  tenantId: string;
  projectId: string;
  sequence: number;
  ts: string;
  kind: EventKind;
  version: string;
  payload: Record<string, unknown>;
  checksum: string;
}

export interface NodeEventPair {
  started: DomainEvent;
  finished: DomainEvent;
}

export function createNodeStartedEvent(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string,
  nodeName: string,
  stepOrdinal: number
): DomainEvent {
  const payload = { nodeName, stepOrdinal };
  return {
    eventId,
    runId,
    tenantId,
    projectId,
    sequence,
    ts,
    kind: "agent.node.started",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.node.started", payload),
  };
}

export function createNodeFinishedEvent(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string,
  nodeName: string,
  stepOrdinal: number,
  outcomeStatus: string
): DomainEvent {
  const payload = { nodeName, stepOrdinal, outcomeStatus };
  return {
    eventId,
    runId,
    tenantId,
    projectId,
    sequence,
    ts,
    kind: "agent.node.finished",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.node.finished", payload),
  };
}

export function createRunStartedEvent(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string
): DomainEvent {
  const payload = { startedAt: ts };
  return {
    eventId,
    runId,
    tenantId,
    projectId,
    sequence,
    ts,
    kind: "agent.run.started",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.run.started", payload),
  };
}

export function createRunFinishedEvent(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string,
  stopReason: string
): DomainEvent {
  const payload = { finishedAt: ts, stopReason };
  return {
    eventId,
    runId,
    tenantId,
    projectId,
    sequence,
    ts,
    kind: "agent.run.finished",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.run.finished", payload),
  };
}

export function createDomainEvent(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string,
  kind: EventKind,
  payload: Record<string, unknown>
): DomainEvent {
  return {
    eventId,
    runId,
    tenantId,
    projectId,
    sequence,
    ts,
    kind,
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, kind, payload),
  };
}

function computeChecksum(
  eventId: string,
  runId: string,
  sequence: number,
  kind: string,
  payload: Record<string, unknown>
): string {
  const input = `${eventId}|${runId}|${sequence}|${kind}|${JSON.stringify(payload)}`;
  return `sha256:${Buffer.from(input).toString("base64").slice(0, 16)}`;
}
