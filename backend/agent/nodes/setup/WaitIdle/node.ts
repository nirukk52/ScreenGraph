import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { IdleDetectorPort } from "../../../ports/appium/idle-detector.port";
import type { EventKind } from "../../../domain/events";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../logging/logger";

export interface WaitIdleInput extends CommonNodeInput {
  runId: string;
  idleHeuristicsConfiguration: {
    minQuietMillis: number;
    maxWaitMillis: number;
  };
}

export interface WaitIdleOutput extends CommonNodeOutput {
  runId: string;
  uiStabilityAssessment: {
    quietWindowObservedMillis: number;
    networkInFlightStatus: "NONE";
  };
}

/**
 * waitIdle orchestrates idle detection via IdleDetectorPort and emits deterministic node output.
 * PURPOSE: Wraps adapter interactions and guarantees SUCCESS/FAILURE outputs for engine transitions.
 */
export async function waitIdle(
  input: WaitIdleInput,
  idleDetectorPort: IdleDetectorPort,
): Promise<{
  output: WaitIdleOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "WaitIdle",
  });
  logger.info("WaitIdle INPUT", { input });
  console.log(`[WAITIDLE NODE] STARTING with config minQuiet=${input.idleHeuristicsConfiguration.minQuietMillis}ms maxWait=${input.idleHeuristicsConfiguration.maxWaitMillis}ms`);

  try {
    console.log(`[WAITIDLE NODE] Calling idleDetectorPort.waitIdle...`);
    const quietWindowMillis = await idleDetectorPort.waitIdle(
      input.idleHeuristicsConfiguration.minQuietMillis,
      input.idleHeuristicsConfiguration.maxWaitMillis,
    );
    console.log(`[WAITIDLE NODE] idleDetectorPort returned: ${quietWindowMillis}ms`);
    logger.info("Quiet window observed", { quietWindowMillis });

    const output: WaitIdleOutput = {
      runId: input.runId,
      uiStabilityAssessment: {
        quietWindowObservedMillis: quietWindowMillis,
        networkInFlightStatus: "NONE",
      },
      nodeName: "WaitIdle",
      stepOrdinal: 3,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-003`,
      randomSeed: 333333,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    };

    logger.info("WaitIdle OUTPUT", { output });

    return {
      output,
      events: [],
    };
  } catch (error) {
    logger.error("WaitIdle failure", { error });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error && error.name ? error.name : "UnknownError";
    const isRetryable = errorName === "TimeoutError";

    const failureOutput: WaitIdleOutput = {
      runId: input.runId,
      uiStabilityAssessment: {
        quietWindowObservedMillis: 0,
        networkInFlightStatus: "NONE",
      },
      nodeName: "WaitIdle",
      stepOrdinal: 3,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-003`,
      randomSeed: 333333,
      nodeExecutionOutcomeStatus: "FAILURE",
      errorId: errorName,
      retryable: isRetryable,
      humanReadableFailureSummary: errorMessage,
    };

    logger.info("WaitIdle FAILURE OUTPUT", { failureOutput });

    return {
      output: failureOutput,
      events: [],
    };
  }
}
