import { artifacts } from "~encore/clients";
import { artifactsBucket } from "../artifacts/bucket";
import type { EventPayloadMap } from "../agent/domain/events";
import { loggerWith, MODULES, GRAPH_ACTORS } from "../logging/logger";
import {
  computeLayoutHash,
  deriveDeterministicScreenId,
  normalizeUiHierarchyXml,
} from "./hasher";
import { buildOutcomeId, GraphProjectionRepo } from "./repo";
import type {
  GraphOutcomeKind,
  GraphProjectionCursor,
  ParsedRunEvent,
  RunMetadata,
} from "./types";

const POLL_INTERVAL_MS = 300;
const CURSOR_LIMIT = 50;
const HYDRATE_LIMIT = 20;
const EVENT_BATCH_SIZE = 100;

interface RunProjectionContext {
  metadata?: RunMetadata | null;
  pendingUiRefId: string | null;
  pendingStepOrdinal: number | null;
}

const repo = new GraphProjectionRepo();
const contexts = new Map<string, RunProjectionContext>();

let projectorRunning = false;

/**
 * startGraphProjector boots the background loop that projects run_events into the graph tables.
 * PURPOSE: Provides automatic propagation without requiring manual invocation per run.
 */
export function startGraphProjector(): void {
  if (projectorRunning) {
    return;
  }

  projectorRunning = true;
  void scheduleTick();
}

async function scheduleTick(): Promise<void> {
  try {
    await repo.hydrateMissingCursors(HYDRATE_LIMIT);
    const cursors = await repo.listCursors(CURSOR_LIMIT);

    for (const cursor of cursors) {
      await processRun(cursor);
    }
  } catch (err) {
    const logger = loggerWith({ module: MODULES.GRAPH, actor: GRAPH_ACTORS.PROJECTOR });
    logger.error("Graph projector tick failed", { err });
  } finally {
    setTimeout(() => {
      void scheduleTick();
    }, POLL_INTERVAL_MS);
  }
}

async function processRun(cursor: GraphProjectionCursor): Promise<void> {
  const logger = loggerWith({
    module: MODULES.GRAPH,
    actor: GRAPH_ACTORS.PROJECTOR,
    runId: cursor.runId,
  });

  const batchStartedAtMs = Date.now();
  const events = await repo.fetchEvents(cursor.runId, cursor.nextSeq, EVENT_BATCH_SIZE);
  if (events.length === 0) {
    return;
  }

  const context = ensureContext(cursor.runId);
  let lastSeq = cursor.nextSeq - 1;
  let projectedScreens = 0;

  for (const event of events) {
    lastSeq = event.seq;

    switch (event.kind) {
      case "agent.node.started": {
        handleNodeStartedEvent(event as ParsedRunEvent<"agent.node.started">, context);
        break;
      }
      case "agent.event.ui_hierarchy_captured": {
        handleUiHierarchyCapturedEvent(event as ParsedRunEvent<"agent.event.ui_hierarchy_captured">, context);
        break;
      }
      case "agent.event.screen_perceived": {
        const projected = await handleScreenPerceivedEvent(
          cursor.runId,
          event as ParsedRunEvent<"agent.event.screen_perceived">,
          context,
          logger,
        );
        if (projected) {
          projectedScreens += 1;
        }
        break;
      }
      case "agent.node.finished": {
        handleNodeFinishedEvent(event as ParsedRunEvent<"agent.node.finished">, context);
        break;
      }
      default:
        break;
    }
  }

  await repo.advanceCursor(cursor.runId, lastSeq + 1);

  logger.info("Projection batch processed", {
    eventsProcessed: events.length,
    projectedScreens,
    durationMs: Date.now() - batchStartedAtMs,
  });
}

function ensureContext(runId: string): RunProjectionContext {
  if (!contexts.has(runId)) {
    contexts.set(runId, {
      metadata: null,
      pendingUiRefId: null,
      pendingStepOrdinal: null,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return contexts.get(runId)!;
}

function handleNodeStartedEvent(
  event: ParsedRunEvent<"agent.node.started">,
  context: RunProjectionContext,
): void {
  const payload = event.payload as EventPayloadMap["agent.node.started"];
  if (payload.nodeName === "Perceive") {
    context.pendingStepOrdinal = payload.stepOrdinal;
  }
}

function handleNodeFinishedEvent(
  event: ParsedRunEvent<"agent.node.finished">,
  context: RunProjectionContext,
): void {
  const payload = event.payload as EventPayloadMap["agent.node.finished"];
  if (payload.nodeName === "Perceive") {
    context.pendingStepOrdinal = null;
    context.pendingUiRefId = null;
  }
}

function handleUiHierarchyCapturedEvent(
  event: ParsedRunEvent<"agent.event.ui_hierarchy_captured">,
  context: RunProjectionContext,
): void {
  const payload = event.payload as EventPayloadMap["agent.event.ui_hierarchy_captured"];
  context.pendingUiRefId = payload.refId;
}

async function handleScreenPerceivedEvent(
  runId: string,
  event: ParsedRunEvent<"agent.event.screen_perceived">,
  context: RunProjectionContext,
  logger: ReturnType<typeof loggerWith>,
): Promise<boolean> {
  const stepOrdinal = context.pendingStepOrdinal;
  if (stepOrdinal === null) {
    logger.warn("Missing step ordinal for screen_perceived; skipping", { eventSeq: event.seq });
    return false;
  }

  const metadata = await ensureRunMetadata(runId, context, logger);
  if (!metadata) {
    logger.error("Run metadata missing; cannot persist screen", { eventSeq: event.seq });
    return false;
  }

  const layoutHash = await resolveLayoutHash(metadata, context.pendingUiRefId, event.payload.perceptualHash64, logger);
  const screenId = deriveDeterministicScreenId(metadata.appPackage, layoutHash);

  const upsert = await repo.upsertScreen(screenId, metadata, layoutHash, event.payload.perceptualHash64);
  const outcomeKind: GraphOutcomeKind = upsert.isNew ? "discovered" : "mapped";
  const outcomeId = buildOutcomeId(runId, stepOrdinal);
  await repo.recordOutcome(outcomeId, runId, stepOrdinal, screenId, outcomeKind, event.seq);

  context.pendingUiRefId = null;
  context.pendingStepOrdinal = null;

  logger.info("Screen projected", {
    eventSeq: event.seq,
    stepOrdinal,
    outcomeKind,
    screenId,
  });

  return true;
}

async function ensureRunMetadata(
  runId: string,
  context: RunProjectionContext,
  logger: ReturnType<typeof loggerWith>,
): Promise<RunMetadata | null> {
  if (context.metadata) {
    return context.metadata;
  }

  const metadata = await repo.fetchRunMetadata(runId);
  if (!metadata) {
    logger.error("fetchRunMetadata returned null", {});
    return null;
  }

  context.metadata = metadata;
  return metadata;
}

async function resolveLayoutHash(
  metadata: RunMetadata,
  uiRefId: string | null,
  perceptualHash64: string,
  logger: ReturnType<typeof loggerWith>,
): Promise<string> {
  if (!uiRefId) {
    logger.warn("No UI hierarchy ref available; falling back to perceptual hash signature");
    return computeLayoutHash(metadata.appPackage, perceptualHash64);
  }

  try {
    await artifacts.getArtifactMeta(uiRefId);
  } catch (err) {
    logger.warn("Artifact metadata unavailable; falling back to perceptual hash", { err });
    return computeLayoutHash(metadata.appPackage, perceptualHash64);
  }

  try {
    const buffer = await artifactsBucket.download(uiRefId);
    const xml = buffer.toString("utf-8");
    const normalizedXml = normalizeUiHierarchyXml(xml);
    return computeLayoutHash(metadata.appPackage, normalizedXml);
  } catch (err) {
    logger.warn("Failed to download UI hierarchy; using perceptual hash signature", { err });
    return computeLayoutHash(metadata.appPackage, perceptualHash64);
  }
}


