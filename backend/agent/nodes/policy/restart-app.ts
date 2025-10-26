import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { DriverPort } from "../../ports/driver.port";

export interface RestartAppInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  deviceRuntimeContextId: string;
  applicationUnderTestDescriptor: {
    androidPackageId: string;
  };
  restartReasonPlaintext: string;
}

export interface RestartAppOutput extends CommonNodeOutput {
  runId: string;
  applicationForegroundContext: {
    currentPackageId: string;
    currentActivityName: string;
  };
}

export async function restartApp(
  input: RestartAppInput,
  driver: DriverPort,
  sessionId: string
): Promise<{ output: RestartAppOutput; events: Array<{ kind: EventKind; payload: Record<string, unknown> }> }> {
  const appFg = await driver.launchApp(sessionId, input.applicationUnderTestDescriptor.androidPackageId);

  return {
    output: {
      runId: input.runId,
      applicationForegroundContext: {
        currentPackageId: appFg.currentPackageId,
        currentActivityName: appFg.currentActivityName,
      },
      nodeName: "RestartApp",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [
      {
        kind: "agent.app.restarted",
        payload: {
          reason: input.restartReasonPlaintext,
          packageId: appFg.currentPackageId,
        },
      },
    ],
  };
}
