import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { CancelRunResponse, Run } from "./types";

interface CancelRunRequest {
  id: string;
}

export const cancel = api<CancelRunRequest, CancelRunResponse>(
  { expose: true, method: "POST", path: "/run/:id/cancel" },
  async (req) => {
    const runId = req.id;
    console.log(`[POST /run/:id/cancel] Cancelling run ${runId}`);

    const run = await db.queryRow<Run>`
      SELECT * FROM runs WHERE run_id = ${runId}
    `;

    if (!run) {
      console.error(`[POST /run/:id/cancel] Run ${runId} not found`);
      throw APIError.notFound("Run not found");
    }

    if (run.status === "completed" || run.status === "failed" || run.status === "canceled") {
      console.log(`[POST /run/:id/cancel] Run ${runId} already in terminal state: ${run.status}`);
      throw APIError.invalidArgument(`Run is already in terminal state: ${run.status}`);
    }

    console.log(`[POST /run/:id/cancel] Cancelling run ${runId}`);
    await db.exec`
      UPDATE runs 
      SET status = 'canceled', stop_reason = 'user_cancelled', updated_at = NOW()
      WHERE run_id = ${runId}
    `;

    const updatedRun = await db.queryRow<Run>`
      SELECT * FROM runs WHERE run_id = ${runId}
    `;

    if (!updatedRun) {
      throw APIError.internal("Failed to cancel run");
    }

    console.log(`[POST /run/:id/cancel] Run ${runId} cancelled`);

    return {
      runId: updatedRun.run_id,
      status: "CANCELLED",
      cancelledAt: updatedRun.updated_at,
    };
  },
);
