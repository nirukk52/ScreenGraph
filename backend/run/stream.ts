import { api, APIError, StreamOut, type Query } from "encore.dev/api";
import type { EventKind } from "../agent/domain/events";
import db from "../db";

interface StreamHandshake {
  id: string;
  lastEventSeq?: Query<number>;
}

interface RunEventMessage {
  seq: number;
  kind: EventKind;
  data: Record<string, unknown>;
  timestamp: string;
}

interface RunEventRow {
  seq: number;
  kind: EventKind;
  payload: string;
  created_at: Date;
}

export const stream = api.streamOut<StreamHandshake, RunEventMessage>(
  { expose: true, path: "/run/:id/stream" },
  async (handshake, stream) => {
    const runId = handshake.id;
    const lastEventSeq = handshake.lastEventSeq ?? 0;

    console.log(`[Stream] Client connected to run ${runId} stream, lastEventSeq: ${lastEventSeq}`);

    const run = await db.queryRow<{ run_id: string }>`
      SELECT run_id FROM runs WHERE run_id = ${runId}
    `;

    if (!run) {
      console.error(`[Stream] Run ${runId} not found`);
      throw APIError.notFound("Run not found");
    }

    try {
      console.log(`[Stream] Backfilling events from seq ${lastEventSeq} for run ${runId}`);

      const backfillEvents: RunEventRow[] = [];
      for await (const event of db.query<RunEventRow>`
        SELECT seq, kind, payload, created_at FROM run_events 
        WHERE run_id = ${runId} AND seq > ${lastEventSeq}
        ORDER BY seq ASC
      `) {
        backfillEvents.push(event);
      }

      console.log(`[Stream] Found ${backfillEvents.length} backfill events for run ${runId}`);
      for (const event of backfillEvents) {
        const message: RunEventMessage = {
          seq: event.seq,
          kind: event.kind,
          data: typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload,
          timestamp: event.created_at.toISOString(),
        };
        console.log(`[Stream] Sending backfill event ${event.seq} (${event.kind}) to client`);
        await stream.send(message);
      }

      console.log(`[Stream] Starting live stream for run ${runId}`);
      let lastCheckedSeq =
        backfillEvents.length > 0 ? backfillEvents[backfillEvents.length - 1].seq : lastEventSeq;

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
          const newEvents: RunEventRow[] = [];
          for await (const event of db.query<RunEventRow>`
            SELECT seq, kind, payload, created_at FROM run_events 
            WHERE run_id = ${runId} AND seq > ${lastCheckedSeq}
            ORDER BY seq ASC
          `) {
            newEvents.push(event);
          }

          for (const event of newEvents) {
            const message: RunEventMessage = {
              seq: event.seq,
              kind: event.kind,
              data: typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload,
              timestamp: event.created_at.toISOString(),
            };
            console.log(`[Stream] Sending live event ${event.seq} (${event.kind}) to client`);
            await stream.send(message);
            lastCheckedSeq = event.seq;

            if (
              event.kind === "agent.run.finished" ||
              event.kind === "agent.run.failed" ||
              event.kind === "agent.run.canceled"
            ) {
              console.log(
                `[Stream] Terminal event ${event.kind} reached, closing stream for run ${runId}`,
              );
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
  },
);
