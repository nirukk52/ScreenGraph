import { api, APIError, StreamOut, Query } from "encore.dev/api";
import db from "../db";
import { RunEvent } from "./types";

interface StreamHandshake {
  id: string;
  lastEventId?: Query<number>;
}

interface RunEventMessage {
  id: number;
  type: string;
  data: any;
  timestamp: string;
}

export const stream = api.streamOut<StreamHandshake, RunEventMessage>(
  { expose: true, path: "/run/:id/stream" },
  async (handshake, stream) => {
    const runId = handshake.id;
    const lastEventId = handshake.lastEventId ?? 0;

    console.log(`[Stream] Client connected to run ${runId} stream, lastEventId: ${lastEventId}`);

    const run = await db.queryRow<{ id: string }>`
      SELECT id FROM runs WHERE id = ${runId}
    `;

    if (!run) {
      console.error(`[Stream] Run ${runId} not found`);
      throw APIError.notFound("Run not found");
    }

    try {
      console.log(`[Stream] Backfilling events from ID ${lastEventId} for run ${runId}`);
      const backfillEvents = await db.queryAll<RunEvent>`
        SELECT * FROM run_events 
        WHERE run_id = ${runId} AND id > ${lastEventId}
        ORDER BY id ASC
      `;

      console.log(`[Stream] Found ${backfillEvents.length} backfill events for run ${runId}`);
      for (const event of backfillEvents) {
        const message: RunEventMessage = {
          id: event.id,
          type: event.event_type,
          data: event.payload,
          timestamp: event.created_at.toISOString(),
        };
        console.log(`[Stream] Sending backfill event ${event.id} (${event.event_type}) to client`);
        await stream.send(message);
      }

      console.log(`[Stream] Starting live stream for run ${runId}`);
      let lastCheckedId = backfillEvents.length > 0 
        ? backfillEvents[backfillEvents.length - 1].id 
        : lastEventId;

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const newEvents = await db.queryAll<RunEvent>`
            SELECT * FROM run_events 
            WHERE run_id = ${runId} AND id > ${lastCheckedId}
            ORDER BY id ASC
          `;

          for (const event of newEvents) {
            const message: RunEventMessage = {
              id: event.id,
              type: event.event_type,
              data: event.payload,
              timestamp: event.created_at.toISOString(),
            };
            console.log(`[Stream] Sending live event ${event.id} (${event.event_type}) to client`);
            await stream.send(message);
            lastCheckedId = event.id;

            if (
              event.event_type === "RUN_COMPLETED" ||
              event.event_type === "RUN_FAILED" ||
              event.event_type === "RUN_CANCELLED"
            ) {
              console.log(`[Stream] Terminal event ${event.event_type} reached, closing stream for run ${runId}`);
              await stream.close();
              return;
            }
          }
        } catch (err) {
          console.error(`[Stream] Error polling events for run ${runId}:`, err);
          break;
        }
      }

    } catch (err) {
      console.error(`[Stream] Error in stream for run ${runId}:`, err);
      throw err;
    }
  }
);
