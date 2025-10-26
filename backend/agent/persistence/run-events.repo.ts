import db from "../../db";
import type { RunEventsDbPort } from "../ports/run-events.port";
import type { DomainEvent } from "../domain/events";
import { ulid } from "ulidx";

/**
 * RunEventsRepo implements RunEventsDbPort with the SQL-backed `run_events` table.
 * It appends events and provides replay helpers with strict ordering.
 */
export class RunEventsRepo implements RunEventsDbPort {
  async appendEvent(event: DomainEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    await db.exec`
      INSERT INTO run_events (run_id, seq, type, node_name, payload, created_at)
      VALUES (
        ${event.runId},
        ${event.sequence},
        ${event.kind},
        ${payload.nodeName || null},
        ${JSON.stringify(event.payload)},
        ${event.ts}
      )
      ON CONFLICT (run_id, seq) DO NOTHING
    `;
  }

  async getEvents(runId: string): Promise<DomainEvent[]> {
    const rows: Array<{
      run_id: string;
      seq: number;
      type: string;
      payload: string;
      created_at: string;
    }> = [];

    for await (const row of db.query<{
      run_id: string;
      seq: number;
      type: string;
      payload: string;
      created_at: string;
    }>`
      SELECT run_id, seq, type, payload, created_at
      FROM run_events
      WHERE run_id = ${runId}
      ORDER BY seq ASC
    `) {
      rows.push(row);
    }

    return rows.map((row) => ({
      eventId: ulid(),
      runId: row.run_id,
      tenantId: "",
      projectId: "",
      sequence: row.seq,
      ts: row.created_at,
      kind: row.type as DomainEvent["kind"],
      version: "1",
      payload: JSON.parse(row.payload),
      checksum: "",
    }));
  }

  async getLastEventSequence(runId: string): Promise<number> {
    const row = await db.queryRow<{ seq: number }>`
      SELECT seq
      FROM run_events
      WHERE run_id = ${runId}
      ORDER BY seq DESC
      LIMIT 1
    `;
    return row?.seq ?? 0;
  }
}


