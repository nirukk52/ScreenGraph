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
    console.log(`[Orchestrator] Updating run ${runId} status to running`);
    await db.exec`
      UPDATE runs 
      SET status = 'running', updated_at = NOW() 
      WHERE run_id = ${runId}
    `;

    console.log(`[Orchestrator] Starting agent loop for run ${runId}`);
    await runAgentLoop(runId, apkPath, appiumServerUrl);

    console.log(`[Orchestrator] Run ${runId} completed successfully`);
    await db.exec`
      UPDATE runs 
      SET status = 'completed', stop_reason = 'success', updated_at = NOW() 
      WHERE run_id = ${runId}
    `;
  } catch (err) {
    console.error(`[Orchestrator] Run ${runId} failed:`, err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db.exec`
      UPDATE runs 
      SET status = 'failed', stop_reason = ${errorMessage}, updated_at = NOW()
      WHERE run_id = ${runId}
    `;
  }
}
