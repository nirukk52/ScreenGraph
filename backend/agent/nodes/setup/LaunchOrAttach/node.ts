import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { AppLifecyclePort } from "../../../ports/appium/app-lifecycle.port";
import type { EventKind } from "../../../domain/events";
import type { ApplicationForegroundContext } from "../../../domain/entities";
import log from "encore.dev/log";
import { MODULES, AGENT_ACTORS } from "../../../../logging/logger";

export interface LaunchOrAttachInput extends CommonNodeInput {
  runId: string;
  tenantId: string;
  projectId: string;
  applicationUnderTestDescriptor: {
    androidPackageId: string;
  };
  launchAttachMode: "LAUNCH_OR_ATTACH";
  installOrRestart: "INSTALL" | "RESTART";
  appLaunchTimeoutMs: number;
}

export interface LaunchOrAttachOutput extends CommonNodeOutput {
  runId: string;
  applicationForegroundContext: ApplicationForegroundContext;
}

/**
 * launchOrAttach orchestrates app launch via AppLifecyclePort and emits deterministic node output.
 * PURPOSE: Wraps adapter interactions and guarantees SUCCESS/FAILURE outputs for engine transitions.
 */
export async function launchOrAttach(
  input: LaunchOrAttachInput,
  appLifecyclePort: AppLifecyclePort,
): Promise<{
  output: LaunchOrAttachOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "LaunchOrAttach",
  });
  logger.info("LaunchOrAttach INPUT", { input });

  try {
    let foregroundCtx: ApplicationForegroundContext;
    
    if (input.installOrRestart === "RESTART") {
      logger.info("Restarting app", { packageId: input.applicationUnderTestDescriptor.androidPackageId });
      const restartSuccess = await appLifecyclePort.restartApp(
        input.applicationUnderTestDescriptor.androidPackageId,
        { launchTimeoutMs: input.appLaunchTimeoutMs },
      );
      
      if (!restartSuccess) {
        throw new Error("App restart failed");
      }
      
      // After restart, get the current app context
      const currentPackageId = await appLifecyclePort.getCurrentApp();
      foregroundCtx = {
        currentPackageId,
        currentActivityName: "", // Activity name not available from getCurrentApp
        appBroughtToForegroundTimestamp: new Date().toISOString(),
      };
    } else {
      logger.info("Launching app", { packageId: input.applicationUnderTestDescriptor.androidPackageId });
      foregroundCtx = await appLifecyclePort.launchApp(
        input.applicationUnderTestDescriptor.androidPackageId,
        { launchTimeoutMs: input.appLaunchTimeoutMs },
      );
    }
    
    logger.info("ApplicationForegroundContext received", { foregroundCtx });

    const output: LaunchOrAttachOutput = {
      runId: input.runId,
      applicationForegroundContext: foregroundCtx,
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
    };

    logger.info("LaunchOrAttach OUTPUT", { output });

    return {
      output,
      events: [],
    };
  } catch (error) {
    logger.error("LaunchOrAttach failure", { error });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error && error.name ? error.name : "UnknownError";
    const isRetryable = errorName === "AppNotInstalledError" || errorName === "TimeoutError";

    const failureOutput: LaunchOrAttachOutput = {
      runId: input.runId,
      applicationForegroundContext: {
        currentPackageId: "",
        currentActivityName: "",
        appBroughtToForegroundTimestamp: new Date().toISOString(),
      },
      nodeName: "LaunchOrAttach",
      stepOrdinal: 2,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-002`,
      randomSeed: 222222,
      nodeExecutionOutcomeStatus: "FAILURE",
      errorId: errorName,
      retryable: isRetryable,
      humanReadableFailureSummary: errorMessage,
    };

    logger.info("LaunchOrAttach FAILURE OUTPUT", { failureOutput });

    return {
      output: failureOutput,
      events: [],
    };
  }
}
