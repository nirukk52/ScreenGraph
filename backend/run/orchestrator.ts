import { Subscription } from "encore.dev/pubsub";
import { APIError } from "encore.dev/api";
import db from "../db";
import { runJobTopic } from "./start";
import { Run, RunJob } from "./types";
import { runAgentLoop } from "./agent-runner";

class CancellationError extends Error {
  constructor() {
    super("Run was cancelled");
    this.name = "CancellationError";
  }
}

new Subscription(runJobTopic, "orchestrator-worker", {
  handler: async (job: RunJob) => {
    console.log(`[Orchestrator] Starting run ${job.runId}`);
    await executeOrchestrator(job.runId, job.apkPath, job.appiumServerUrl);
  },
});

async function executeOrchestrator(runId: string, apkPath: string, appiumServerUrl: string): Promise<void> {
  try {
    console.log(`[Orchestrator] Updating run ${runId} status to RUNNING`);
    await db.exec`
      UPDATE runs 
      SET status = 'RUNNING', started_at = NOW() 
      WHERE id = ${runId}
    `;

    await checkCancellation(runId);
    
    console.log(`[Orchestrator] Starting agent loop for run ${runId}`);
    await runAgentLoop(runId, apkPath, appiumServerUrl);

    console.log(`[Orchestrator] Run ${runId} completed successfully`);
    await db.exec`
      UPDATE runs 
      SET status = 'COMPLETED', completed_at = NOW() 
      WHERE id = ${runId}
    `;
  } catch (err) {
    if (err instanceof CancellationError) {
      console.log(`[Orchestrator] Run ${runId} was cancelled`);
      await emitEvent(runId, "RUN_CANCELLED", {});
      await db.exec`
        UPDATE runs 
        SET status = 'CANCELLED' 
        WHERE id = ${runId}
      `;
    } else {
      console.error(`[Orchestrator] Run ${runId} failed:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      await emitEvent(runId, "RUN_FAILED", { error: errorMessage });
      await db.exec`
        UPDATE runs 
        SET status = 'FAILED', completed_at = NOW(), error_message = ${errorMessage}
        WHERE id = ${runId}
      `;
    }
  }
}

async function checkCancellation(runId: string): Promise<void> {
  const run = await db.queryRow<Run>`
    SELECT * FROM runs WHERE id = ${runId}
  `;

  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }

  if (run.cancelled_at) {
    throw new CancellationError();
  }
}

async function emitEvent(
  runId: string,
  eventType: string,
  payload: any
): Promise<number> {
  const timestamp = new Date().toISOString();
  const fullPayload = {
    ...payload,
    timestamp,
  };

  console.log(`[Orchestrator] Emitting event ${eventType} for run ${runId}`, fullPayload);

  const result = await db.queryRow<{ id: number }>`
    INSERT INTO run_events (run_id, event_type, payload)
    VALUES (${runId}, ${eventType}, ${JSON.stringify(fullPayload)})
    RETURNING id
  `;

  if (!result) {
    throw new Error(`Failed to insert event ${eventType} for run ${runId}`);
  }

  await db.exec`
    INSERT INTO run_outbox (run_id, event_type, payload)
    VALUES (${runId}, ${eventType}, ${JSON.stringify(fullPayload)})
  `;

  console.log(`[Orchestrator] Event ${eventType} inserted with ID ${result.id} for run ${runId}`);

  return result.id;
}
