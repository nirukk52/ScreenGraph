import db from "../../db";
import type { RunOutboxDbPort } from "../ports/db-ports/run-outbox.port";

/**
 * RunOutboxRepo implements RunOutboxDbPort using the run_outbox cursor table.
 * It manages per-run publishing cursors (next_seq, last_published_seq) for reliable event streaming.
 */
export class RunOutboxRepo implements RunOutboxDbPort {
  async ensureOutboxCursor(runId: string): Promise<void> {
    await db.exec`
      INSERT INTO run_outbox (run_id, next_seq, last_published_seq, updated_at)
      VALUES (${runId}, 1, 0, NOW())
      ON CONFLICT (run_id) DO NOTHING
    `;
  }

  async getCursor(runId: string): Promise<{ nextSeq: number; lastPublishedSeq: number } | null> {
    const row = await db.queryRow<{
      next_seq: number;
      last_published_seq: number;
    }>`
      SELECT next_seq, last_published_seq
      FROM run_outbox
      WHERE run_id = ${runId}
    `;

    if (!row) {
      return null;
    }

    return {
      nextSeq: row.next_seq,
      lastPublishedSeq: row.last_published_seq,
    };
  }

  async advanceCursor(runId: string, publishedSeq: number): Promise<void> {
    await db.exec`
      UPDATE run_outbox
      SET last_published_seq = ${publishedSeq},
          next_seq = ${publishedSeq + 1},
          updated_at = NOW()
      WHERE run_id = ${runId}
    `;
  }
}
