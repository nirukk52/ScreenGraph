import { api, APIError } from "encore.dev/api";
import { Topic } from "encore.dev/pubsub";
import db from "../db";
import { StartRunRequest, StartRunResponse, Run, RunJob } from "./types";
import { ulid } from "ulidx";

export const runJobTopic = new Topic<RunJob>("run-job", {
  deliveryGuarantee: "at-least-once",
});

export const start = api<StartRunRequest, StartRunResponse>(
  { expose: true, method: "POST", path: "/run" },
  async (req) => {
    console.log("[POST /run] Starting new run", req);

    if (!req.apkPath) {
      throw APIError.invalidArgument("apkPath is required");
    }

    if (!req.appiumServerUrl) {
      throw APIError.invalidArgument("appiumServerUrl is required");
    }

    const runId = ulid();
    const tenantId = "tenant-default";
    const projectId = "project-default";
    //todo : this needs to be a separate table in the database
    const appConfigId = JSON.stringify({
      apkPath: req.apkPath,
      appiumServerUrl: req.appiumServerUrl,
      packageName: req.packageName,
      appActivity: req.appActivity,
      maxSteps: req.maxSteps ?? 100,
      goal: req.goal,
    });

    console.log("[POST /run] Creating runs record");
    const run = await db.queryRow<Run>`
      INSERT INTO runs (run_id, tenant_id, project_id, app_config_id, status, created_at, updated_at)
      VALUES (${runId}, ${tenantId}, ${projectId}, ${appConfigId}, 'running', NOW(), NOW())
      RETURNING *
    `;

    if (!run) {
      console.error("[POST /run] Failed to create runs record");
      throw APIError.internal("Failed to create run");
    }

    console.log(`[POST /run] Created run ${run.run_id}`);

    console.log(`[POST /run] Publishing run job to topic for run ${run.run_id}`);
    await runJobTopic.publish({
      runId: run.run_id,
      apkPath: req.apkPath,
      appiumServerUrl: req.appiumServerUrl,
      packageName: req.packageName,
      appActivity: req.appActivity,
    });

    const streamUrl = `/run/${run.run_id}/stream`;
    console.log(`[POST /run] Run ${run.run_id} initiated, stream URL: ${streamUrl}`);

    return {
      runId: run.run_id,
      status: "PENDING",
      createdAt: run.created_at,
      streamUrl,
    };
  },
);
