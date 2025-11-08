import db from "../db";

/**
 * Find the most recent run and inspect its state.
 * PURPOSE: Quickly identify which run to debug.
 */
async function findLatestRun(): Promise<void> {
  console.log("Finding most recent runs...\n");

  const runs = await db.queryAll<{
    run_id: string;
    status: string;
    created_at: string;
    app_package: string;
    stop_reason: string | null;
  }>`
    SELECT run_id, status, created_at, app_package, stop_reason
    FROM runs
    ORDER BY created_at DESC
    LIMIT 5
  `;

  console.log("Recent runs:");
  for (const run of runs) {
    console.log(`  ${run.run_id}`);
    console.log(`    status=${run.status} package=${run.app_package}`);
    console.log(`    created=${run.created_at} stop_reason=${run.stop_reason ?? "none"}`);
    console.log();
  }

  process.exit(0);
}

findLatestRun().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

