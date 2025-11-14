import db from "../db";

async function main(): Promise<void> {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: bunx tsx backend/scripts/inspect-run.ts <runId>");
    process.exit(1);
  }

  console.log(`Inspecting run ${runId}\n`);

  const events: Array<{
    seq: number;
    kind: string;
    node_name: string | null;
    payload: string | null;
  }> = [];
  for await (const row of db.query<{
    seq: number;
    kind: string;
    node_name: string | null;
    payload: string | null;
  }>`
    SELECT seq, kind, node_name, payload
    FROM run_events
    WHERE run_id = ${runId}
    ORDER BY seq ASC
  `) {
    events.push(row);
  }

  console.log("Run events:");
  for (const event of events) {
    const base = `  seq=${event.seq} kind=${event.kind}${event.node_name ? ` node=${event.node_name}` : ""}`;
    if (event.payload) {
      try {
        const parsed = JSON.parse(event.payload);
        if (parsed.stepOrdinal !== undefined) {
          console.log(`${base} step=${parsed.stepOrdinal}`);
        } else if (parsed.seqRef !== undefined) {
          console.log(`${base} seqRef=${parsed.seqRef}`);
        } else {
          console.log(base);
        }
      } catch {
        console.log(base);
      }
    } else {
      console.log(base);
    }
  }

  const outcomes: Array<{
    step_ordinal: number;
    upsert_kind: string;
    screen_id: string | null;
    source_event_seq: number;
  }> = [];
  for await (const row of db.query<{
    step_ordinal: number;
    upsert_kind: string;
    screen_id: string | null;
    source_event_seq: number;
  }>`
    SELECT step_ordinal, upsert_kind, screen_id, source_event_seq
    FROM graph_persistence_outcomes
    WHERE run_id = ${runId}
    ORDER BY step_ordinal ASC
  `) {
    outcomes.push(row);
  }

  console.log("\nGraph outcomes:");
  if (outcomes.length === 0) {
    console.log("  (none)");
  } else {
    for (const outcome of outcomes) {
      console.log(
        `  step=${outcome.step_ordinal} kind=${outcome.upsert_kind} screen=${outcome.screen_id ?? "null"} seq=${outcome.source_event_seq}`,
      );
    }
  }

  const cursor = await db.queryRow<{
    run_id: string;
    next_seq: number;
    updated_at: Date;
  }>`
    SELECT run_id, next_seq, updated_at
    FROM graph_projection_cursors
    WHERE run_id = ${runId}
  `;

  console.log("\nProjection cursor:");
  if (!cursor) {
    console.log("  (missing)");
  } else {
    console.log(`  next_seq=${cursor.next_seq} updated_at=${cursor.updated_at.toISOString()}`);
  }

  const runRow = await db.queryRow<{
    app_package: string | null;
    status: string;
    stop_reason: string | null;
  }>`
    SELECT app_package, status, stop_reason
    FROM runs
    WHERE run_id = ${runId}
  `;

  console.log("\nRun record:");
  if (!runRow) {
    console.log("  (missing)");
  } else {
    console.log(
      `  status=${runRow.status} app_package=${runRow.app_package ?? "null"} stop_reason=${runRow.stop_reason ?? "null"}`,
    );
  }
}

main().catch((err) => {
  console.error("Inspection failed:", err);
  process.exit(1);
});
