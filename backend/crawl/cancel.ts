import { api, APIError } from "encore.dev/api";
import db from "../db";
import { CancelCrawlResponse, CrawlRun } from "./types";

interface CancelCrawlRequest {
  id: string;
}

export const cancel = api<CancelCrawlRequest, CancelCrawlResponse>(
  { expose: true, method: "POST", path: "/crawl/:id/cancel" },
  async (req) => {
    const crawlId = req.id;
    console.log(`[POST /crawl/:id/cancel] Cancelling crawl ${crawlId}`);

    const crawl = await db.queryRow<CrawlRun>`
      SELECT * FROM crawl_runs WHERE id = ${crawlId}
    `;

    if (!crawl) {
      console.error(`[POST /crawl/:id/cancel] Crawl ${crawlId} not found`);
      throw APIError.notFound("Crawl not found");
    }

    if (crawl.status === "COMPLETED" || crawl.status === "FAILED" || crawl.status === "CANCELLED") {
      console.log(`[POST /crawl/:id/cancel] Crawl ${crawlId} already in terminal state: ${crawl.status}`);
      if (crawl.status === "CANCELLED" && crawl.cancelled_at) {
        return {
          crawlId: crawl.id,
          status: "CANCELLED",
          cancelledAt: crawl.cancelled_at,
        };
      }
      throw APIError.invalidArgument(`Crawl is already in terminal state: ${crawl.status}`);
    }

    console.log(`[POST /crawl/:id/cancel] Setting cancelled_at flag for crawl ${crawlId}`);
    await db.exec`
      UPDATE crawl_runs 
      SET cancelled_at = NOW() 
      WHERE id = ${crawlId}
    `;

    const updatedCrawl = await db.queryRow<CrawlRun>`
      SELECT * FROM crawl_runs WHERE id = ${crawlId}
    `;

    if (!updatedCrawl || !updatedCrawl.cancelled_at) {
      throw APIError.internal("Failed to cancel crawl");
    }

    console.log(`[POST /crawl/:id/cancel] Crawl ${crawlId} cancelled at ${updatedCrawl.cancelled_at}`);

    return {
      crawlId: updatedCrawl.id,
      status: "CANCELLED",
      cancelledAt: updatedCrawl.cancelled_at,
    };
  }
);
