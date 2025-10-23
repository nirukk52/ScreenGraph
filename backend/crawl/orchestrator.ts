import { Subscription } from "encore.dev/pubsub";
import { APIError } from "encore.dev/api";
import db from "../db";
import { crawlJobTopic } from "./start";
import { CrawlRun, CrawlJob } from "./types";

class CancellationError extends Error {
  constructor() {
    super("Crawl was cancelled");
    this.name = "CancellationError";
  }
}

new Subscription(crawlJobTopic, "orchestrator-worker", {
  handler: async (job: CrawlJob) => {
    console.log(`[Orchestrator] Starting crawl ${job.crawlId}`);
    await executeOrchestrator(job.crawlId);
  },
});

async function executeOrchestrator(crawlId: string): Promise<void> {
  try {
    console.log(`[Orchestrator] Updating crawl ${crawlId} status to RUNNING`);
    await db.exec`
      UPDATE crawl_runs 
      SET status = 'RUNNING', started_at = NOW() 
      WHERE id = ${crawlId}
    `;

    await checkCancellation(crawlId);
    await executeNode(crawlId, "Start", "CRAWL_STARTED", {});

    await checkCancellation(crawlId);
    await executeNode(crawlId, "Process", "PROCESSING", {});
    console.log(`[Orchestrator] Process node waiting 2 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await checkCancellation(crawlId);
    await executeNode(crawlId, "Finish", "CRAWL_COMPLETED", {});

    console.log(`[Orchestrator] Crawl ${crawlId} completed successfully`);
    await db.exec`
      UPDATE crawl_runs 
      SET status = 'COMPLETED', completed_at = NOW() 
      WHERE id = ${crawlId}
    `;
  } catch (err) {
    if (err instanceof CancellationError) {
      console.log(`[Orchestrator] Crawl ${crawlId} was cancelled`);
      await emitEvent(crawlId, "CRAWL_CANCELLED", {});
      await db.exec`
        UPDATE crawl_runs 
        SET status = 'CANCELLED' 
        WHERE id = ${crawlId}
      `;
    } else {
      console.error(`[Orchestrator] Crawl ${crawlId} failed:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      await emitEvent(crawlId, "CRAWL_FAILED", { error: errorMessage });
      await db.exec`
        UPDATE crawl_runs 
        SET status = 'FAILED', completed_at = NOW(), error_message = ${errorMessage}
        WHERE id = ${crawlId}
      `;
    }
  }
}

async function checkCancellation(crawlId: string): Promise<void> {
  const crawl = await db.queryRow<CrawlRun>`
    SELECT * FROM crawl_runs WHERE id = ${crawlId}
  `;

  if (!crawl) {
    throw new Error(`Crawl ${crawlId} not found`);
  }

  if (crawl.cancelled_at) {
    throw new CancellationError();
  }
}

async function executeNode(
  crawlId: string,
  nodeType: string,
  eventType: string,
  additionalPayload: any
): Promise<void> {
  console.log(`[Orchestrator] Executing node ${nodeType} for crawl ${crawlId}`);
  await emitEvent(crawlId, eventType, {
    nodeType,
    ...additionalPayload,
  });
}

async function emitEvent(
  crawlId: string,
  eventType: string,
  payload: any
): Promise<number> {
  const timestamp = new Date().toISOString();
  const fullPayload = {
    ...payload,
    timestamp,
  };

  console.log(`[Orchestrator] Emitting event ${eventType} for crawl ${crawlId}`, fullPayload);

  const result = await db.queryRow<{ id: number }>`
    INSERT INTO crawl_events (crawl_id, event_type, payload)
    VALUES (${crawlId}, ${eventType}, ${JSON.stringify(fullPayload)})
    RETURNING id
  `;

  if (!result) {
    throw new Error(`Failed to insert event ${eventType} for crawl ${crawlId}`);
  }

  await db.exec`
    INSERT INTO crawl_outbox (crawl_id, event_type, payload)
    VALUES (${crawlId}, ${eventType}, ${JSON.stringify(fullPayload)})
  `;

  console.log(`[Orchestrator] Event ${eventType} inserted with ID ${result.id} for crawl ${crawlId}`);

  return result.id;
}
