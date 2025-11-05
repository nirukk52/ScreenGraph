import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { DeviceConfiguration } from "../../../ports/appium/session.port";
import type { SessionPort } from "../../../ports/appium/session.port";
import type { EventKind } from "../../../domain/events";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../logging/logger";

export interface EnsureDeviceInput extends CommonNodeInput {
  runId: string;
  iterationOrdinalNumber: number;
  deviceConfiguration: DeviceConfiguration;
  driverReusePolicy: "REUSE_OR_CREATE";
}

export interface EnsureDeviceOutput extends CommonNodeOutput {
  runId: string;
  deviceRuntimeContextId: string;
}

/**
 * ensureDevice orchestrates session acquisition via SessionPort and emits deterministic node output.
 * PURPOSE: Wraps adapter interactions and guarantees SUCCESS/FAILURE outputs for engine transitions.
 */
export async function ensureDevice(
  input: EnsureDeviceInput,
  sessionPort: SessionPort,
  generateId: () => string,
): Promise<{
  output: EnsureDeviceOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "EnsureDevice",
  });
  logger.info("EnsureDevice INPUT", { input });

  try {
    const ctx = await sessionPort.ensureDevice(input.deviceConfiguration);
    logger.info("DeviceRuntimeContext received", { ctx });

    const contextId = ctx.deviceRuntimeContextId || generateId();
    logger.info("Resolved contextId", { contextId });

    const output: EnsureDeviceOutput = {
      runId: input.runId,
      deviceRuntimeContextId: contextId,
      nodeName: "EnsureDevice",
      stepOrdinal: 0,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-000`,
      randomSeed: 987654,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    };

    logger.info("EnsureDevice OUTPUT", { output });

    return {
      output,
      events: [],
    };
  } catch (error) {
    logger.error("EnsureDevice failure", { error });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error && error.name ? error.name : "UnknownError";
    const isRetryable = errorName === "DeviceOfflineError" || errorName === "TimeoutError";

    const failureOutput: EnsureDeviceOutput = {
      runId: input.runId,
      deviceRuntimeContextId: "",
      nodeName: "EnsureDevice",
      stepOrdinal: 0,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-000`,
      randomSeed: 987654,
      nodeExecutionOutcomeStatus: "FAILURE",
      errorId: errorName,
      retryable: isRetryable,
      humanReadableFailureSummary: errorMessage,
    };

    logger.info("EnsureDevice FAILURE OUTPUT", { failureOutput });

    return {
      output: failureOutput,
      events: [],
    };
  }
}
