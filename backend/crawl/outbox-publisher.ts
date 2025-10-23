import db from "../db";

interface OutboxEvent {
  id: number;
  crawl_id: string;
  event_type: string;
  payload: any;
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
    const events = await db.queryAll<OutboxEvent>`
      SELECT * FROM crawl_outbox 
      WHERE published_at IS NULL 
      ORDER BY id ASC 
      LIMIT 100
    `;

    if (events.length === 0) {
      return;
    }

    console.log(`[OutboxPublisher] Processing ${events.length} events`);

    for (const event of events) {
      try {
        console.log(`[OutboxPublisher] Publishing event ${event.id} (${event.event_type}) for crawl ${event.crawl_id}`);

        await db.exec`
          UPDATE crawl_outbox 
          SET published_at = NOW() 
          WHERE id = ${event.id}
        `;

        console.log(`[OutboxPublisher] Event ${event.id} published successfully`);
      } catch (err) {
        console.error(`[OutboxPublisher] Failed to publish event ${event.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[OutboxPublisher] Error in publishBatch:", err);
  }
}

startOutboxPublisher();
