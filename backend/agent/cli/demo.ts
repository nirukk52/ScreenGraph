import log from "encore.dev/log";
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
  const logger = log.with({ module: "demo-cli", actor: "demo" });
  logger.info("ScreenGraph Agent Demo Starting");

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

  logger.info("Run initialized", { runId, maxSteps: budgets.maxSteps, maxTimeMs: budgets.maxTimeMs });

  const runRecord = await repo.claimRun(runId, "demo-worker", 30_000);
  if (!runRecord) {
    throw new Error("Failed to claim run in demo");
  }

  const { state } = await orchestrator.initialize(runRecord, budgets);
  logger.info("Run created");

  logger.info("Starting setup phase");

  logger.info("Step 1: EnsureDevice");
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
  logger.info("Device session created", { deviceRuntimeContextId: deviceResult.output.deviceRuntimeContextId });

  logger.info("Step 2: ProvisionApp");
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
  logger.info("App provisioned", { appPresenceStatus: provisionResult.output.applicationProvisioningOutcome.appPresenceStatus });

  // TODO: Implement LaunchOrAttach and WaitIdle capsules
  logger.info("Step 3: LaunchOrAttach (Skipped - not yet migrated to capsule)");
  state.applicationForegroundContextId = "fake-context-id";
  await repo.saveSnapshot(runId, 2, state);
  logger.info("App foreground context set", { applicationForegroundContextId: state.applicationForegroundContextId });

  logger.info("Step 4: WaitIdle (Skipped - not yet migrated to capsule)");
  await repo.saveSnapshot(runId, 3, state);
  logger.info("Quiet window completed", { quietWindowMs: 500 });

  logger.info("Starting main loop with 3 iterations");

  for (let i = 1; i <= 3; i++) {
    logger.info("Iteration progress", { iteration: i });
    state.iterationOrdinalNumber = i;
    state.stepOrdinal++;
    state.counters.stepsTotal++;
    await repo.saveSnapshot(runId, state.stepOrdinal, state);
    logger.info("Step completed", { stepOrdinal: state.stepOrdinal });
  }

  logger.info("Starting terminal phase");

  logger.info("Step Final: Stop");
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
  logger.info("Terminal disposition set", { confirmedTerminalDisposition: stopResult.output.confirmedTerminalDisposition });

  const allEvents = await repo.getEvents(runId);
  logger.info("Demo completed successfully", {
    totalEvents: allEvents.length,
    totalSteps: state.counters.stepsTotal,
    status: state.status,
    stopReason: state.stopReason,
  });

  return { runId, state, events: allEvents };
}

if (require.main === module) {
  runDemo().catch((err) => {
    log.error("Demo failed", { err: String(err) });
    process.exit(1);
  });
}

export { runDemo };
