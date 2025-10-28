import db from "../../db";
import type { ScreenGraphDbPort } from "../ports/db-ports/screen-graph.port";
import { ulid } from "ulidx";

/**
 * ScreenGraphRepo implements ScreenGraphDbPort and persists UI graph artifacts.
 * It is write-only in MVP to avoid coupling read concerns into the agent.
 */
export class ScreenGraphRepo implements ScreenGraphDbPort {
  async upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string,
  ): Promise<void> {
    const runRow = await db.queryRow<{ tenant_id: string; project_id: string }>`
      SELECT tenant_id, project_id FROM runs WHERE run_id = ${runId}
    `;
    if (!runRow) return;

    await db.exec`
      INSERT INTO screens (screen_id, tenant_id, project_id, app_id, layout_hash, perceptual_hash64, first_seen_at, last_seen_at)
      VALUES (
        ${screenId},
        ${runRow.tenant_id},
        ${runRow.project_id},
        'default',
        ${xmlRef},
        ${perceptualHash64},
        NOW(),
        NOW()
      )
      ON CONFLICT (screen_id)
      DO UPDATE SET last_seen_at = NOW()
    `;

    await db.exec`
      INSERT INTO artifacts_index (artifact_ref_id, run_id, kind, created_at)
      VALUES
        (${screenshotRef}, ${runId}, 'screenshot', NOW()),
        (${xmlRef}, ${runId}, 'xml', NOW())
      ON CONFLICT (artifact_ref_id) DO NOTHING
    `;
  }

  async upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string,
  ): Promise<void> {
    const runRow = await db.queryRow<{ tenant_id: string; project_id: string }>`
      SELECT tenant_id, project_id FROM runs WHERE run_id = ${runId}
    `;
    if (!runRow) return;

    await db.exec`
      INSERT INTO actions (action_id, screen_id, verb, target_key, created_at)
      VALUES (
        ${actionId},
        ${fromScreenId},
        ${actionKind},
        ${actionId},
        NOW()
      )
      ON CONFLICT (screen_id, verb, target_key) DO NOTHING
    `;

    await db.exec`
      INSERT INTO edges (edge_id, tenant_id, project_id, app_id, from_screen_id, action_id, to_screen_id, evidence_counter, last_seen_at)
      VALUES (
        ${ulid()},
        ${runRow.tenant_id},
        ${runRow.project_id},
        'default',
        ${fromScreenId},
        ${actionId},
        ${toScreenId},
        1,
        NOW()
      )
      ON CONFLICT (from_screen_id, action_id, to_screen_id)
      DO UPDATE SET
        evidence_counter = edges.evidence_counter + 1,
        last_seen_at = NOW()
    `;
  }
}
