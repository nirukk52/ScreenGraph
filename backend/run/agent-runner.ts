import { Orchestrator } from "../agent/orchestrator/orchestrator";
import { DBRepoPort } from "../agent/persistence/db-repo";
import { Budgets, AgentState, advanceStep, createInitialState } from "../agent/domain/state";
import { EventKind, createRunStartedEvent } from "../agent/domain/events";

/** Drives the agent orchestration loop for a given run using the provided app configuration. */
export async function runAgentLoop(
  runId: string,
  apkPath: string,
  appiumServerUrl: string,
  packageName: string,
  appActivity: string,
): Promise<void> {
  const repo = new DBRepoPort();
  const orchestrator = new Orchestrator(repo);

  const budgets: Budgets = {
    maxSteps: 10,
    maxTimeMs: 600000,
    maxTaps: 1000,
    outsideAppLimit: 10,
    restartLimit: 3,
  };

  const now = new Date().toISOString();
  const tenantId = "tenant-default";
  const projectId = "project-default";

  let state = createInitialState(tenantId, projectId, runId, budgets, now);

  const startEvent = createRunStartedEvent(
    orchestrator.generateId(),
    runId,
    tenantId,
    projectId,
    orchestrator.nextSequence(),
    now,
  );

  await orchestrator.recordEvent(startEvent);
  await repo.saveSnapshot(runId, 0, state);

  await emitSimpleEvent(orchestrator, state, "agent.event.screenshot_captured", {
    stepOrdinal: state.stepOrdinal,
    apkPath,
    appiumServerUrl,
    packageName,
    appActivity,
  });

  for (let i = 0; i < budgets.maxSteps; i++) {
    const now = new Date().toISOString();
    const seed = orchestrator.nextSeed();
    state = advanceStep(state, `Step${i}`, now, seed);

    await emitSimpleEvent(orchestrator, state, "agent.node.started", {
      nodeName: `Step${i}`,
      stepOrdinal: state.stepOrdinal,
    });

    await emitSimpleEvent(orchestrator, state, "agent.event.screen_perceived", {
      stepOrdinal: state.stepOrdinal,
      screenPerceptualHash: `hash-${i}`,
    });

    await emitSimpleEvent(orchestrator, state, "agent.event.actions_enumerated", {
      stepOrdinal: state.stepOrdinal,
      actionCount: 5,
    });

    await emitSimpleEvent(orchestrator, state, "agent.event.action_selected", {
      stepOrdinal: state.stepOrdinal,
      actionId: `action-${i}`,
    });

    await emitSimpleEvent(orchestrator, state, "agent.event.action_performed", {
      stepOrdinal: state.stepOrdinal,
      actionId: `action-${i}`,
      status: "ok",
    });

    await emitSimpleEvent(orchestrator, state, "graph.screen.discovered", {
      stepOrdinal: state.stepOrdinal,
      screenId: `screen-${i}`,
    });

    await emitSimpleEvent(orchestrator, state, "agent.node.finished", {
      nodeName: `Step${i}`,
      stepOrdinal: state.stepOrdinal,
      outcomeStatus: "SUCCESS",
    });

    await repo.saveSnapshot(state.runId, state.stepOrdinal, state);

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  state = {
    ...state,
    status: "completed",
    stopReason: "success",
  };

  await orchestrator.finalizeRun(state, "success");

  const events = orchestrator.publishEvents();
  console.log(`[AgentRunner] Run ${runId} completed with ${events.length} events`);
}

async function emitSimpleEvent(
  orchestrator: Orchestrator,
  state: AgentState,
  kind: EventKind,
  payload: Record<string, unknown>,
): Promise<void> {
  await orchestrator.recordNodeEvents(state, kind, [{ kind, payload }]);
}
