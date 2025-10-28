import db from "../db";
import { RunOutboxRepo } from "../agent/persistence/run-outbox.repo";
import type { EventKind } from "../agent/domain/events";

interface RunEventRow {
  run_id: string;
  seq: number;
  kind: EventKind;
  payload: string | Record<string, unknown>;
  created_at: Date;
  published_at: Date | null;
}

interface OutboxCursor {
  run_id: string;
  next_seq: number;
  last_published_seq: number;
}

let publisherRunning = false;
const outboxRepo = new RunOutboxRepo();

/**
 * OutboxPublisher implements the outbox pattern for reliable event streaming.
 * It polls run_outbox cursors and publishes events from run_events in sequential order.
 */
export function startOutboxPublisher() {
  if (publisherRunning) {
    console.log("[OutboxPublisher] Already running");
    return;
  }

  publisherRunning = true;
  console.log("[OutboxPublisher] Starting with 200ms polling interval");

  setInterval(async () => {
    await publishBatch();
  }, 200);
}

async function publishBatch() {
  try {
    // Get all active outbox cursors
    const cursors = await db.queryAll<OutboxCursor>`
      SELECT run_id, next_seq, last_published_seq
      FROM run_outbox
      ORDER BY run_id ASC
      LIMIT 50
    `;

    if (cursors.length === 0) {
      return;
    }

    let totalEventsPublished = 0;

    for (const cursor of cursors) {
      // Fetch unpublihed events for this run starting from next_seq
      const events = await db.queryAll<RunEventRow>`
        SELECT run_id, seq, kind, payload, created_at, published_at
        FROM run_events
        WHERE run_id = ${cursor.run_id}
          AND seq >= ${cursor.next_seq}
          AND published_at IS NULL
        ORDER BY seq ASC
        LIMIT 100
      `;

      if (events.length === 0) {
        continue;
      }

      console.log(
        `[OutboxPublisher] Run ${cursor.run_id}: Publishing ${events.length} events (seq ${events[0].seq} to ${events[events.length - 1].seq})`,
      );

      let lastPublishedSeq = cursor.last_published_seq;

      for (const event of events) {
        try {
          console.log(`[OutboxPublisher] Publishing ${event.run_id}#${event.seq} (${event.kind})`);

          // TODO: Replace with real publish (emit to Redis topic/websocket/etc)
          // await redis.publish(`run:${event.run_id}`, JSON.stringify(event.payload));
          void event;

          // Mark event as published
          await db.exec`
            UPDATE run_events
            SET published_at = NOW()
            WHERE run_id = ${event.run_id} AND seq = ${event.seq}
          `;

          lastPublishedSeq = event.seq;
          totalEventsPublished++;
        } catch (err) {
          console.error(`[OutboxPublisher] Failed to publish ${event.run_id}#${event.seq}:`, err);
          // Stop processing this batch if we hit an error
          break;
        }
      }

      // Advance the cursor to reflect successfully published events
      if (lastPublishedSeq > cursor.last_published_seq) {
        await outboxRepo.advanceCursor(cursor.run_id, lastPublishedSeq);
        console.log(
          `[OutboxPublisher] Run ${cursor.run_id}: Cursor advanced to seq ${lastPublishedSeq}`,
        );
      }
    }

    if (totalEventsPublished > 0) {
      console.log(`[OutboxPublisher] Published ${totalEventsPublished} events total`);
    }
  } catch (err) {
    console.error("[OutboxPublisher] Error in publishBatch:", err);
  }
}

startOutboxPublisher();
