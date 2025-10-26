import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";

export interface ProvisionAppInput extends CommonNodeInput {
  runId: string;
  tenantId: string;
  projectId: string;
  deviceRuntimeContextId: string;
  applicationUnderTestDescriptor: {
    androidPackageId: string;
    apkStorageObjectReference: string;
    expectedBuildSignatureSha256: string;
  };
  installationPolicy: "INSTALL_IF_MISSING";
}

export interface ProvisionAppOutput extends CommonNodeOutput {
  runId: string;
  applicationProvisioningOutcome: {
    appPresenceStatus: "PRESENT" | "MISSING";
    installedVersionName: string;
    installedVersionCode: number;
    signatureValidationStatus: "MATCHED" | "MISMATCHED";
  };
}

export async function provisionApp(
  input: ProvisionAppInput
): Promise<{ output: ProvisionAppOutput; events: Array<{ kind: EventKind; payload: Record<string, unknown> }> }> {
  return {
    output: {
      runId: input.runId,
      applicationProvisioningOutcome: {
        appPresenceStatus: "PRESENT",
        installedVersionName: "1.2.3",
        installedVersionCode: 123,
        signatureValidationStatus: "MATCHED",
      },
      nodeName: "ProvisionApp",
      stepOrdinal: 1,
      iterationOrdinalNumber: 0,
      policyVersion: 1,
      resumeToken: `${input.runId}-001`,
      randomSeed: 111111,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
    },
    events: [],
  };
}
