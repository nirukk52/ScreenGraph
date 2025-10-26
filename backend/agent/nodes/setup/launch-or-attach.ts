import type { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import type { EventKind } from "../../domain/events";
import type { AppLifecyclePort } from "../../ports/appium/app-lifecycle.port";
import { ApplicationForegroundContext } from "../../domain/entities";

export interface LaunchOrAttachInput extends CommonNodeInput {
  runId: string;
  deviceRuntimeContextId: string;
  applicationUnderTestDescriptor: {
    androidPackageId: string;
  };
  launchAttachMode: "LAUNCH_OR_ATTACH";
}

export interface LaunchOrAttachOutput extends CommonNodeOutput {
  runId: string;
  applicationForegroundContextId: string;
}

export async function launchOrAttach(
  input: LaunchOrAttachInput,
  appLifecyclePort: AppLifecyclePort,
  sessionId: string,
  generateId: () => string,
): Promise<{
  output: LaunchOrAttachOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const appFg = await appLifecyclePort.launchApp(
    input.applicationUnderTestDescriptor.androidPackageId,
  );
  const contextId = generateId();

  return {
    output: {
      runId: input.runId,
      applicationForegroundContextId: contextId,
      nodeName: "LaunchOrAttach",
      stepOrdinal: 2,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-002`,
      randomSeed: 222222,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [],
  };
}
