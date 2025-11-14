import log from "encore.dev/log";
import db from "../../../../db";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { EventKind } from "../../../domain/events";
import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";

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
export async function stop(input: StopInput): Promise<{
  output: StopOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "Stop",
  });
  logger.info("Stop INPUT", {
    input: {
      runId: input.runId,
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      intendedTerminalDisposition: input.intendedTerminalDisposition,
      terminalizationBasis: input.terminalizationBasis,
      finalRunMetrics: input.finalRunMetrics,
    },
  });

  // Use metrics from input (DB query removed to fix regression)
  const correctedMetrics = input.finalRunMetrics;

  logger.info("Stop node details", {
    metrics: correctedMetrics,
    stepOrdinal: input.stepOrdinal,
    iterationOrdinalNumber: input.iterationOrdinalNumber,
  });

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

  logger.info("Stop OUTPUT", {
    output: {
      runId: output.runId,
      confirmedTerminalDisposition: output.confirmedTerminalDisposition,
      stepOrdinal: output.stepOrdinal,
      correctedMetrics,
    },
  });

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
