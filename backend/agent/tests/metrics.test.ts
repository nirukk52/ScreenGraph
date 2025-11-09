import { describe, it, expect } from "vitest";
import { start } from "../../run/start";
import db from "../../db";
import { EXPECTED_UNIQUE_SCREENS_DISCOVERED } from "../../config/env";
// Import subscription to ensure it's loaded in encore test runtime
import "../orchestrator/subscription";

/**
 * Metrics Test
 * PURPOSE: Validates agent discovers expected number of screens deterministically.
 * 
 * REQUIRES:
 * - Subscription imported (line 6) to enable worker in encore test runtime
 * - Appium server running (auto-started by task command)
 * - Android device/emulator connected
 * 
 * ENVIRONMENT: encore test (isolated runtime with imported subscription)
 * 
 * Flow:
 * 1. Start run with app from .env (VITE_PACKAGE_NAME, VITE_APK_PATH, etc.)
 * 2. Worker processes job (subscription loaded in test runtime)
 * 3. Wait for run completion (poll every 2s, max 1min)
 * 4. Extract metrics from agent.run.finished event
 * 5. Query actual screens from graph_persistence_outcomes
 * 6. Assert both match EXPECTED_UNIQUE_SCREENS_DISCOVERED from .env
 */
describe("Metrics Test", () => {
  /**
   * Validates uniqueScreensDiscoveredCount matches expectation from .env.
   * PURPOSE: Ensures deterministic agent behavior for configured app.
   */
  it(
    "discovers expected number of screens",
    async () => {
      // Step 1: Read app config from environment (.env lines 7-9)
      const apkPath = process.env.VITE_APK_PATH;
      const appiumServerUrl = process.env.VITE_APPIUM_SERVER_URL || "http://127.0.0.1:4723/";
      const packageName = process.env.VITE_PACKAGE_NAME;
      const appActivity = process.env.VITE_APP_ACTIVITY || ".*";

      expect(apkPath, "VITE_APK_PATH must be set in .env").toBeDefined();
      expect(packageName, "VITE_PACKAGE_NAME must be set in .env").toBeDefined();
      expect(
        EXPECTED_UNIQUE_SCREENS_DISCOVERED,
        "EXPECTED_UNIQUE_SCREENS_DISCOVERED must be set in .env",
      ).toBeDefined();

      console.log(`[Test] Starting run for ${packageName}`);
      console.log(`[Test] APK: ${apkPath}`);
      console.log(`[Test] Expected screens: ${EXPECTED_UNIQUE_SCREENS_DISCOVERED}`);

      // Step 2: Start the run via Encore endpoint
      const startResponse = await start({
        apkPath: apkPath!,
        appiumServerUrl,
        packageName: packageName!,
        appActivity,
      });

      expect(startResponse.runId).toBeDefined();
      const runId = startResponse.runId;

      console.log(`[Test] Run started: ${runId}`);

      // Step 3: Wait for run to complete (poll run status)
      const maxWaitTimeMs = 1 * 60 * 1000; // 1 minutes
      const pollIntervalMs = 2000; // 2 seconds
      const startTime = Date.now();
      let runStatus = "running";
      let pollCount = 0;

      console.log(`[Test] Waiting for run to complete (max ${maxWaitTimeMs / 1000}s)...`);

      while (runStatus === "running" && Date.now() - startTime < maxWaitTimeMs) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        pollCount++;

        const statusRow = await db.queryRow<{
          status: string;
          stop_reason: string | null;
        }>`
          SELECT status, stop_reason
          FROM runs
          WHERE run_id = ${runId}
        `;

        expect(statusRow, `Run ${runId} should exist in database`).toBeDefined();
        runStatus = statusRow!.status;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`[Test] Poll #${pollCount} (${elapsed}s): status=${runStatus}`);

        if (runStatus === "completed" || runStatus === "failed" || runStatus === "canceled") {
          break;
        }
      }

      const totalDuration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[Test] Run finished in ${totalDuration}s with status: ${runStatus}`);

      // Step 4: Assert run completed successfully
      if (runStatus === "queued") {
        throw new Error(
          `Run stayed in 'queued' status for ${totalDuration}s.\n\n` +
            `CAUSE: Agent worker subscription not processing jobs.\n` +
            `REQUIRED: Subscription must be imported (see line 6: import "../orchestrator/subscription")\n\n` +
            `If subscription is imported, check:\n` +
            `1. Appium server is running (http://127.0.0.1:4723/)\n` +
            `2. Android device/emulator is connected (adb devices)\n` +
            `3. Backend logs for worker errors`,
        );
      }

      // If run failed, get stop_reason and last events for debugging
      if (runStatus === "failed") {
        const statusRow = await db.queryRow<{
          status: string;
          stop_reason: string | null;
        }>`
          SELECT status, stop_reason
          FROM runs
          WHERE run_id = ${runId}
        `;
        
        const stopReason = statusRow?.stop_reason || "unknown";
        
        // Get last few events to see what happened
        const lastEvents = await db.query<{
          kind: string;
          sequence: number;
        }>`
          SELECT kind, sequence
          FROM run_events
          WHERE run_id = ${runId}
          ORDER BY sequence DESC
          LIMIT 5
        `;
        
        const eventsList: string[] = [];
        for await (const event of lastEvents) {
          eventsList.push(`${event.sequence}: ${event.kind}`);
        }
        
        // Get last agent state to see which node failed
        const lastState = await db.queryRow<{
          snapshot: Record<string, unknown>;
        }>`
          SELECT snapshot
          FROM agent_state_snapshots
          WHERE run_id = ${runId}
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        const lastNode = lastState?.snapshot.nodeName as string || "unknown";
        
        throw new Error(
          `Run failed with stop_reason: ${stopReason}\n\n` +
            `Last node: ${lastNode}\n` +
            `Last events:\n${eventsList.join('\n')}\n\n` +
            `Common cause: WebDriver session error (Appium session lost)\n` +
            `Fix: Ensure Appium is stable and not timing out sessions.\n\n` +
            `Debug with Encore MCP (requires 'encore run'):\n` +
            `  mcp_encore-mcp_query_database to inspect full event timeline`,
        );
      }

      expect(
        runStatus,
        `Run should complete within ${maxWaitTimeMs / 1000}s, but got status: ${runStatus}`,
      ).toBe("completed");

      // Step 5: Extract metrics from agent.run.finished event
      const finishedEvent = await db.queryRow<{
        payload: Record<string, unknown>;
      }>`
        SELECT payload
        FROM run_events
        WHERE run_id = ${runId}
          AND kind = 'agent.run.finished'
        ORDER BY sequence DESC
        LIMIT 1
      `;

      expect(
        finishedEvent,
        `agent.run.finished event should exist for run ${runId}`,
      ).toBeDefined();

      const payload = finishedEvent!.payload;
      expect(payload).toHaveProperty("metrics");

      const metrics = payload.metrics as Record<string, unknown>;
      expect(metrics).toHaveProperty("uniqueScreensDiscoveredCount");

      const reportedScreenCount = metrics.uniqueScreensDiscoveredCount as number;
      console.log(`[Test] Reported uniqueScreensDiscoveredCount from event: ${reportedScreenCount}`);

      // Step 6: Query actual discovered screens from graph
      const actualScreenCount = await db.queryRow<{
        discovered_count: string;
      }>`
        SELECT COUNT(DISTINCT screen_id)::text as discovered_count
        FROM graph_persistence_outcomes
        WHERE run_id = ${runId}
          AND upsert_kind = 'discovered'
      `;

      expect(
        actualScreenCount,
        "Graph should have discovered screens recorded",
      ).toBeDefined();

      const actualCount = Number.parseInt(actualScreenCount!.discovered_count, 10);
      console.log(`[Test] Actual screens discovered in graph DB: ${actualCount}`);

      // Step 7: Assert metrics match reality (event payload == database)
      expect(
        reportedScreenCount,
        `Event metric (${reportedScreenCount}) should match graph DB (${actualCount})`,
      ).toBe(actualCount);

      // Step 8: Assert deterministic expectation from .env
      expect(
        actualCount,
        `Agent should discover exactly ${EXPECTED_UNIQUE_SCREENS_DISCOVERED} screen(s) for ${packageName} (from .env EXPECTED_UNIQUE_SCREENS_DISCOVERED)`,
      ).toBe(EXPECTED_UNIQUE_SCREENS_DISCOVERED);

      console.log(
        `[Test] ✅ SUCCESS: Agent discovered ${actualCount} screen(s), matching expected ${EXPECTED_UNIQUE_SCREENS_DISCOVERED}`,
      );
    },
    { timeout: 5 * 60 * 1000 }, // 5 minute timeout
  );
});

