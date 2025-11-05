import db from "../db";
import type { EventKind } from "../agent/domain/events";
import type {
  GraphOutcomeKind,
  GraphProjectionCursor,
  ParsedRunEvent,
  RunMetadata,
  ScreenUpsertResult,
} from "./types";

/**
 * GraphProjectionRepo provides typed database helpers for the graph projector.
 * PURPOSE: Encapsulates SQL so the projector loop can remain focused on event logic.
 */
export class GraphProjectionRepo {
  /**
   * hydrateMissingCursors ensures every run with events owns a cursor entry.
   * PURPOSE: Guards against projector starvation when new runs begin emitting events.
   */
  async hydrateMissingCursors(limit: number): Promise<void> {
    await db.exec`
      INSERT INTO graph_projection_cursors (run_id, next_seq, updated_at)
      SELECT DISTINCT re.run_id, 1, NOW()
      FROM run_events re
      WHERE NOT EXISTS (
        SELECT 1 FROM graph_projection_cursors gpc WHERE gpc.run_id = re.run_id
      )
      ORDER BY re.run_id
      LIMIT ${limit}
    `;
  }

  /**
   * listCursors returns active cursor rows ordered by least recently updated.
   * PURPOSE: Enables a fair polling schedule across concurrent runs.
   */
  async listCursors(limit: number): Promise<GraphProjectionCursor[]> {
    const rows = await db.queryAll<{ run_id: string; next_seq: number }>`
      SELECT run_id, next_seq
      FROM graph_projection_cursors
      ORDER BY updated_at ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({ runId: row.run_id, nextSeq: row.next_seq }));
  }

  /**
   * fetchEvents loads run_events rows at or after the provided sequence pointer.
   * PURPOSE: Supplies ordered batches for projection replays.
   */
  async fetchEvents(runId: string, fromSeq: number, limit: number): Promise<ParsedRunEvent[]> {
    const events: ParsedRunEvent[] = [];

    for await (const row of db.query<{
      seq: number;
      kind: EventKind;
      payload: unknown;
      created_at: string;
    }>`
      SELECT seq, kind, payload, created_at
      FROM run_events
      WHERE run_id = ${runId} AND seq >= ${fromSeq}
      ORDER BY seq ASC
      LIMIT ${limit}
    `) {
      events.push({
        seq: row.seq,
        kind: row.kind,
        payload: (typeof row.payload === "string"
          ? JSON.parse(row.payload)
          : row.payload) as ParsedRunEvent["payload"],
        createdAtIso: row.created_at,
      });
    }

    return events;
  }

  /**
   * fetchRunMetadata resolves app package for hashing and screen deduplication.
   * PURPOSE: Deduplicates screens per app and ensures deterministic IDs.
   */
  async fetchRunMetadata(runId: string): Promise<RunMetadata | null> {
    const runRow = await db.queryRow<{
      app_package: string;
    }>`
      SELECT app_package
      FROM runs
      WHERE run_id = ${runId}
    `;

    if (!runRow) {
      return null;
    }

    return {
      appPackage: runRow.app_package,
    };
  }

  /**
   * upsertScreen inserts or updates a screen row keyed by deterministic screenId.
   * PURPOSE: Maintains last_seen timestamp and signals caller about new discoveries.
   */
  async upsertScreen(
    screenId: string,
    metadata: RunMetadata,
    layoutHash: string,
    perceptualHash: string,
  ): Promise<ScreenUpsertResult> {
    const existing = await db.queryRow<{ screen_id: string }>`
      SELECT screen_id
      FROM screens
      WHERE screen_id = ${screenId}
    `;

    if (!existing) {
      await db.exec`
        INSERT INTO screens (
          screen_id,
          app_package,
          layout_hash,
          perceptual_hash,
          first_seen_at,
          last_seen_at
        )
        VALUES (
          ${screenId},
          ${metadata.appPackage},
          ${layoutHash},
          ${perceptualHash},
          NOW(),
          NOW()
        )
      `;

      return { screenId, isNew: true };
    }

    await db.exec`
      UPDATE screens
      SET
        layout_hash = ${layoutHash},
        perceptual_hash = ${perceptualHash},
        last_seen_at = NOW()
      WHERE screen_id = ${screenId}
    `;

    return { screenId, isNew: false };
  }

  /**
   * recordOutcome upserts the per-step projection status in graph_persistence_outcomes.
   * PURPOSE: Captures whether a screen was discovered or matched for SSE consumption.
   */
  async recordOutcome(
    outcomeId: string,
    runId: string,
    stepOrdinal: number,
    screenId: string,
    outcomeKind: GraphOutcomeKind,
    sourceEventSeq: number,
  ): Promise<void> {
    await db.exec`
      INSERT INTO graph_persistence_outcomes (
        outcome_id,
        run_id,
        step_ordinal,
        screen_id,
        action_id,
        edge_id,
        upsert_kind,
        source_event_seq
      )
      VALUES (
        ${outcomeId},
        ${runId},
        ${stepOrdinal},
        ${screenId},
        NULL,
        NULL,
        ${outcomeKind},
        ${sourceEventSeq}
      )
      ON CONFLICT (run_id, step_ordinal) DO UPDATE
      SET
        screen_id = EXCLUDED.screen_id,
        upsert_kind = EXCLUDED.upsert_kind,
        source_event_seq = EXCLUDED.source_event_seq
    `;
  }

  /**
   * advanceCursor updates the stored sequence pointer after successful processing.
   * PURPOSE: Prevents reprocessing already-projected events while tracking activity time.
   */
  async advanceCursor(runId: string, nextSeq: number): Promise<void> {
    await db.exec`
      UPDATE graph_projection_cursors
      SET next_seq = ${nextSeq}, updated_at = NOW()
      WHERE run_id = ${runId}
    `;
  }

  /**
   * resetCursor rewinds projection progress for a run (unused in iteration 1 but handy for ops).
   * PURPOSE: Supports manual replays without direct SQL access.
   */
  async resetCursor(runId: string): Promise<void> {
    await db.exec`
      UPDATE graph_projection_cursors
      SET next_seq = 1, updated_at = NOW()
      WHERE run_id = ${runId}
    `;
  }
}

/**
 * buildOutcomeId generates a deterministic identifier for projection outcomes.
 * PURPOSE: Allows idempotent replays without relying on auto-generated IDs.
 */
export function buildOutcomeId(runId: string, stepOrdinal: number): string {
  return `${runId}-${stepOrdinal.toString().padStart(6, "0")}`;
}


