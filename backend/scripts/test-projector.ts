import db from "../db";
import { GraphProjectionRepo } from "../graph/repo";

/**
 * Test projector functions directly to debug cursor issues.
 * PURPOSE: Isolate projector logic to understand why cursor doesn't advance.
 */
async function testProjector(): Promise<void> {
  const runId = "01K9GVBJJT4JNZ83THGAYQPJJ0";
  const repo = new GraphProjectionRepo();

  console.log("Testing projector for run:", runId);
  console.log();

  // 1. Check cursor
  const cursors = await repo.listCursors(100);
  const cursor = cursors.find((c) => c.runId === runId);
  console.log("Cursor:", cursor);
  console.log();

  if (!cursor) {
    console.log("❌ No cursor found for run");
    process.exit(1);
  }

  // 2. Fetch events
  console.log(`Fetching events from seq ${cursor.nextSeq}...`);
  const events = await repo.fetchEvents(runId, cursor.nextSeq, 100);
  console.log(`Found ${events.length} events`);
  console.log();

  if (events.length > 0) {
    console.log("First few events:");
    for (const event of events.slice(0, 5)) {
      console.log(`  seq=${event.seq} kind=${event.kind}`);
    }
    console.log();
  }

  // 3. Check metadata
  console.log("Fetching run metadata...");
  const metadata = await repo.fetchRunMetadata(runId);
  console.log("Metadata:", metadata);
  console.log();

  if (!metadata) {
    console.log("❌ No metadata found");
    process.exit(1);
  }

  // 4. Look for Perceive events specifically
  const perceiveEvents = events.filter(
    (e) =>
      e.kind === "agent.node.started" ||
      e.kind === "agent.event.screen_perceived" ||
      e.kind === "agent.event.ui_hierarchy_captured" ||
      e.kind === "agent.event.screenshot_captured",
  );
  console.log(`Perceive-related events: ${perceiveEvents.length}`);
  for (const event of perceiveEvents) {
    console.log(`  seq=${event.seq} kind=${event.kind}`);
    if (event.kind === "agent.node.started") {
      const payload = event.payload as { nodeName?: string; stepOrdinal?: number };
      console.log(`    node=${payload.nodeName} step=${payload.stepOrdinal}`);
    }
  }
  console.log();

  console.log("✅ Projector functions working correctly");
  console.log("Next step: Check if projector loop is actually running");

  process.exit(0);
}

testProjector().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
