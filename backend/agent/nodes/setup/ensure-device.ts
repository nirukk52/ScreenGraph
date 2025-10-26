import { AgentState, type CommonNodeInput, type CommonNodeOutput } from "../../domain/state";
import type { DeviceConfiguration } from "../../ports/appium/driver.port";
import type { SessionPort } from "../../ports/appium/session.port";
import { createDomainEvent, type EventKind } from "../../domain/events";

export interface EnsureDeviceInput extends CommonNodeInput {
  runId: string;
  tenantId: string;
  projectId: string;
  iterationOrdinalNumber: number;
  deviceConfiguration: DeviceConfiguration;
  driverReusePolicy: "REUSE_OR_CREATE";
}

export interface EnsureDeviceOutput extends CommonNodeOutput {
  runId: string;
  deviceRuntimeContextId: string;
}

export async function ensureDevice(
  input: EnsureDeviceInput,
  sessionPort: SessionPort,
  generateId: () => string,
): Promise<{
  output: EnsureDeviceOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const ctx = await sessionPort.ensureDevice(input.deviceConfiguration);
  const contextId = generateId();

  return {
    output: {
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
    },
    events: [],
  };
}
