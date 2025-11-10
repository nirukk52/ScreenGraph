import db from "../db";

/**
 * Counts the number of unique screens discovered during a specific run.
 * PURPOSE: Query graph_persistence_outcomes for screen_discovered entries to track exploration progress.
 */
export async function countUniqueScreensDiscovered(runId: string): Promise<number> {
  const result = await db.queryRow<{ count: string }>`
    SELECT COUNT(*)::text as count
    FROM graph_persistence_outcomes
    WHERE run_id = ${runId}
    AND upsert_kind = 'discovered'
  `;

  return result ? Number.parseInt(result.count, 10) : 0;
}

/**
 * Gets all unique screen IDs discovered during a specific run.
 * PURPOSE: Retrieve screen details for analysis and reporting.
 */
export async function getUniqueScreensDiscovered(runId: string): Promise<string[]> {
  const screens: string[] = [];
  for await (const row of db.query<{ screen_id: string }>`
    SELECT screen_id
    FROM graph_persistence_outcomes
    WHERE run_id = ${runId}
    AND upsert_kind = 'discovered'
    ORDER BY created_at ASC
  `) {
    screens.push(row.screen_id);
  }
  return screens;
}

/**
 * Gets run status from the database.
 * PURPOSE: Check current run status for async flow validation in tests.
 */
export async function getRunStatus(runId: string): Promise<string | null> {
  const result = await db.queryRow<{ status: string }>`
    SELECT status
    FROM runs
    WHERE run_id = ${runId}
  `;

  return result?.status || null;
}

