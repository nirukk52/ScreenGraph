import type { EventKind, EventPayloadMap } from "../agent/domain/events";

/**
 * GraphOutcomeKind enumerates the types of projection events we persist for a Perceive step.
 * PURPOSE: Avoids magic strings when recording graph persistence outcomes.
 */
export type GraphOutcomeKind = "discovered" | "mapped";

/**
 * GraphProjectionCursor represents the stored progress pointer per run for projection replay.
 * PURPOSE: Allows the projector to resume from the correct run_events sequence.
 */
export interface GraphProjectionCursor {
  runId: string;
  nextSeq: number;
}

/**
 * ParsedRunEvent is a typed view over run_events rows after JSON parsing.
 * PURPOSE: Provides kind-safe payload access inside the projector.
 */
export interface ParsedRunEvent<K extends EventKind = EventKind> {
  seq: number;
  kind: K;
  payload: EventPayloadMap[K];
  createdAtIso: string;
}

/**
 * RunMetadata captures tenant/project/app identifiers required for screen normalization.
 * PURPOSE: Supplies deterministic inputs for screen identifiers and layout hashing.
 */
export interface RunMetadata {
  tenantId: string;
  projectId: string;
  appId: string;
}

/**
 * ScreenUpsertResult communicates whether a screen row was newly inserted.
 * PURPOSE: Drives downstream outcome kind selection (discovered vs mapped).
 */
export interface ScreenUpsertResult {
  screenId: string;
  isNew: boolean;
}




