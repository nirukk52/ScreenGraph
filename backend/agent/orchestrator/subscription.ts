import log from "encore.dev/log";
import { Subscription } from "encore.dev/pubsub";
import { WORKTREE_NAME } from "../../config/env";
import { AGENT_ACTORS, MODULES } from "../../logging/logger";
import { runJobTopic } from "../../run/start";
import type { RunJob } from "../../run/types";
import type { Budgets } from "../domain/state";
import { AgentStateRepo } from "../persistence/agent-state.repo";
import { RunDbRepo } from "../persistence/run-db.repo";
import { RunEventsRepo } from "../persistence/run-events.repo";
import { RunOutboxRepo } from "../persistence/run-outbox.repo";
import { Orchestrator } from "./orchestrator";
import { AgentWorker } from "./worker";

/**
 * Encore subscription that listens for RunJob messages and executes agent runs.
 * This keeps the agent domain self-contained by handling job processing within the agent layer.
 */
new Subscription(runJobTopic, "agent-orchestrator-worker", {
  handler: async (job: RunJob) => {
    const subLog = log.with({
      module: MODULES.AGENT,
      actor: AGENT_ACTORS.SUBSCRIPTION,
      runId: job.runId,
    });
    subLog.info("Run job received", { apkPath: job.apkPath, maxSteps: job.maxSteps });

    try {
      const runDb = new RunDbRepo();
      const eventsDb = new RunEventsRepo();
      const agentStateDb = new AgentStateRepo();
      const outboxDb = new RunOutboxRepo();
      const orchestrator = new Orchestrator(runDb, eventsDb, agentStateDb, outboxDb);

      const hostname = process.env.HOSTNAME ?? WORKTREE_NAME ?? "local";
      const workerId = `worker-${hostname}-${Date.now()}`;
      const leaseDurationMs = 30_000;

      const logger = subLog.with({ workerId });
      logger.info("Attempting to claim run");

      let claimed: boolean;
      try {
        claimed = await runDb.claimRun(job.runId, workerId, leaseDurationMs);
      } catch (claimErr) {
        logger.error("Failed to claim run", {
          error: claimErr instanceof Error ? claimErr.message : String(claimErr),
          stack: claimErr instanceof Error ? claimErr.stack : undefined,
        });
        throw claimErr;
      }

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
        appLaunchTimeoutMs: 30_000,
        appRestartTimeoutMs: 15_000,
      };

      logger.info("Run claimed; starting worker", { ts: new Date().toISOString() } as Record<
        string,
        unknown
      >);
      const worker = new AgentWorker({
        orchestrator,
        runDb,
        run: claimed,
        workerId,
        budgets,
        leaseDurationMs,
        jobConfig: {
          runId: job.runId,
          appiumServerUrl: job.appiumServerUrl,
          packageName: job.packageName,
          apkPath: job.apkPath,
          appActivity: job.appActivity,
        },
      });

      const result = await worker.run();
      logger.info("Run completed", {
        status: result.status,
        emittedEventCount: result.emittedEventCount,
      });
    } catch (err) {
      subLog.error("Run failed", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      });
      throw err;
    }
  },
});
