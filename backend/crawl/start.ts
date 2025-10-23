import { api, APIError } from "encore.dev/api";
import { Topic } from "encore.dev/pubsub";
import db from "../db";
import { StartCrawlRequest, StartCrawlResponse, CrawlRun, CrawlJob } from "./types";

export const crawlJobTopic = new Topic<CrawlJob>("crawl-job", {
  deliveryGuarantee: "at-least-once",
});

export const start = api<StartCrawlRequest, StartCrawlResponse>(
  { expose: true, method: "POST", path: "/crawl" },
  async (req) => {
    console.log("[POST /crawl] Starting new crawl run", req);

    if (!req.appPackage) {
      throw APIError.invalidArgument("appPackage is required");
    }

    const maxSteps = req.maxSteps ?? 100;

    console.log("[POST /crawl] Creating crawl_runs record");
    const crawlRun = await db.queryRow<CrawlRun>`
      INSERT INTO crawl_runs (app_package, device_config, max_steps, goal)
      VALUES (${req.appPackage}, ${JSON.stringify(req.deviceConfig || null)}, ${maxSteps}, ${req.goal || null})
      RETURNING *
    `;

    if (!crawlRun) {
      console.error("[POST /crawl] Failed to create crawl_runs record");
      throw APIError.internal("Failed to create crawl run");
    }

    console.log(`[POST /crawl] Created crawl run ${crawlRun.id}`);

    console.log(`[POST /crawl] Publishing crawl job to topic for crawl ${crawlRun.id}`);
    await crawlJobTopic.publish({ crawlId: crawlRun.id });

    const streamUrl = `/crawl/${crawlRun.id}/stream`;
    console.log(`[POST /crawl] Crawl ${crawlRun.id} initiated, stream URL: ${streamUrl}`);

    return {
      crawlId: crawlRun.id,
      status: "PENDING",
      createdAt: crawlRun.created_at,
      streamUrl,
    };
  }
);
