import db from "../db";

/**
 * Quick diagnostic for BUG-002: Check if graph projector is working.
 * PURPOSE: Verify events exist, projector is processing them, and graph tables are populated.
 */
async function checkGraphBug(): Promise<void> {
  console.log("=== BUG-002 Diagnostic ===\n");

  const runId = "01K9B2ANBJKXV83AFMSZZYWMXH";

  // 1. Check run_events schema
  console.log("1. Checking run_events schema...");
  const hasKindColumn = await db.queryRow<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'run_events' AND column_name = 'kind'
    ) as exists
  `;
  console.log("   Has 'kind' column:", hasKindColumn?.exists);

  // 2. Check for events
  console.log("\n2. Checking run_events for this run...");
  const eventCount = await db.queryRow<{ count: number }>`
    SELECT COUNT(*)::int as count FROM run_events WHERE run_id = ${runId}
  `;
  console.log("   Total events:", eventCount?.count);

  if (eventCount && eventCount.count > 0) {
    const events = await db.queryAll<{ seq: number; kind: string; node_name: string | null }>`
      SELECT seq, kind, node_name FROM run_events WHERE run_id = ${runId} ORDER BY seq
    `;
    console.log("   Events:");
    for (const e of events) {
      console.log(`     seq=${e.seq} kind=${e.kind} node=${e.node_name || "N/A"}`);
    }

    // Check for Perceive events
    const perceiveEvents = events.filter(
      (e) =>
        e.kind === "agent.event.screen_perceived" ||
        e.kind === "agent.event.ui_hierarchy_captured" ||
        e.kind === "agent.event.screenshot_captured",
    );
    console.log(`\n   Perceive-related events: ${perceiveEvents.length}`);
  }

  // 3. Check graph_projection_cursors
  console.log("\n3. Checking graph_projection_cursors...");
  const cursorExists = await db.queryRow<{ exists: boolean }>`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'graph_projection_cursors') as exists
  `;
  console.log("   Table exists:", cursorExists?.exists);

  if (cursorExists?.exists) {
    const cursor = await db.queryRow<{ run_id: string; next_seq: number }>`
      SELECT run_id, next_seq FROM graph_projection_cursors WHERE run_id = ${runId}
    `;
    if (cursor) {
      console.log(`   Cursor: next_seq=${cursor.next_seq}`);
    } else {
      console.log("   No cursor found for this run");
    }
  }

  // 4. Check screens table
  console.log("\n4. Checking screens table...");
  const screensCount = await db.queryRow<{ count: number }>`
    SELECT COUNT(*)::int as count FROM screens
  `;
  console.log("   Total screens:", screensCount?.count);

  // 5. Check graph_persistence_outcomes
  console.log("\n5. Checking graph_persistence_outcomes...");
  const outcomesCount = await db.queryRow<{ count: number }>`
    SELECT COUNT(*)::int as count FROM graph_persistence_outcomes WHERE run_id = ${runId}
  `;
  console.log("   Outcomes for this run:", outcomesCount?.count);

  if (outcomesCount && outcomesCount.count > 0) {
    const outcomes = await db.queryAll<{
      step_ordinal: number;
      upsert_kind: string;
      screen_id: string | null;
      source_event_seq: number;
    }>`
      SELECT step_ordinal, upsert_kind, screen_id, source_event_seq 
      FROM graph_persistence_outcomes 
      WHERE run_id = ${runId}
      ORDER BY step_ordinal
    `;
    console.log("   Outcomes:");
    for (const o of outcomes) {
      console.log(`     step=${o.step_ordinal} kind=${o.upsert_kind} seq=${o.source_event_seq}`);
    }
  }

  // 6. Check if graph service is registered
  console.log("\n6. Checking for graph projector startup...");
  console.log("   (Check Encore logs for: 'Graph projector' or module='graph')");

  console.log("\n=== Diagnostic Complete ===");
}

checkGraphBug()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Diagnostic failed:", err);
    process.exit(1);
  });
