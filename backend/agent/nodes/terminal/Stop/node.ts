import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { EventKind } from "../../../domain/events";
import db from "../../../../db";

export interface StopInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  intendedTerminalDisposition: "SUCCEEDED" | "FAILED";
  terminalizationBasis: string;
  finalRunMetrics: {
    totalIterationsExecuted: number;
    uniqueScreensDiscoveredCount: number;
    uniqueActionsPersistedCount: number;
    runDurationInMilliseconds: number;
  };
}

export interface StopOutput extends CommonNodeOutput {
  runId: string;
  confirmedTerminalDisposition: "SUCCEEDED" | "FAILED";
}

/**
 * stop finalizes the run and emits terminal disposition telemetry.
 * PURPOSE: Provides a deterministic completion point for the agent orchestration loop.
 */
export async function stop(
  input: StopInput,
): Promise<{
  output: StopOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  // Query actual discovered screens from graph_persistence_outcomes
  const discoveredScreensRows = await db.query<{ count: number }>`
    SELECT COUNT(DISTINCT screen_id) as count
    FROM graph_persistence_outcomes
    WHERE run_id = ${input.runId}
      AND outcome_kind = 'discovered'
  `;

  let actualDiscoveredScreens = 0;
  for await (const row of discoveredScreensRows) {
    actualDiscoveredScreens = row.count;
  }

  // Override the counter with actual database count
  const correctedMetrics = {
    ...input.finalRunMetrics,
    uniqueScreensDiscoveredCount: actualDiscoveredScreens,
  };

  const output: StopOutput = {
    runId: input.runId,
    confirmedTerminalDisposition: input.intendedTerminalDisposition,
    nodeName: "Stop",
    stepOrdinal: input.stepOrdinal,
    iterationOrdinalNumber: input.iterationOrdinalNumber,
    policyVersion: 1,
    resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
    randomSeed: input.randomSeed,
    nodeExecutionOutcomeStatus: "SUCCESS",
    errorId: null,
    retryable: null,
    humanReadableFailureSummary: null,
  };

  return {
    output,
    events: [
      {
        kind: "agent.run.finished",
        payload: {
          disposition: input.intendedTerminalDisposition,
          basis: input.terminalizationBasis,
          metrics: correctedMetrics,
        },
      },
    ],
  };
}

