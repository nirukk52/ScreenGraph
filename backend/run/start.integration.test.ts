import { describe, expect, it } from "vitest";
import db from "../db";
import { start } from "./start";

// ✅ CRITICAL: Import all services needed for full integration test
import "../agent/orchestrator/subscription"; // Worker subscription
import "../artifacts/store"; // Artifacts storage
import "../artifacts/get"; // Artifacts retrieval
import "../graph/encore.service.ts"; // Graph projection service

/**
 * Integration Test: POST /run/start → Agent discovers screens
 *
 * PURPOSE: Test the REAL user flow - not petty unit tests.
 *
 * Flow:
 * 1. User calls POST /run/start
 * 2. Worker picks up job (subscription loaded above)
 * 3. Agent runs and discovers screens
 * 4. Verify: countUniqueScreensDiscovered >= 1
 *
 * Requirements:
 * - Appium running: http://127.0.0.1:4723
 * - Android device/emulator connected
 * - APK in .env (VITE_APK_PATH)
 *
 * Run: encore test ./run/start.integration.test.ts
 */

describe("Integration: POST /run/start discovers screens", () => {
  it(
    "should discover at least 1 unique screen",
    async () => {
      // GIVEN: App configuration from environment
      const apkPath = process.env.VITE_APK_PATH || "/path/to/test.apk";
      const packageName = process.env.VITE_PACKAGE_NAME || "com.test.app";
      const appiumServerUrl = process.env.VITE_APPIUM_SERVER_URL || "http://127.0.0.1:4723/";

      console.log(`[Test] Starting run for ${packageName}`);

      // WHEN: Call POST /run/start
      const response = await start({
        apkPath,
        appiumServerUrl,
        packageName,
        appActivity: ".*",
        maxSteps: 20, // Enough for retries + main loop
      });

      const { runId } = response;
      console.log(`[Test] Run started: ${runId}`);

      // THEN: Wait for run to complete
      const maxWaitMs = 60_000; // 1 minute
      const pollIntervalMs = 2000; // 2 seconds
      const startTime = Date.now();

      let runStatus = "queued";
      let pollCount = 0;

      while (Date.now() - startTime < maxWaitMs) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        pollCount++;

        // Check for launch failure first (fast-fail)
        const launchFailedEvent = await db.queryRow<{
          payload: string;
        }>`
          SELECT payload
          FROM run_events
          WHERE run_id = ${runId}
            AND kind = 'agent.app.launch_failed'
          ORDER BY seq DESC
          LIMIT 1
        `;

        if (launchFailedEvent) {
          const payload = JSON.parse(launchFailedEvent.payload);
          throw new Error(
            `❌ App launch failed!

Package: ${payload.packageId || "unknown"}
Error: ${payload.errorKind || "unknown"}
Attempt: ${payload.attempt || 0}
Duration: ${payload.durationMs || 0}ms

Common causes:
- Appium not running (http://127.0.0.1:4723)
- Device not connected (adb devices)
- App not installed or installation failed
- Appium server misconfigured (check --allow-insecure flags)`,
          );
        }

        const row = await db.queryRow<{ status: string; stop_reason: string | null }>`
          SELECT status, stop_reason
          FROM runs
          WHERE run_id = ${runId}
        `;

        if (!row) {
          throw new Error(`Run ${runId} not found in database`);
        }

        runStatus = row.status;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`[Test] Poll #${pollCount} (${elapsed}s): status=${runStatus}`);

        if (runStatus === "completed" || runStatus === "failed" || runStatus === "cancelled") {
          break;
        }
      }

      // THEN: Run should not stay queued (means worker didn't pick it up)
      if (runStatus === "queued") {
        throw new Error(
          `❌ Run stayed 'queued' - worker subscription not working!\n\n` +
            `This means: import "../agent/orchestrator/subscription" didn't load.\n` +
            "Check: Is subscription file being imported in encore.service.ts?",
        );
      }

      // THEN: Run should complete successfully
      if (runStatus === "failed") {
        // Get failure details
        const row = await db.queryRow<{ stop_reason: string | null }>`
          SELECT stop_reason FROM runs WHERE run_id = ${runId}
        `;

        const lastEvents: { kind: string; seq: number }[] = [];
        for await (const event of db.query<{ kind: string; seq: number }>`
          SELECT kind, seq
          FROM run_events
          WHERE run_id = ${runId}
          ORDER BY seq DESC
          LIMIT 5
        `) {
          lastEvents.push(event);
        }

        throw new Error(
          `❌ Run failed: ${row?.stop_reason || "unknown"}\n\nLast events:\n${lastEvents.map((e) => `  ${e.seq}: ${e.kind}`).join("\n")}\n\nCommon causes:\n- Appium not running (http://127.0.0.1:4723)\n- Device not connected (adb devices)\n- APK path invalid (${apkPath})`,
        );
      }

      expect(runStatus).toBe("completed");
      console.log("[Test] ✅ Run completed successfully");

      // THEN: Wait for graph projector to process events (runs async after agent completes)
      console.log("[Test] Waiting for graph projection...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Give projector time to process (polls every 300ms)

      // THEN: Verify screens were discovered
      const screenCount = await db.queryRow<{ count: string }>`
        SELECT COUNT(*)::text as count
        FROM graph_persistence_outcomes
        WHERE run_id = ${runId}
          AND upsert_kind = 'discovered'
      `;

      const count = Number.parseInt(screenCount?.count || "0", 10);
      console.log(`[Test] Screens discovered: ${count}`);

      // MAIN ASSERTION: At least 1 screen discovered
      expect(count).toBeGreaterThanOrEqual(1);
      console.log(`[Test] ✅ SUCCESS: Agent discovered ${count} screen(s)`);

      // Cleanup
      await db.exec`
        DELETE FROM graph_persistence_outcomes WHERE run_id = ${runId}
      `;
      await db.exec`
        DELETE FROM run_events WHERE run_id = ${runId}
      `;
      await db.exec`
        DELETE FROM run_state_snapshots WHERE run_id = ${runId}
      `;
      await db.exec`
        DELETE FROM runs WHERE run_id = ${runId}
      `;
    },
    { timeout: 90_000 }, // 90 second timeout
  );
});
