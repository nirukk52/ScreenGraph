import { APIError, type Query, StreamOut, api } from "encore.dev/api";
import log from "encore.dev/log";
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

/**
 * GraphOutcomeRow represents a row from graph_persistence_outcomes joined with screens.
 * PURPOSE: Enables querying graph projection outcomes with app_package for SSE emission.
 */
interface GraphOutcomeRow {
  source_event_seq: number;
  screen_id: string;
  app_package: string;
  upsert_kind: string;
  created_at: Date;
}

/**
 * MergedMessage represents either a run event or graph outcome ready for emission.
 * PURPOSE: Enables interleaving run events and graph outcomes by source sequence.
 */
interface MergedMessage {
  seq: number;
  kind: EventKind;
  data: Record<string, unknown>;
  timestamp: string;
  isGraphEvent: boolean;
}

/**
 * fetchGraphOutcomes queries graph_persistence_outcomes joined with screens for SSE emission.
 * PURPOSE: Retrieves graph projection outcomes with app_package for a given run and sequence range.
 */
async function fetchGraphOutcomes(runId: string, minSeq: number): Promise<GraphOutcomeRow[]> {
  const outcomes: GraphOutcomeRow[] = [];
  for await (const row of db.query<GraphOutcomeRow>`
    SELECT 
      gpo.source_event_seq,
      gpo.screen_id,
      s.app_package,
      gpo.upsert_kind,
      gpo.created_at
    FROM graph_persistence_outcomes gpo
    INNER JOIN screens s ON gpo.screen_id = s.screen_id
    WHERE gpo.run_id = ${runId} AND gpo.source_event_seq > ${minSeq}
    ORDER BY gpo.source_event_seq ASC, gpo.created_at ASC
  `) {
    outcomes.push(row);
  }
  return outcomes;
}

/**
 * convertGraphOutcomeToMessage maps a graph outcome row to a MergedMessage.
 * PURPOSE: Transforms database outcome rows into SSE-compatible graph event messages.
 */
function convertGraphOutcomeToMessage(outcome: GraphOutcomeRow): MergedMessage {
  const kind: EventKind =
    outcome.upsert_kind === "discovered" ? "graph.screen.discovered" : "graph.screen.mapped";
  return {
    seq: outcome.source_event_seq,
    kind,
    data: {
      screenId: outcome.screen_id,
      appPackage: outcome.app_package,
    },
    timestamp: outcome.created_at.toISOString(),
    isGraphEvent: true,
  };
}

/**
 * mergeAndSortEvents interleaves run events and graph outcomes by sequence number.
 * PURPOSE: Ensures deterministic ordering where run events precede graph outcomes for same seq.
 */
function mergeAndSortEvents(
  runEvents: RunEventRow[],
  graphOutcomes: GraphOutcomeRow[],
): MergedMessage[] {
  const merged: MergedMessage[] = [];

  // Convert run events to merged messages
  for (const event of runEvents) {
    merged.push({
      seq: event.seq,
      kind: event.kind,
      data: typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload,
      timestamp: event.created_at.toISOString(),
      isGraphEvent: false,
    });
  }

  // Convert graph outcomes to merged messages
  for (const outcome of graphOutcomes) {
    merged.push(convertGraphOutcomeToMessage(outcome));
  }

  // Sort by seq, then by timestamp (run events come first for same seq)
  merged.sort((a, b) => {
    if (a.seq !== b.seq) {
      return a.seq - b.seq;
    }
    // For same seq, run events come before graph events
    if (a.isGraphEvent !== b.isGraphEvent) {
      return a.isGraphEvent ? 1 : -1;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return merged;
}

export const stream = api.streamOut<StreamHandshake, RunEventMessage>(
  { expose: true, path: "/run/:id/stream" },
  async (handshake, stream) => {
    const runId = handshake.id;
    const lastEventSeq = handshake.lastEventSeq ?? 0;
    const logger = log.with({ module: "run", actor: "stream", runId });

    logger.info("Client connected to stream", { lastEventSeq });

    // Send immediate heartbeat to confirm connection
    await stream.send({
      seq: 0,
      kind: "agent.run.heartbeat",
      data: { ts: new Date().toISOString(), message: "Stream connected" },
      timestamp: new Date().toISOString(),
    });

    const run = await db.queryRow<{ run_id: string }>`
      SELECT run_id FROM runs WHERE run_id = ${runId}
    `;

    if (!run) {
      logger.error("Run not found");
      throw APIError.notFound("Run not found");
    }

    try {
      logger.info("Starting backfill", { fromSeq: lastEventSeq });

      // Fetch backfill run events
      const backfillEvents: RunEventRow[] = [];
      for await (const event of db.query<RunEventRow>`
        SELECT seq, kind, payload, created_at FROM run_events 
        WHERE run_id = ${runId} AND seq > ${lastEventSeq}
        ORDER BY seq ASC
      `) {
        backfillEvents.push(event);
      }

      // Fetch backfill graph outcomes
      const backfillGraphOutcomes = await fetchGraphOutcomes(runId, lastEventSeq);

      // Merge and sort for deterministic ordering
      const backfillMessages = mergeAndSortEvents(backfillEvents, backfillGraphOutcomes);

      logger.info("Backfill complete", {
        runEventsCount: backfillEvents.length,
        graphOutcomesCount: backfillGraphOutcomes.length,
        totalMessages: backfillMessages.length,
      });

      // Track highest sequence sent for both run events and graph outcomes
      let lastSentRunSeq = lastEventSeq;
      let lastSentGraphSeq = lastEventSeq;

      for (const message of backfillMessages) {
        const runEventMessage: RunEventMessage = {
          seq: message.seq,
          kind: message.kind,
          data: message.data,
          timestamp: message.timestamp,
        };
        logger.debug("Sending backfill event", {
          seq: message.seq,
          kind: message.kind,
          isGraphEvent: message.isGraphEvent,
        });
        await stream.send(runEventMessage);

        if (message.isGraphEvent) {
          lastSentGraphSeq = Math.max(lastSentGraphSeq, message.seq);
        } else {
          lastSentRunSeq = Math.max(lastSentRunSeq, message.seq);
        }
      }

      logger.info("Starting live stream");

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
          // Fetch new run events
          const newEvents: RunEventRow[] = [];
          for await (const event of db.query<RunEventRow>`
            SELECT seq, kind, payload, created_at FROM run_events 
            WHERE run_id = ${runId} AND seq > ${lastSentRunSeq}
            ORDER BY seq ASC
          `) {
            newEvents.push(event);
          }

          // Fetch new graph outcomes
          const newGraphOutcomes = await fetchGraphOutcomes(runId, lastSentGraphSeq);

          // Merge and sort
          const liveMessages = mergeAndSortEvents(newEvents, newGraphOutcomes);

          for (const message of liveMessages) {
            const runEventMessage: RunEventMessage = {
              seq: message.seq,
              kind: message.kind,
              data: message.data,
              timestamp: message.timestamp,
            };
            logger.debug("Sending live event", {
              seq: message.seq,
              kind: message.kind,
              isGraphEvent: message.isGraphEvent,
            });
            await stream.send(runEventMessage);

            if (message.isGraphEvent) {
              lastSentGraphSeq = Math.max(lastSentGraphSeq, message.seq);
            } else {
              lastSentRunSeq = Math.max(lastSentRunSeq, message.seq);
            }

            // Check for terminal events (only from run events)
            if (
              !message.isGraphEvent &&
              (message.kind === "agent.run.finished" ||
                message.kind === "agent.run.failed" ||
                message.kind === "agent.run.canceled")
            ) {
              logger.info("Terminal event reached, closing stream", { kind: message.kind });
              await stream.close();
              return;
            }
          }
        } catch (err) {
          logger.error("Error polling events", { err });
          break;
        }
      }
    } catch (err) {
      logger.error("Error in stream", { err });
      throw err;
    }
  },
);
