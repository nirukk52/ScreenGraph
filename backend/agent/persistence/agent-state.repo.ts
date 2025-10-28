import db from "../../db";
import type { AgentStateDbPort } from "../ports/db-ports/agent-state.port";
import type { AgentState } from "../domain/state";

/**
 * AgentStateRepo implements AgentStateDbPort with the `agent_state_snapshots` table.
 * It persists full snapshots per step with upsert semantics for determinism/resume.
 */
export class AgentStateRepo implements AgentStateDbPort {
  async saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void> {
    await db.exec`
      INSERT INTO agent_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
      VALUES (
        ${runId},
        ${stepOrdinal},
        ${state.nodeName},
        ${JSON.stringify(state)},
        ${state.timestamps.createdAt},
        ${state.timestamps.updatedAt}
      )
      ON CONFLICT (run_id, step_ordinal)
      DO UPDATE SET
        node_name = EXCLUDED.node_name,
        state_json = EXCLUDED.state_json,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null> {
    const row = await db.queryRow<{ state_json: string }>`
      SELECT state_json
      FROM agent_state_snapshots
      WHERE run_id = ${runId} AND step_ordinal = ${stepOrdinal}
    `;
    if (!row) return null;
    return JSON.parse(row.state_json);
  }

  async getLatestSnapshot(runId: string): Promise<AgentState | null> {
    const row = await db.queryRow<{ state_json: string }>`
      SELECT state_json
      FROM agent_state_snapshots
      WHERE run_id = ${runId}
      ORDER BY step_ordinal DESC
      LIMIT 1
    `;
    if (!row) return null;
    return JSON.parse(row.state_json);
  }
}
