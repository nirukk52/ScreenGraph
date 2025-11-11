import type { ActionCandidate } from "../../domain/actions";
import type { EventKind } from "../../domain/events";
import type { GraphPersistenceOutcome } from "../../domain/graph";
import type { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import type { GraphPort } from "../../ports/graph";

export interface PersistInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  perceptualHash: string;
  screenshotRefId: string;
  uiHierarchyXmlRefId: string;
  actionCandidate: ActionCandidate | null;
  actionExecutionStatus: string | null;
  previousScreenPerceptualHash: string | null;
}

export interface PersistOutput extends CommonNodeOutput {
  graphPersistenceOutcome: GraphPersistenceOutcome;
}

/**
 * Persist node saves screens and actions to the exploration graph.
 * Creates or updates screen nodes and action edges in the graph database.
 */
export async function persist(
  input: PersistInput,
  graph: GraphPort,
): Promise<{
  output: PersistOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const events: Array<{ kind: EventKind; payload: Record<string, unknown> }> = [];

  // Persist current screen
  const screenRecordIdentity = await graph.persistScreen(
    input.perceptualHash,
    input.screenshotRefId,
    input.uiHierarchyXmlRefId,
    {
      runId: input.runId,
      stepOrdinal: input.stepOrdinal,
      iterationOrdinal: input.iterationOrdinalNumber,
    },
  );

  if (screenRecordIdentity.isNewDiscovery) {
    events.push({
      kind: "graph.screen.discovered",
      payload: {
        runId: input.runId,
        stepOrdinal: input.stepOrdinal,
        screenId: screenRecordIdentity.screenId,
        perceptualHash: screenRecordIdentity.perceptualHash,
      },
    });
  }

  // Persist action if present
  let actionRecordIdentity = null;
  if (input.actionCandidate && input.actionExecutionStatus && input.previousScreenPerceptualHash) {
    const previousScreen = await graph.findScreenByHash(input.previousScreenPerceptualHash);
    if (previousScreen) {
      actionRecordIdentity = await graph.persistAction(
        previousScreen.screenId,
        screenRecordIdentity.screenId,
        input.actionCandidate,
        input.actionExecutionStatus,
      );

      events.push({
        kind: "graph.action.created",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          actionId: actionRecordIdentity.actionId,
          sourceScreenId: actionRecordIdentity.sourceScreenId,
          targetScreenId: actionRecordIdentity.targetScreenId,
          actionKind: input.actionCandidate.actionKind,
        },
      });
    }
  }

  // Get graph statistics
  const stats = await graph.getGraphStatistics();

  events.push({
    kind: "graph.updated",
    payload: {
      runId: input.runId,
      stepOrdinal: input.stepOrdinal,
      totalScreens: stats.totalScreens,
      totalActions: stats.totalActions,
      totalUniqueScreens: stats.totalUniqueScreens,
    },
  });

  const graphPersistenceOutcome: GraphPersistenceOutcome = {
    screenRecordIdentity,
    actionRecordIdentity,
    totalScreensInGraph: stats.totalScreens,
    totalActionsInGraph: stats.totalActions,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "Persist",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      graphPersistenceOutcome,
    },
    events,
  };
}
