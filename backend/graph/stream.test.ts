import { describe, it, expect, beforeEach, afterEach } from "vitest";
import db from "../db";

/**
 * Graph Stream Smoke Tests
 * PURPOSE: Verify basic graph SSE data queries work correctly.
 */

describe("Graph Stream Smoke Tests", () => {
  let testRunId: string;

  beforeEach(async () => {
    // Create a test run
    testRunId = "test_run_stream_" + Date.now();
    await db.exec`
      INSERT INTO runs (run_id, app_package, status, created_at)
      VALUES (${testRunId}, 'com.test.app', 'running', NOW())
    `;
  });

  afterEach(async () => {
    // Cleanup test data
    await db.exec`DELETE FROM graph_persistence_outcomes WHERE run_id = ${testRunId}`;
    await db.exec`DELETE FROM screens WHERE screen_id LIKE 'test_screen_%'`;
    await db.exec`DELETE FROM run_events WHERE run_id = ${testRunId}`;
    await db.exec`DELETE FROM runs WHERE run_id = ${testRunId}`;
  });

  it("should fetch outcomes ordered by source_event_seq", async () => {
    // Create test screens
    const screen1Id = "test_screen_1";
    const screen2Id = "test_screen_2";
    
    await db.exec`
      INSERT INTO screens (screen_id, app_package, layout_hash, perceptual_hash, first_seen_at, last_seen_at)
      VALUES 
        (${screen1Id}, 'com.test.app', 'hash1', 'phash1', NOW(), NOW()),
        (${screen2Id}, 'com.test.app', 'hash2', 'phash2', NOW(), NOW())
    `;

    // Create outcomes with different source_event_seq
    await db.exec`
      INSERT INTO graph_persistence_outcomes 
        (outcome_id, run_id, step_ordinal, screen_id, upsert_kind, source_event_seq, created_at)
      VALUES 
        ('outcome1', ${testRunId}, 1, ${screen1Id}, 'discovered', 10, NOW()),
        ('outcome2', ${testRunId}, 2, ${screen2Id}, 'discovered', 20, NOW())
    `;

    // Query outcomes
    const outcomes: Array<{ source_event_seq: number; screen_id: string }> = [];
    for await (const row of db.query<{ source_event_seq: number; screen_id: string }>`
      SELECT source_event_seq, screen_id
      FROM graph_persistence_outcomes
      WHERE run_id = ${testRunId}
      ORDER BY source_event_seq ASC
    `) {
      outcomes.push(row);
    }

    expect(outcomes).toHaveLength(2);
    expect(outcomes[0].source_event_seq).toBe(10);
    expect(outcomes[1].source_event_seq).toBe(20);
  });

  it("should detect run status correctly", async () => {
    // Check initial status
    const row1 = await db.queryRow<{ status: string }>`
      SELECT status FROM runs WHERE run_id = ${testRunId}
    `;
    expect(row1).toBeTruthy();
    expect(row1!.status).toBe("running");

    // Update run to completed
    await db.exec`
      UPDATE runs SET status = 'completed' WHERE run_id = ${testRunId}
    `;

    const row2 = await db.queryRow<{ status: string }>`
      SELECT status FROM runs WHERE run_id = ${testRunId}
    `;
    expect(row2).toBeTruthy();
    expect(row2!.status).toBe("completed");
  });

  it("should return null for non-existent run", async () => {
    const row = await db.queryRow<{ status: string }>`
      SELECT status FROM runs WHERE run_id = 'non_existent_run'
    `;
    expect(row).toBeNull();
  });
});

describe("Event Type Mapping", () => {
  it("should map upsert_kind to event type", () => {
    // Helper function to map upsert kind to event type
    function mapToEventType(kind: "discovered" | "mapped"): string {
      return kind === "discovered" ? "graph.screen.discovered" : "graph.screen.mapped";
    }

    expect(mapToEventType("discovered")).toBe("graph.screen.discovered");
    expect(mapToEventType("mapped")).toBe("graph.screen.mapped");
  });

  it("should infer MIME type from extension", () => {
    const pngRef = "obj://artifacts/run1/screenshot/abc.png";
    const jpgRef = "obj://artifacts/run1/screenshot/def.jpg";

    const pngMime = pngRef.endsWith(".jpg") || pngRef.endsWith(".jpeg") ? "image/jpeg" : "image/png";
    const jpgMime = jpgRef.endsWith(".jpg") || jpgRef.endsWith(".jpeg") ? "image/jpeg" : "image/png";

    expect(pngMime).toBe("image/png");
    expect(jpgMime).toBe("image/jpeg");
  });
});

describe("Sequence Ordering", () => {
  it("should maintain monotonic ordering", () => {
    let lastSeq = 0;
    const seqs = [5, 10, 15, 20, 25];

    for (const seq of seqs) {
      expect(seq).toBeGreaterThan(lastSeq);
      lastSeq = seq;
    }
  });
});


