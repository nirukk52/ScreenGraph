import log from "encore.dev/log";

/**
 * LogContext defines standard fields to correlate logs across runs and workers.
 * PURPOSE: Provides a typed, shared shape for structured logging in the backend.
 *
 * Modules represent high-level subsystems:
 * - "run": Run API endpoints and lifecycle management
 * - "agent": Agent orchestration, worker, and subscription logic
 * - "db": Database operations and repositories
 * - "pubsub": Pub/Sub message handling
 *
 * Actors represent specific sub-components within a module:
 * - In "run": "start", "stream", "health", "cancel"
 * - In "agent": "orchestrator", "worker", "subscription"
 * - In "db": "run-db", "events-db", "state-db", "outbox"
 */
export interface LogContext {
  module: string;
  actor: string;
  runId?: string;
  workerId?: string;
  nodeName?: string;
  stepOrdinal?: number;
  eventSeq?: number;
  retryAttempt?: number;
  retryDelayMs?: number;
}

/**
 * loggerWith returns a logger enriched with the provided context fields.
 * PURPOSE: Centralizes creation of contextual loggers to ensure consistent fields.
 */
export function loggerWith(context: LogContext) {
  return log.with(context as Record<string, unknown>);
}

/**
 * Common module names used throughout the codebase.
 * PURPOSE: Prevents typos and ensures consistent module identification.
 */
export const MODULES = {
  RUN: "run",
  AGENT: "agent",
  DB: "db",
  PUBSUB: "pubsub",
  API: "api",
} as const;

/**
 * Common actor names for agent module.
 * PURPOSE: Ensures consistent actor identification in agent-related logs.
 */
export const AGENT_ACTORS = {
  ORCHESTRATOR: "orchestrator",
  WORKER: "worker",
  SUBSCRIPTION: "subscription",
} as const;

/**
 * Common actor names for run module.
 * PURPOSE: Ensures consistent actor identification in run-related logs.
 */
export const RUN_ACTORS = {
  START: "start",
  STREAM: "stream",
  CANCEL: "cancel",
  HEALTH: "health",
  OUTBOX_PUBLISHER: "outbox-publisher",
} as const;
