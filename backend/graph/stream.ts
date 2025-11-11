import { APIError, type Query, StreamOut, api } from "encore.dev/api";
import log from "encore.dev/log";
import { artifactsBucket } from "../artifacts/bucket";
import db from "../db";

/**
 * RUN_ENDED_STATUSES enumerates terminal run statuses.
 * PURPOSE: Avoid magic strings when checking if a run has ended.
 */
const RUN_ENDED_STATUSES = ["completed", "failed", "canceled"] as const;

/**
 * GraphStreamEventType enumerates the graph event types emitted over SSE.
 * PURPOSE: Type-safe literal union for graph stream events; no magic strings.
 */
type GraphStreamEventType = "graph.screen.discovered" | "graph.screen.mapped";

/**
 * ScreenshotData contains optional screenshot metadata and inline data URL.
 * PURPOSE: Provides frontend with immediate visual reference for each screen node.
 */
interface ScreenshotData {
  refId: string | null;
  dataUrl: string | null;
  width?: number;
  height?: number;
}

/**
 * GraphStreamEventData is the payload for each graph event.
 * PURPOSE: Structured data for graph SSE emissions; includes screenshot inline.
 */
interface GraphStreamEventData {
  runId: string;
  screenId: string;
  layoutHash: string;
  perceptualHash: string;
  seqRef: number;
  ts: string;
  screenshot: ScreenshotData;
}

/**
 * GraphStreamEvent is the SSE message envelope emitted to clients.
 * PURPOSE: Top-level typed contract for graph stream emissions.
 */
interface GraphStreamEvent {
  type: GraphStreamEventType;
  data: GraphStreamEventData;
}

/**
 * StreamHandshake defines path and query parameters for the graph stream endpoint.
 * PURPOSE: Typed request contract for SSE initiation.
 * Note: Path parameter :runId is automatically extracted by Encore.
 */
interface StreamHandshake {
  runId: string;
  replay?: Query<boolean>;
  fromSeq?: Query<number>;
}

/**
 * GraphOutcomeRow represents a joined row from graph_persistence_outcomes + screens.
 * PURPOSE: Database query result type for outcome projection data.
 */
interface GraphOutcomeRow {
  source_event_seq: number;
  screen_id: string;
  upsert_kind: string;
  created_at: Date;
  layout_hash: string;
  perceptual_hash: string;
}

/**
 * ScreenshotEventPayload is the typed payload from agent.event.screenshot_captured.
 * PURPOSE: Parse screenshot event payloads to retrieve artifact refs.
 */
interface ScreenshotEventPayload {
  refId: string;
  width?: number;
  height?: number;
}

/**
 * fetchGraphOutcomes queries graph_persistence_outcomes for a run starting from a sequence.
 * PURPOSE: Retrieve graph projection outcomes with screen metadata for SSE emission.
 */
async function fetchGraphOutcomes(runId: string, fromSeq: number): Promise<GraphOutcomeRow[]> {
  const outcomes: GraphOutcomeRow[] = [];
  for await (const row of db.query<GraphOutcomeRow>`
    SELECT 
      gpo.source_event_seq,
      gpo.screen_id,
      gpo.upsert_kind,
      gpo.created_at,
      s.layout_hash,
      s.perceptual_hash
    FROM graph_persistence_outcomes gpo
    INNER JOIN screens s ON gpo.screen_id = s.screen_id
    WHERE gpo.run_id = ${runId} AND gpo.source_event_seq > ${fromSeq}
    ORDER BY gpo.source_event_seq ASC, gpo.created_at ASC
  `) {
    outcomes.push(row);
  }
  return outcomes;
}

/**
 * fetchNearestScreenshot finds the most recent screenshot event before or at a given sequence.
 * PURPOSE: Correlate graph outcomes with their corresponding screenshot artifacts.
 */
async function fetchNearestScreenshot(
  runId: string,
  upToSeq: number,
): Promise<ScreenshotEventPayload | null> {
  const row = await db.queryRow<{ payload: string }>`
    SELECT payload
    FROM run_events
    WHERE run_id = ${runId} 
      AND kind = 'agent.event.screenshot_captured' 
      AND seq <= ${upToSeq}
    ORDER BY seq DESC
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  return payload as ScreenshotEventPayload;
}

/**
 * fetchScreenshotDataUrl downloads a screenshot artifact and converts to data URL.
 * PURPOSE: Provide inline base64-encoded image for immediate frontend rendering.
 */
async function fetchScreenshotDataUrl(
  refId: string,
  logger: ReturnType<typeof log.with>,
): Promise<string | null> {
  try {
    const buffer = await artifactsBucket.download(refId);

    // Infer MIME type from refId extension
    const mime = refId.endsWith(".jpg") || refId.endsWith(".jpeg") ? "image/jpeg" : "image/png";

    const base64 = buffer.toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    logger.warn("Failed to fetch screenshot artifact", { refId, err });
    return null;
  }
}

/**
 * buildScreenshotData constructs ScreenshotData with optional inline data URL.
 * PURPOSE: Encapsulate screenshot fetching and data URL generation logic.
 */
async function buildScreenshotData(
  runId: string,
  upToSeq: number,
  logger: ReturnType<typeof log.with>,
): Promise<ScreenshotData> {
  const screenshotPayload = await fetchNearestScreenshot(runId, upToSeq);

  if (!screenshotPayload) {
    return { refId: null, dataUrl: null };
  }

  const dataUrl = await fetchScreenshotDataUrl(screenshotPayload.refId, logger);

  return {
    refId: screenshotPayload.refId,
    dataUrl,
    width: screenshotPayload.width,
    height: screenshotPayload.height,
  };
}

/**
 * convertOutcomeToEvent maps a graph outcome row to a typed GraphStreamEvent.
 * PURPOSE: Transform database rows into SSE-compatible event messages.
 */
async function convertOutcomeToEvent(
  outcome: GraphOutcomeRow,
  runId: string,
  logger: ReturnType<typeof log.with>,
): Promise<GraphStreamEvent> {
  const type: GraphStreamEventType =
    outcome.upsert_kind === "discovered" ? "graph.screen.discovered" : "graph.screen.mapped";

  const screenshot = await buildScreenshotData(runId, outcome.source_event_seq, logger);

  return {
    type,
    data: {
      runId,
      screenId: outcome.screen_id,
      layoutHash: outcome.layout_hash,
      perceptualHash: outcome.perceptual_hash,
      seqRef: outcome.source_event_seq,
      ts: outcome.created_at.toISOString(),
      screenshot,
    },
  };
}

/**
 * checkRunStatus queries the runs table to determine if a run has ended.
 * PURPOSE: Enable stream closure decision after backfill for ended runs.
 */
async function checkRunStatus(runId: string): Promise<"active" | "ended" | "not_found"> {
  const row = await db.queryRow<{ status: string }>`
    SELECT status FROM runs WHERE run_id = ${runId}
  `;

  if (!row) {
    return "not_found";
  }

  return (RUN_ENDED_STATUSES as readonly string[]).includes(row.status) ? "ended" : "active";
}

/**
 * streamGraphForRun implements GET /graph/run/:runId/stream SSE endpoint.
 * PURPOSE: Stream graph projection outcomes with screenshots to frontend clients.
 */
export const streamGraphForRun = api.streamOut<StreamHandshake, GraphStreamEvent>(
  { expose: true, path: "/graph/run/:runId/stream" },
  async (handshake, stream) => {
    const runId = handshake.runId;
    const replay = handshake.replay ?? true;
    const fromSeq = handshake.fromSeq ?? 0;

    const logger = log.with({ module: "graph", actor: "api", runId });
    logger.info("Graph stream client connected", { replay, fromSeq });

    // Check run exists
    const runStatus = await checkRunStatus(runId);
    if (runStatus === "not_found") {
      logger.error("Run not found");
      throw APIError.notFound("run_not_found");
    }

    try {
      let lastSentSeq = fromSeq;

      // Backfill phase
      if (replay) {
        logger.info("Starting backfill", { fromSeq });
        const backfillOutcomes = await fetchGraphOutcomes(runId, fromSeq);
        logger.info("Backfill fetched", { count: backfillOutcomes.length });

        for (const outcome of backfillOutcomes) {
          const event = await convertOutcomeToEvent(outcome, runId, logger);
          logger.debug("Sending backfill event", {
            type: event.type,
            seqRef: event.data.seqRef,
            screenId: event.data.screenId,
          });
          await stream.send(event);
          lastSentSeq = Math.max(lastSentSeq, event.data.seqRef);
        }

        logger.info("Backfill complete", { lastSentSeq });

        // If run ended, close stream after backfill
        if (runStatus === "ended") {
          logger.info("Run ended, closing stream after backfill");
          await stream.close();
          return;
        }
      }

      // Live tail phase
      logger.info("Starting live tail", { fromSeq: lastSentSeq });

      let lastHeartbeatMs = Date.now();
      const HEARTBEAT_INTERVAL_MS = 30000; // 30s
      const POLL_INTERVAL_MS = 300; // 300ms

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        // Send heartbeat if needed
        const now = Date.now();
        if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
          logger.debug("Sending heartbeat");
          // Encore SSE doesn't support custom event types; send a special message
          await stream.send({
            type: "graph.screen.mapped",
            data: {
              runId,
              screenId: "__heartbeat__",
              layoutHash: "",
              perceptualHash: "",
              seqRef: 0,
              ts: new Date().toISOString(),
              screenshot: { refId: null, dataUrl: null },
            },
          });
          lastHeartbeatMs = now;
        }

        try {
          // Fetch new outcomes
          const newOutcomes = await fetchGraphOutcomes(runId, lastSentSeq);

          for (const outcome of newOutcomes) {
            const event = await convertOutcomeToEvent(outcome, runId, logger);
            logger.debug("Sending live event", {
              type: event.type,
              seqRef: event.data.seqRef,
              screenId: event.data.screenId,
            });
            await stream.send(event);
            lastSentSeq = Math.max(lastSentSeq, event.data.seqRef);
          }

          // Check if run ended
          const currentStatus = await checkRunStatus(runId);
          if (currentStatus === "ended") {
            logger.info("Run ended, closing stream");
            await stream.close();
            return;
          }
        } catch (err) {
          logger.error("Error polling outcomes", { err });
          break;
        }
      }
    } catch (err) {
      logger.error("Error in graph stream", { err });
      throw err;
    }
  },
);
