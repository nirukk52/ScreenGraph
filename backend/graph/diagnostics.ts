import { api } from "encore.dev/api";
import db from "../db";
import { GRAPH_ACTORS, MODULES, loggerWith } from "../logging/logger";

/**
 * GraphDiagnosticsResponse contains status information about the graph projector and database.
 * PURPOSE: Provides a quick health/status check for debugging BUG-002.
 */
interface GraphDiagnosticsResponse {
  projectorStatus: string;
  database: {
    runEventsCount: number;
    screensCount: number;
    outcomesCount: number;
    cursorsCount: number;
    recentEventKinds: Array<{ kind: string; count: number }>;
  };
  schemaChecks: {
    hasGraphProjectionCursorsTable: boolean;
    hasSourceEventSeqColumn: boolean;
  };
}

/**
 * GraphDiagnosticsEndpoint provides diagnostic information about the graph projection service.
 * PURPOSE: Quick endpoint to verify BUG-002 root cause without needing DB access.
 */
export const diagnostics = api(
  { expose: true, method: "GET", path: "/graph/diagnostics" },
  async (): Promise<GraphDiagnosticsResponse> => {
    const logger = loggerWith({ module: MODULES.GRAPH, actor: GRAPH_ACTORS.PROJECTOR });

    logger.info("Running graph diagnostics");

    // Check schema
    const cursorTableExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'graph_projection_cursors'
      ) as exists
    `;

    const sourceEventSeqExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'graph_persistence_outcomes' 
        AND column_name = 'source_event_seq'
      ) as exists
    `;

    // Get counts
    const runEventsCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM run_events
    `;

    const screensCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM screens
    `;

    const outcomesCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM graph_persistence_outcomes
    `;

    const cursorsCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM graph_projection_cursors
    `;

    // Get event kinds
    const eventKinds = await db.queryAll<{ kind: string; count: string }>`
      SELECT kind, COUNT(*)::text as count 
      FROM run_events 
      GROUP BY kind 
      ORDER BY count DESC 
      LIMIT 10
    `;

    return {
      projectorStatus: "initialized",
      database: {
        runEventsCount: Number.parseInt(runEventsCount?.count || "0", 10),
        screensCount: Number.parseInt(screensCount?.count || "0", 10),
        outcomesCount: Number.parseInt(outcomesCount?.count || "0", 10),
        cursorsCount: Number.parseInt(cursorsCount?.count || "0", 10),
        recentEventKinds: eventKinds.map((row) => ({
          kind: row.kind,
          count: Number.parseInt(row.count, 10),
        })),
      },
      schemaChecks: {
        hasGraphProjectionCursorsTable: cursorTableExists?.exists || false,
        hasSourceEventSeqColumn: sourceEventSeqExists?.exists || false,
      },
    };
  },
);
