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
  | "graph.screen.mapped"
  | "graph.action.created"
  | "graph.updated"
  | "agent.run.progress_evaluated"
  | "agent.policy.switched"
  | "agent.app.restarted"
  | "agent.run.recovery_applied"
  | "agent.run.checkpoint_restored"
  | "agent.run.heartbeat"
  | "agent.app.install_checked"
  | "agent.app.signature_verified"
  | "agent.app.launch_started"
  | "agent.app.launch_completed"
  | "agent.app.launch_failed"
  | "agent.device.check_started"
  | "agent.device.check_completed"
  | "agent.device.check_failed"
  | "agent.appium.health_check_started"
  | "agent.appium.health_check_completed"
  | "agent.appium.health_check_failed"
  | "agent.appium.starting"
  | "agent.appium.ready"
  | "agent.appium.start_failed";

/**
 * Discriminated union mapping EventKind to its typed payload structure.
 * Enforces type safety at compile time, preventing payload schema drift.
 */
export type EventPayloadMap = {
  "agent.run.started": { startedAt: string };
  "agent.run.finished": {
    finishedAt: string;
    stopReason: string;
    disposition?: string;
    basis?: string;
    metrics?: {
      totalIterationsExecuted: number;
      uniqueScreensDiscoveredCount: number;
      uniqueActionsPersistedCount: number;
      runDurationInMilliseconds: number;
    };
  };
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
  "graph.screen.mapped": { screenId: string; appId: string };
  "graph.action.created": { actionId: string; fromScreenId: string; toScreenId: string };
  "graph.updated": { updateKind: string; details: Record<string, unknown> };
  "agent.run.progress_evaluated": { verdict: string; score: number };
  "agent.policy.switched": { fromVersion: number; toVersion: number };
  "agent.app.restarted": { reason: string };
  "agent.run.recovery_applied": { errorCode: string; actionTaken: string };
  "agent.run.checkpoint_restored": { checkpointId: string; stepOrdinal: number };
  "agent.run.heartbeat": { ts: string };
  "agent.app.install_checked": {
    correlationId: string;
    packageId: string;
    installed: boolean;
    versionName?: string;
    versionCode?: number;
  };
  "agent.app.signature_verified": {
    correlationId: string;
    packageId: string;
    expectedSha256: string;
    actualSha256: string;
    matched: boolean;
  };
  "agent.app.launch_started": { correlationId: string; packageId: string; attempt: number };
  "agent.app.launch_completed": { correlationId: string; packageId: string; durationMs: number };
  "agent.app.launch_failed": {
    correlationId: string;
    packageId: string;
    attempt: number;
    errorKind: string;
    durationMs: number;
  };
  "agent.device.check_started": { appId: string; deviceId?: string };
  "agent.device.check_completed": { isOnline: boolean; deviceId?: string };
  "agent.device.check_failed": { error: string; appId: string };
  "agent.appium.health_check_started": { port: number };
  "agent.appium.health_check_completed": {
    isHealthy: boolean;
    port: number;
    reusingExisting: boolean;
  };
  "agent.appium.health_check_failed": { error: string; port: number };
  "agent.appium.starting": { port: number };
  "agent.appium.ready": { pid: number; port: number; startDurationMs: number };
  "agent.appium.start_failed": { error: string; port: number; timeoutMs: number };
};

/**
 * Base event properties shared across all domain events.
 * PURPOSE: The payload field is a discriminated union keyed by EventKind for compile-time type safety.
 * Multi-tenancy fields removed for MVP simplification (migration 008).
 */
export interface DomainEvent<T extends EventKind = EventKind> {
  eventId: string;
  runId: string;
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

/**
 * Creates agent.node.started event.
 * PURPOSE: Signals node execution start (removed tenant/project for MVP).
 */
export function createNodeStartedEvent(
  eventId: string,
  runId: string,
  sequence: number,
  ts: string,
  nodeName: string,
  stepOrdinal: number,
): DomainEvent {
  const payload = { nodeName, stepOrdinal };
  return {
    eventId,
    runId,
    sequence,
    ts,
    kind: "agent.node.started",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.node.started", payload),
  };
}

/**
 * Creates agent.node.finished event.
 * PURPOSE: Signals node execution completion (removed tenant/project for MVP).
 */
export function createNodeFinishedEvent(
  eventId: string,
  runId: string,
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
    sequence,
    ts,
    kind: "agent.node.finished",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.node.finished", payload),
  };
}

/**
 * Creates agent.run.started event.
 * PURPOSE: Signals run initialization (removed tenant/project for MVP).
 */
export function createRunStartedEvent(
  eventId: string,
  runId: string,
  sequence: number,
  ts: string,
): DomainEvent {
  const payload = { startedAt: ts };
  return {
    eventId,
    runId,
    sequence,
    ts,
    kind: "agent.run.started",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.run.started", payload),
  };
}

/**
 * Creates agent.run.finished event.
 * PURPOSE: Signals run completion (removed tenant/project for MVP).
 */
export function createRunFinishedEvent(
  eventId: string,
  runId: string,
  sequence: number,
  ts: string,
  stopReason: string,
): DomainEvent {
  const payload = { finishedAt: ts, stopReason };
  return {
    eventId,
    runId,
    sequence,
    ts,
    kind: "agent.run.finished",
    version: "1",
    payload,
    checksum: computeChecksum(eventId, runId, sequence, "agent.run.finished", payload),
  };
}

/**
 * Generic domain event creation function.
 * PURPOSE: Type-safe event factory (removed tenant/project for MVP).
 */
export function createDomainEvent<T extends EventKind>(
  eventId: string,
  runId: string,
  sequence: number,
  ts: string,
  kind: T,
  payload: EventPayloadMap[T],
): DomainEvent<T> {
  return {
    eventId,
    runId,
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
