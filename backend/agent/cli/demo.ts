import { Orchestrator } from "../orchestrator/orchestrator";
import { InMemoryRepo } from "../persistence/in-memory-repo";
import { FakeSessionPort } from "../adapters/fakes/fake-session.port";
import { FakeStorage } from "../adapters/fakes/fake-storage";
import { FakeLLM } from "../adapters/fakes/fake-llm";
import { FakeOCR } from "../adapters/fakes/fake-ocr";
import type { Budgets } from "../domain/state";
const policyDefaults = {
  maxSteps: 50,
  maxTimeMs: 300000,
  maxTaps: 100,
  outsideAppLimit: 3,
  restartLimit: 2,
  idleHeuristics: { minQuietMillis: 400, maxWaitMillis: 5000 },
  enumerationHeuristics: { maxActionsPerScreen: 20, includeBackNavigationAction: true },
};
import { ensureDevice } from "../nodes/setup/EnsureDevice/node";
import { provisionApp } from "../nodes/setup/ProvisionApp/node";
// TODO: Create LaunchOrAttach and WaitIdle capsules
// import { launchOrAttach } from "../nodes/setup/LaunchOrAttach/node";
// import { waitIdle } from "../nodes/setup/WaitIdle/node";
import { stop } from "../nodes/terminal/Stop/node";

async function runDemo() {
  console.log("🚀 ScreenGraph Agent Demo Starting...\n");

  const repo = new InMemoryRepo();
  const orchestrator = new Orchestrator(repo, repo, repo, repo);
  const sessionPort = new FakeSessionPort();
  const storage = new FakeStorage();
  const ocr = new FakeOCR();
  const llm = new FakeLLM(storage, 42);

  const runId = orchestrator.generateId();
  const tenantId = "01TENANT00000000000000";
  const projectId = "01PROJECT0000000000000";

  const budgets: Budgets = {
    maxSteps: policyDefaults.maxSteps,
    maxTimeMs: policyDefaults.maxTimeMs,
    maxTaps: policyDefaults.maxTaps,
    outsideAppLimit: policyDefaults.outsideAppLimit,
    restartLimit: policyDefaults.restartLimit,
    appLaunchTimeoutMs: 30000,
    appRestartTimeoutMs: 15000,
  };

  console.log(`📋 Run ID: ${runId}`);
  console.log(`🎯 Budgets: maxSteps=${budgets.maxSteps}, maxTimeMs=${budgets.maxTimeMs}ms\n`);

  const runRecord = await repo.claimRun(runId, "demo-worker", 30_000);
  if (!runRecord) {
    throw new Error("Failed to claim run in demo");
  }

  const { state } = await orchestrator.initialize(runRecord, budgets);
  console.log("✅ Run created\n");

  console.log("=== SETUP PHASE ===\n");

  console.log("🔧 Step 1: EnsureDevice");
  const deviceResult = await ensureDevice(
    {
      runId,
      tenantId,
      projectId,
      iterationOrdinalNumber: 0,
      deviceConfiguration: {
        platformName: "android",
        deviceName: "Pixel_7_Emu",
        platformVersion: "14",
        appiumServerUrl: "http://127.0.0.1:4723",
      },
      driverReusePolicy: "REUSE_OR_CREATE",
    },
    sessionPort,
    () => orchestrator.generateId(),
  );
  state.deviceRuntimeContextId = deviceResult.output.deviceRuntimeContextId;
  await orchestrator.recordNodeEvents(state, "EnsureDevice", deviceResult.events as never);
  await repo.saveSnapshot(runId, 0, state);
  console.log(`   → Device session: ${deviceResult.output.deviceRuntimeContextId}\n`);

  console.log("📦 Step 2: ProvisionApp");
  if (!state.deviceRuntimeContextId) {
    throw new Error("Device runtime context ID is missing");
  }
  const provisionResult = await provisionApp({
    runId,
    tenantId,
    projectId,
    deviceRuntimeContextId: state.deviceRuntimeContextId,
    applicationUnderTestDescriptor: {
      androidPackageId: "com.example.app",
      apkStorageObjectReference: "s3://bucket/builds/app-1.2.3.apk",
      expectedBuildSignatureSha256: "ab12...",
    },
    installationPolicy: "INSTALL_IF_MISSING",
  });
  await orchestrator.recordNodeEvents(state, "ProvisionApp", provisionResult.events as never);
  await repo.saveSnapshot(runId, 1, state);
  console.log(
    `   → App status: ${provisionResult.output.applicationProvisioningOutcome.appPresenceStatus}\n`,
  );

  // TODO: Implement LaunchOrAttach and WaitIdle capsules
  console.log("🚀 Step 3: LaunchOrAttach (Skipped - not yet migrated to capsule)");
  state.applicationForegroundContextId = "fake-context-id";
  await repo.saveSnapshot(runId, 2, state);
  console.log(`   → App foreground context: ${state.applicationForegroundContextId}\n`);

  console.log("⏳ Step 4: WaitIdle (Skipped - not yet migrated to capsule)");
  await repo.saveSnapshot(runId, 3, state);
  console.log(`   → Quiet window: 500ms\n`);

  console.log("=== MAIN LOOP (Stubbed - 3 iterations) ===\n");

  for (let i = 1; i <= 3; i++) {
    console.log(`🔄 Iteration ${i}`);
    state.iterationOrdinalNumber = i;
    state.stepOrdinal++;
    state.counters.stepsTotal++;
    await repo.saveSnapshot(runId, state.stepOrdinal, state);
    console.log(`   → Step ${state.stepOrdinal} completed\n`);
  }

  console.log("=== TERMINAL PHASE ===\n");

  console.log("🛑 Step Final: Stop");
  const stopResult = await stop({
    runId,
    stepOrdinal: state.stepOrdinal + 1,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: orchestrator.nextSeed(),
    intendedTerminalDisposition: "SUCCEEDED",
    terminalizationBasis: "ROUTED_STOP",
    finalRunMetrics: {
      totalIterationsExecuted: state.iterationOrdinalNumber,
      uniqueScreensDiscoveredCount: state.counters.screensNew,
      uniqueActionsPersistedCount: 0,
      runDurationInMilliseconds: 5000,
    },
  });
  await orchestrator.recordNodeEvents(state, "Stop", stopResult.events);
  state.status = "completed";
  state.stopReason = "success";
  await repo.saveSnapshot(runId, state.stepOrdinal + 1, state);

  await orchestrator.finalizeRun(state, "success");
  console.log(`   → Terminal disposition: ${stopResult.output.confirmedTerminalDisposition}\n`);

  const allEvents = await repo.getEvents(runId);
  console.log("📊 Final Stats:");
  console.log(`   - Total events: ${allEvents.length}`);
  console.log(`   - Total steps: ${state.counters.stepsTotal}`);
  console.log(`   - Status: ${state.status}`);
  console.log(`   - Stop reason: ${state.stopReason}\n`);

  console.log("✅ Demo completed successfully!\n");
  return { runId, state, events: allEvents };
}

if (require.main === module) {
  runDemo().catch((err) => {
    console.error("❌ Demo failed:", err);
    process.exit(1);
  });
}

export { runDemo };
