import { describe, it, expect, beforeEach } from "vitest";
import db from "../db";

describe("GET /run/:id/stream - Stream Events Endpoint", () => {
  beforeEach(async () => {
    await db.exec`DELETE FROM run_events`;
    await db.exec`DELETE FROM runs`;
  });

  it("should have run events in database for streaming", async () => {
    const run = await db.queryRow`
      INSERT INTO runs (app_package, max_steps)
      VALUES ('com.example.app', 100)
      RETURNING *
    `;

    await db.exec`
      INSERT INTO run_events (run_id, event_type, payload)
      VALUES 
        (${run.id}, 'RUN_STARTED', '{"step": 1}'),
        (${run.id}, 'STEP_COMPLETED', '{"step": 1}'),
        (${run.id}, 'RUN_COMPLETED', '{"result": "success"}')
    `;

    const events = await db.queryAll`
      SELECT * FROM run_events 
      WHERE run_id = ${run.id}
      ORDER BY id ASC
    `;

    expect(events.length).toBe(3);
    expect(events[0].event_type).toBe("RUN_STARTED");
    expect(events[1].event_type).toBe("STEP_COMPLETED");
    expect(events[2].event_type).toBe("RUN_COMPLETED");
  });

  it("should filter events after lastEventId", async () => {
    const run = await db.queryRow`
      INSERT INTO runs (app_package, max_steps)
      VALUES ('com.example.app', 100)
      RETURNING *
    `;

    const events = await db.queryAll`
      INSERT INTO run_events (run_id, event_type, payload)
      VALUES 
        (${run.id}, 'RUN_STARTED', '{}'),
        (${run.id}, 'STEP_COMPLETED', '{}'),
        (${run.id}, 'RUN_COMPLETED', '{}')
      RETURNING *
    `;

    const filteredEvents = await db.queryAll`
      SELECT * FROM run_events 
      WHERE run_id = ${run.id} AND id > ${events[0].id}
      ORDER BY id ASC
    `;

    expect(filteredEvents.length).toBe(2);
    expect(filteredEvents[0].id).toBe(events[1].id);
    expect(filteredEvents[1].id).toBe(events[2].id);
  });

  it("should have terminal event types", async () => {
    const terminalEvents = ["RUN_COMPLETED", "RUN_FAILED", "RUN_CANCELLED"];
    
    for (const eventType of terminalEvents) {
      const run = await db.queryRow`
        INSERT INTO runs (app_package, max_steps)
        VALUES ('com.example.app', 100)
        RETURNING *
      `;

      await db.exec`
        INSERT INTO run_events (run_id, event_type, payload)
        VALUES (${run.id}, ${eventType}, '{}')
      `;

      const event = await db.queryRow`
        SELECT * FROM run_events 
        WHERE run_id = ${run.id} AND event_type = ${eventType}
      `;

      expect(event).toBeTruthy();
      expect(event.event_type).toBe(eventType);
    }
  });
});
