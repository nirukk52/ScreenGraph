import { api, APIError } from "encore.dev/api";
import db from "../db";
import { CancelRunResponse, Run } from "./types";

interface CancelRunRequest {
  id: string;
}

export const cancel = api<CancelRunRequest, CancelRunResponse>(
  { expose: true, method: "POST", path: "/run/:id/cancel" },
  async (req) => {
    const runId = req.id;
    console.log(`[POST /run/:id/cancel] Cancelling run ${runId}`);

    const run = await db.queryRow<Run>`
      SELECT * FROM runs WHERE id = ${runId}
    `;

    if (!run) {
      console.error(`[POST /run/:id/cancel] Run ${runId} not found`);
      throw APIError.notFound("Run not found");
    }

    if (run.status === "COMPLETED" || run.status === "FAILED" || run.status === "CANCELLED") {
      console.log(`[POST /run/:id/cancel] Run ${runId} already in terminal state: ${run.status}`);
      if (run.status === "CANCELLED" && run.cancelled_at) {
        return {
          runId: run.id,
          status: "CANCELLED",
          cancelledAt: run.cancelled_at,
        };
      }
      throw APIError.invalidArgument(`Run is already in terminal state: ${run.status}`);
    }

    console.log(`[POST /run/:id/cancel] Setting cancelled_at flag for run ${runId}`);
    await db.exec`
      UPDATE runs 
      SET cancelled_at = NOW() 
      WHERE id = ${runId}
    `;

    const updatedRun = await db.queryRow<Run>`
      SELECT * FROM runs WHERE id = ${runId}
    `;

    if (!updatedRun || !updatedRun.cancelled_at) {
      throw APIError.internal("Failed to cancel run");
    }

    console.log(`[POST /run/:id/cancel] Run ${runId} cancelled at ${updatedRun.cancelled_at}`);

    return {
      runId: updatedRun.id,
      status: "CANCELLED",
      cancelledAt: updatedRun.cancelled_at,
    };
  }
);
