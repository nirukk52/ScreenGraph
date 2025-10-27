import { Subscription } from "encore.dev/pubsub";
import log from "encore.dev/log";
import { runJobTopic } from "../../run/start";
import type { RunJob } from "../../run/types";
import { Orchestrator } from "./orchestrator";
import { RunDbRepo } from "../persistence/run-db.repo";
import { RunEventsRepo } from "../persistence/run-events.repo";
import { AgentStateRepo } from "../persistence/agent-state.repo";
import { RunOutboxRepo } from "../persistence/run-outbox.repo";
import type { Budgets } from "../domain/state";
import { AgentWorker } from "./worker";
import { MODULES, AGENT_ACTORS } from "../../logging/logger";

/**
 * Encore subscription that listens for RunJob messages and executes agent runs.
 * This keeps the agent domain self-contained by handling job processing within the agent layer.
 */
new Subscription(runJobTopic, "agent-orchestrator-worker", {
  handler: async (job: RunJob) => {
    const subLog = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.SUBSCRIPTION, runId: job.runId });
    subLog.info("Run job received", { apkPath: job.apkPath, maxSteps: job.maxSteps });

    try {
      const runDb = new RunDbRepo();
      const eventsDb = new RunEventsRepo();
      const agentStateDb = new AgentStateRepo();
      const outboxDb = new RunOutboxRepo();
      const orchestrator = new Orchestrator(runDb, eventsDb, agentStateDb, outboxDb);

      const workerId = `worker-${process.env.HOSTNAME ?? "local"}-${Date.now()}`;
      const leaseDurationMs = 30_000;

      const logger = subLog.with({ workerId });
      logger.info("Attempting to claim run");
      const claimed = await runDb.claimRun(job.runId, workerId, leaseDurationMs);
      if (!claimed) {
        subLog.info("Run already claimed, skipping");
        return;
      }

      const budgets: Budgets = {
        maxSteps: job.maxSteps ?? 100,
        maxTimeMs: 600_000,
        maxTaps: 1_000,
        outsideAppLimit: 10,
        restartLimit: 3,
      };

      logger.info("Run claimed; starting worker", { ts: new Date().toISOString() } as Record<string, unknown>);
      const worker = new AgentWorker({ orchestrator, runDb, run: claimed, workerId, budgets, leaseDurationMs });

      const result = await worker.run();
      logger.info("Run completed", { status: result.status, emittedEventCount: result.emittedEventCount });
    } catch (err) {
      subLog.error("Run failed", err as Error);
      throw err;
    }
  },
});
