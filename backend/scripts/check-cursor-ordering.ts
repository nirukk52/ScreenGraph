import db from "../db";

/**
 * Check cursor ordering to see if recent runs are being skipped.
 * PURPOSE: Verify if CURSOR_LIMIT=50 is causing new runs to not be processed.
 */
async function checkCursorOrdering(): Promise<void> {
  console.log("Checking cursor ordering...\n");

  // Get total cursor count
  const countRow = await db.queryRow<{ count: number }>`
    SELECT COUNT(*)::int as count FROM graph_projection_cursors
  `;
  console.log(`Total cursors: ${countRow?.count ?? 0}`);
  console.log();

  // Get oldest 50 cursors (what projector processes)
  const oldestCursors = await db.queryAll<{ run_id: string; next_seq: number; updated_at: string }>`
    SELECT run_id, next_seq, updated_at
    FROM graph_projection_cursors
    ORDER BY updated_at ASC
    LIMIT 50
  `;

  console.log("Oldest 50 cursors (processed by projector):");
  console.log(`  First: ${oldestCursors[0]?.run_id} updated=${oldestCursors[0]?.updated_at}`);
  console.log(`  Last:  ${oldestCursors[oldestCursors.length - 1]?.run_id} updated=${oldestCursors[oldestCursors.length - 1]?.updated_at}`);
  console.log();

  // Get newest cursors
  const newestCursors = await db.queryAll<{ run_id: string; next_seq: number; updated_at: string }>`
    SELECT run_id, next_seq, updated_at
    FROM graph_projection_cursors
    ORDER BY updated_at DESC
    LIMIT 10
  `;

  console.log("Newest 10 cursors:");
  for (const cursor of newestCursors) {
    console.log(`  ${cursor.run_id} seq=${cursor.next_seq} updated=${cursor.updated_at}`);
  }
  console.log();

  // Check if recent problem runs are in the top 50
  const problemRuns = [
    "01K9GVBJJT4JNZ83THGAYQPJJ0",
    "01K9GV9676XN4FX28C5N597MZP",
    "01K9GT8J6ZQ2RGHHB4Y206Y6XS",
  ];

  console.log("Problem runs in top 50?");
  for (const runId of problemRuns) {
    const found = oldestCursors.some((c) => c.run_id === runId);
    console.log(`  ${runId}: ${found ? "YES" : "NO"}`);
  }
  console.log();

  process.exit(0);
}

checkCursorOrdering().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

