import db from "../db";

/**
 * Find completed or successful runs to compare with failed runs.
 * PURPOSE: Identify runs that reached Stop node successfully.
 */
async function findCompletedRuns(): Promise<void> {
  console.log("Finding completed runs...\n");

  const runs = await db.queryAll<{
    run_id: string;
    status: string;
    created_at: string;
    stop_reason: string | null;
  }>`
    SELECT run_id, status, created_at, stop_reason
    FROM runs
    WHERE status = 'completed'
    ORDER BY created_at DESC
    LIMIT 10
  `;

  if (runs.length === 0) {
    console.log("❌ No completed runs found");
    console.log("\nTrying canceled runs...\n");

    const canceledRuns = await db.queryAll<{
      run_id: string;
      status: string;
      created_at: string;
      stop_reason: string | null;
    }>`
      SELECT run_id, status, created_at, stop_reason
      FROM runs
      WHERE status = 'canceled'
      ORDER BY created_at DESC
      LIMIT 5
    `;

    for (const run of canceledRuns) {
      console.log(`  ${run.run_id}`);
      console.log(`    status=${run.status} created=${run.created_at}`);
    }
    
    process.exit(0);
  }

  console.log("Completed runs:");
  for (const run of runs) {
    console.log(`  ${run.run_id}`);
    console.log(`    status=${run.status} stop_reason=${run.stop_reason}`);
    console.log(`    created=${run.created_at}`);
    console.log();
  }

  process.exit(0);
}

findCompletedRuns().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

