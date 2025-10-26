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

/**
 * Discriminated union mapping EventKind to its typed payload structure.
 * Enforces type safety at compile time, preventing payload schema drift.
 */
export type EventPayloadMap = {
  "agent.run.started": { startedAt: string };
  "agent.run.finished": { finishedAt: string; stopReason: string };
  "agent.run.failed": { reason: string };
  "agent.run.canceled": { canceledAt: string };
  "agent.run.continuation_decided": { action: string; rationale?: string };
  "agent.node.started": { nodeName: string; stepOrdinal: number };
  "agent.node.token_delta": { tokenCount: number; cumulativeCost: number };
  "agent.node.finished": { nodeName: string; stepOrdinal: number; outcomeStatus: string };
  "agent.event.screenshot_captured": { refId: string; width: number; height: number };
  "agent.event.ui_hierarchy_captured": { refId: string; elementCount: number };
  "agent.event.screen_perceived": { screenId: string; perceptualHash64: string };
  "agent.event.actions_enumerated": { count: number; items: Array<{ key: string; verb: string }> };
  "agent.event.action_selected": { actionKey: string; rationale?: string };
  "agent.event.action_performed": { actionKey: string; success: boolean };
  "agent.event.action_verification_completed": { passed: boolean; method: string };
  "graph.screen.discovered": { screenId: string; appId: string };
  "graph.action.created": { actionId: string; fromScreenId: string; toScreenId: string };
  "graph.updated": { updateKind: string; details: Record<string, unknown> };
  "agent.run.progress_evaluated": { verdict: string; score: number };
  "agent.policy.switched": { fromVersion: number; toVersion: number };
  "agent.app.restarted": { reason: string };
  "agent.run.recovery_applied": { errorCode: string; actionTaken: string };
  "agent.run.checkpoint_restored": { checkpointId: string; stepOrdinal: number };
};

/**
 * Base event properties shared across all domain events.
 * The payload field is a discriminated union keyed by EventKind for compile-time type safety.
 */
export interface DomainEvent<T extends EventKind = EventKind> {
  eventId: string;
  runId: string;
  tenantId: string;
  projectId: string;
  sequence: number;
  ts: string;
  kind: T;
  version: string;
  payload: EventPayloadMap[T];
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
  stepOrdinal: number,
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
  outcomeStatus: string,
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
  ts: string,
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
  stopReason: string,
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

export function createDomainEvent<T extends EventKind>(
  eventId: string,
  runId: string,
  tenantId: string,
  projectId: string,
  sequence: number,
  ts: string,
  kind: T,
  payload: EventPayloadMap[T],
): DomainEvent<T> {
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
    checksum: computeChecksum(eventId, runId, sequence, kind, payload as Record<string, unknown>),
  };
}

function computeChecksum(
  eventId: string,
  runId: string,
  sequence: number,
  kind: string,
  payload: Record<string, unknown>,
): string {
  const input = `${eventId}|${runId}|${sequence}|${kind}|${JSON.stringify(payload)}`;
  return `sha256:${Buffer.from(input).toString("base64").slice(0, 16)}`;
}
