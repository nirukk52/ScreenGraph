import db from "../db";

/**
 * Check agent state snapshots to understand why Stop node isn't executing.
 * PURPOSE: Debug agent state machine termination.
 */
async function checkAgentState(): Promise<void> {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: bunx tsx scripts/check-agent-state.ts <runId>");
    process.exit(1);
  }

  console.log(`Checking agent state for run ${runId}\n`);

  const snapshots = await db.queryAll<{
    step_ordinal: number;
    state_json: string;
  }>`
    SELECT step_ordinal, state_json
    FROM run_state_snapshots
    WHERE run_id = ${runId}
    ORDER BY step_ordinal DESC
  `;

  if (snapshots.length === 0) {
    console.log("❌ No snapshots found");
    process.exit(1);
  }

  console.log(`Found ${snapshots.length} snapshots\n`);

  const lastSnapshot = snapshots[0];
  const state = JSON.parse(lastSnapshot.state_json);

  console.log("Last snapshot (step " + lastSnapshot.step_ordinal + "):");
  console.log("  nodeName:", state.nodeName);
  console.log("  status:", state.status);
  console.log("  stopReason:", state.stopReason);
  console.log("  stepOrdinal:", state.stepOrdinal);
  console.log("  iterationOrdinalNumber:", state.iterationOrdinalNumber);
  console.log("\nBudgets:");
  console.log("  maxSteps:", state.budgets.maxSteps);
  console.log("  maxTimeMs:", state.budgets.maxTimeMs);
  console.log("\nCounters:");
  console.log("  stepsTotal:", state.counters.stepsTotal);
  console.log("  screensNew:", state.counters.screensNew);
  console.log("\nTimestamps:");
  console.log("  createdAt:", state.timestamps.createdAt);
  console.log("  updatedAt:", state.timestamps.updatedAt);

  const elapsedMs =
    Date.parse(state.timestamps.updatedAt) - Date.parse(state.timestamps.createdAt);
  console.log("  elapsedMs:", elapsedMs);

  // Check if budget exhausted
  if (state.counters.stepsTotal >= state.budgets.maxSteps) {
    console.log("\n⚠️  BUDGET EXHAUSTED: Steps total >= maxSteps");
  }
  if (elapsedMs >= state.budgets.maxTimeMs) {
    console.log("\n⚠️  BUDGET EXHAUSTED: Elapsed time >= maxTimeMs");
  }

  process.exit(0);
}

checkAgentState().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

