import { api, APIError } from "encore.dev/api";
import { Topic } from "encore.dev/pubsub";
import db from "../db";
import { StartRunRequest, StartRunResponse, Run, RunJob } from "./types";

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

    const maxSteps = req.maxSteps ?? 100;

    console.log("[POST /run] Creating runs record");
    const run = await db.queryRow<Run>`
      INSERT INTO runs (app_package, device_config, max_steps, goal)
      VALUES (${req.apkPath}, ${JSON.stringify({ appiumServerUrl: req.appiumServerUrl })}, ${maxSteps}, ${req.goal || null})
      RETURNING *
    `;

    if (!run) {
      console.error("[POST /run] Failed to create runs record");
      throw APIError.internal("Failed to create run");
    }

    console.log(`[POST /run] Created run ${run.id}`);

    console.log(`[POST /run] Publishing run job to topic for run ${run.id}`);
    await runJobTopic.publish({ runId: run.id, apkPath: req.apkPath, appiumServerUrl: req.appiumServerUrl });

    const streamUrl = `/run/${run.id}/stream`;
    console.log(`[POST /run] Run ${run.id} initiated, stream URL: ${streamUrl}`);

    return {
      runId: run.id,
      status: "PENDING",
      createdAt: run.created_at,
      streamUrl,
    };
  }
);
