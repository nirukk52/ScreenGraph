import { Subscription } from "encore.dev/pubsub";
import { runJobTopic } from "../../run/start";
import type { RunJob } from "../../run/types";
import { Orchestrator } from "./orchestrator";
import { RunDbRepo } from "../persistence/run-db.repo";
import { RunEventsRepo } from "../persistence/run-events.repo";
import { AgentStateRepo } from "../persistence/agent-state.repo";
import { RunOutboxRepo } from "../persistence/run-outbox.repo";
import type { Budgets } from "../domain/state";
import { AgentWorker } from "./worker";

/**
 * Encore subscription that listens for RunJob messages and executes agent runs.
 * This keeps the agent domain self-contained by handling job processing within the agent layer.
 */
new Subscription(runJobTopic, "agent-orchestrator-worker", {
  handler: async (job: RunJob) => {
    console.log(`[AgentOrchestrator] Starting run ${job.runId} with apk: ${job.apkPath}`);

    try {
      const runDb = new RunDbRepo();
      const eventsDb = new RunEventsRepo();
      const agentStateDb = new AgentStateRepo();
      const outboxDb = new RunOutboxRepo();
      const orchestrator = new Orchestrator(runDb, eventsDb, agentStateDb, outboxDb);

      const workerId = `worker-${process.env.HOSTNAME ?? "local"}-${Date.now()}`;
      const leaseDurationMs = 30_000;

      const claimed = await runDb.claimRun(job.runId, workerId, leaseDurationMs);
      if (!claimed) {
        console.log(`[AgentOrchestrator] Run ${job.runId} already claimed, skipping`);
        return;
      }

      const budgets: Budgets = {
        maxSteps: job.maxSteps ?? 100,
        maxTimeMs: 600_000,
        maxTaps: 1_000,
        outsideAppLimit: 10,
        restartLimit: 3,
      };

      const worker = new AgentWorker({ orchestrator, runDb, run: claimed, workerId, budgets, leaseDurationMs });

      const result = await worker.run();
      console.log(
        `[AgentOrchestrator] Run ${job.runId} completed with status ${result.status} and ${result.emittedEventCount} events`,
      );
    } catch (err) {
      console.error(`[AgentOrchestrator] Run ${job.runId} failed:`, err);
      throw err;
    }
  },
});
