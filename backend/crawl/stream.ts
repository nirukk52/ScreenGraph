import { api, APIError, StreamOut, Query } from "encore.dev/api";
import db from "../db";
import { CrawlEvent } from "./types";

interface StreamHandshake {
  id: string;
  lastEventId?: Query<number>;
}

interface CrawlEventMessage {
  id: number;
  type: string;
  data: any;
  timestamp: string;
}

export const stream = api.streamOut<StreamHandshake, CrawlEventMessage>(
  { expose: true, path: "/crawl/:id/stream" },
  async (handshake, stream) => {
    const crawlId = handshake.id;
    const lastEventId = handshake.lastEventId ?? 0;

    console.log(`[Stream] Client connected to crawl ${crawlId} stream, lastEventId: ${lastEventId}`);

    const crawl = await db.queryRow<{ id: string }>`
      SELECT id FROM crawl_runs WHERE id = ${crawlId}
    `;

    if (!crawl) {
      console.error(`[Stream] Crawl ${crawlId} not found`);
      throw APIError.notFound("Crawl not found");
    }

    try {
      console.log(`[Stream] Backfilling events from ID ${lastEventId} for crawl ${crawlId}`);
      const backfillEvents = await db.queryAll<CrawlEvent>`
        SELECT * FROM crawl_events 
        WHERE crawl_id = ${crawlId} AND id > ${lastEventId}
        ORDER BY id ASC
      `;

      console.log(`[Stream] Found ${backfillEvents.length} backfill events for crawl ${crawlId}`);
      for (const event of backfillEvents) {
        const message: CrawlEventMessage = {
          id: event.id,
          type: event.event_type,
          data: event.payload,
          timestamp: event.created_at.toISOString(),
        };
        console.log(`[Stream] Sending backfill event ${event.id} (${event.event_type}) to client`);
        await stream.send(message);
      }

      console.log(`[Stream] Starting live stream for crawl ${crawlId}`);
      let lastCheckedId = backfillEvents.length > 0 
        ? backfillEvents[backfillEvents.length - 1].id 
        : lastEventId;

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const newEvents = await db.queryAll<CrawlEvent>`
            SELECT * FROM crawl_events 
            WHERE crawl_id = ${crawlId} AND id > ${lastCheckedId}
            ORDER BY id ASC
          `;

          for (const event of newEvents) {
            const message: CrawlEventMessage = {
              id: event.id,
              type: event.event_type,
              data: event.payload,
              timestamp: event.created_at.toISOString(),
            };
            console.log(`[Stream] Sending live event ${event.id} (${event.event_type}) to client`);
            await stream.send(message);
            lastCheckedId = event.id;

            if (
              event.event_type === "CRAWL_COMPLETED" ||
              event.event_type === "CRAWL_FAILED" ||
              event.event_type === "CRAWL_CANCELLED"
            ) {
              console.log(`[Stream] Terminal event ${event.event_type} reached, closing stream for crawl ${crawlId}`);
              await stream.close();
              return;
            }
          }
        } catch (err) {
          console.error(`[Stream] Error polling events for crawl ${crawlId}:`, err);
          break;
        }
      }

    } catch (err) {
      console.error(`[Stream] Error in stream for crawl ${crawlId}:`, err);
      throw err;
    }
  }
);
