import { Subscription } from "encore.dev/pubsub";
import { runJobTopic } from "./start";
import { RunJob } from "./types";
import { runAgentLoop } from "./agent-runner";

new Subscription(runJobTopic, "orchestrator-worker", {
  handler: async (job: RunJob) => {
    console.log(`[Orchestrator] Starting run ${job.runId} with apk: ${job.apkPath}`);

    try {
      await runAgentLoop(
        job.runId,
        job.apkPath,
        job.appiumServerUrl,
        job.packageName,
        job.appActivity,
      );
      console.log(`[Orchestrator] Run ${job.runId} completed successfully`);
    } catch (err) {
      console.error(`[Orchestrator] Run ${job.runId} failed:`, err);
      throw err;
    }
  },
});
