import db from "../db";

interface RunEventRow {
  run_id: string;
  seq: number;
  type: string;
  payload: string | Record<string, unknown>;
  created_at: Date;
  published_at: Date | null;
}

let publisherRunning = false;

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
    const events = await db.queryAll<RunEventRow>`
      SELECT run_id, seq, type, payload, created_at, published_at
      FROM run_events
      WHERE published_at IS NULL
      ORDER BY run_id ASC, seq ASC
      LIMIT 200
    `;

    if (events.length === 0) {
      return;
    }

    console.log(`[OutboxPublisher] Processing ${events.length} events`);

    for (const event of events) {
      try {
        console.log(
          `[OutboxPublisher] Publishing run_event ${event.run_id}#${event.seq} (${event.type})`,
        );

        // TODO: Replace with real publish (emit to topic/websocket/etc)
        void event;

        await db.exec`
          UPDATE run_events
          SET published_at = NOW()
          WHERE run_id = ${event.run_id} AND seq = ${event.seq}
        `;

        console.log(`[OutboxPublisher] Event ${event.run_id}#${event.seq} marked published`);
      } catch (err) {
        console.error(
          `[OutboxPublisher] Failed to publish run_event ${event.run_id}#${event.seq}:`,
          err,
        );
      }
    }
  } catch (err) {
    console.error("[OutboxPublisher] Error in publishBatch:", err);
  }
}

startOutboxPublisher();
