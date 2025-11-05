import { api, APIError, type RawRequest } from "encore.dev/api";
import { Topic } from "encore.dev/pubsub";
import db from "../db";
import type { StartRunRequest, StartRunResponse, Run, RunJob } from "./types";
import { ulid } from "ulidx";
import log from "encore.dev/log";
import { MODULES, RUN_ACTORS } from "../logging/logger";

export const runJobTopic = new Topic<RunJob>("run-job", {
  deliveryGuarantee: "at-least-once",
});

export const start = api<StartRunRequest, StartRunResponse>(
  { expose: true, method: "POST", path: "/run" },
  async (req, rawRequest?: RawRequest) => {
    const baseLog = log.with({ module: MODULES.RUN, actor: RUN_ACTORS.START });
    baseLog.info("Request received");

    if (!req.apkPath) {
      baseLog.info("Validation failed: apkPath missing");
      throw APIError.invalidArgument("apkPath is required");
    }

    if (!req.appiumServerUrl) {
      baseLog.info("Validation failed: appiumServerUrl missing");
      throw APIError.invalidArgument("appiumServerUrl is required");
    }

    if (!req.packageName) {
      baseLog.info("Validation failed: packageName missing");
      throw APIError.invalidArgument("packageName is required");
    }

    const runId = ulid();
    const logger = baseLog.with({ runId });

    logger.info("Creating runs record");
    const run = await db.queryRow<Run>`
      INSERT INTO runs (
        run_id,
        app_package,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${runId},
        ${req.packageName},
        'queued',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    if (!run) {
      logger.error("Failed to create runs record");
      throw APIError.internal("Failed to create run");
    }

    logger.info("Run record created");

    logger.info("Publishing run job to topic");
    await runJobTopic.publish({
      runId: run.run_id,
      apkPath: req.apkPath,
      appiumServerUrl: req.appiumServerUrl,
      packageName: req.packageName,
      appActivity: req.appActivity,
      maxSteps: req.maxSteps,
    });

    // Build full stream URL from request headers
    const protocol = rawRequest?.headers["x-forwarded-proto"] || "ws";
    const host = rawRequest?.headers.host || "localhost:4002";
    const baseUrl = `${protocol}://${host}`;

    const streamUrl = `${baseUrl}/run/${run.run_id}/stream`;
    logger.info("Run initiated", { streamUrl });

    return {
      runId: run.run_id,
      status: "PENDING",
      createdAt: run.created_at,
      streamUrl,
    };
  },
);
