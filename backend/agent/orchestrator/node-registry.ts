import type { AgentState } from "../domain/state";
import { NodeEngine, createEmptyRegistry, type NodeRegistry, type NodeName } from "./node-engine";
import type { EnginePorts, EngineContext } from "./node-engine";
import { type EnsureDeviceHandler, type ProvisionAppHandler } from "./node-engine";
import { ensureDevice, type EnsureDeviceOutput } from "../nodes/setup/ensure-device";
import { provisionApp, type ProvisionAppOutput } from "../nodes/setup/provision-app";
import type { DeviceConfiguration } from "../ports/appium/session.port";

/**
 * BuildNodeRegistry creates a fully-wired registry with EnsureDevice and ProvisionApp handlers.
 * PURPOSE: Encapsulates node handler creation and transition wiring for the engine.
 */
export function buildNodeRegistry(
  sessionPort: EnginePorts["sessionPort"],
  generateId: () => string,
): NodeRegistry {
  return {
    EnsureDevice: createEnsureDeviceHandler(sessionPort, generateId),
    ProvisionApp: createProvisionAppHandler(),
  };
}

/**
 * createEnsureDeviceHandler builds the typed handler for EnsureDevice node.
 * PURPOSE: Wires buildInput/execute/applyOutput and success/failure transitions.
 */
function createEnsureDeviceHandler(
  sessionPort: EnginePorts["sessionPort"],
  generateId: () => string,
): EnsureDeviceHandler {
  return {
    name: "EnsureDevice",
    buildInput(state: AgentState, ctx: EngineContext): Parameters<typeof ensureDevice>[0] {
      return {
        runId: state.runId,
        tenantId: state.tenantId,
        projectId: state.projectId,
        iterationOrdinalNumber: state.iterationOrdinalNumber,
        deviceConfiguration: ctx.ensureDevice.deviceConfiguration,
        driverReusePolicy: ctx.ensureDevice.driverReusePolicy,
      };
    },
    async execute(input, ports) {
      const result = await ensureDevice(input, ports.sessionPort, generateId);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput(prev: AgentState, output: EnsureDeviceOutput): AgentState {
      return {
        ...prev,
        deviceRuntimeContextId: output.deviceRuntimeContextId,
      };
    },
    onSuccess: "ProvisionApp",
    onFailure: {
      retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
      backtrackTo: undefined,
    },
  };
}

/**
 * createProvisionAppHandler builds the typed handler for ProvisionApp node.
 * PURPOSE: Wires buildInput/execute/applyOutput and success/failure transitions.
 */
function createProvisionAppHandler(): ProvisionAppHandler {
  return {
    name: "ProvisionApp",
    buildInput(state: AgentState, ctx: EngineContext): Parameters<typeof provisionApp>[0] {
      if (!state.deviceRuntimeContextId) {
        throw new Error("EnsureDevice must run before ProvisionApp");
      }
      return {
        runId: state.runId,
        tenantId: state.tenantId,
        projectId: state.projectId,
        deviceRuntimeContextId: state.deviceRuntimeContextId,
        applicationUnderTestDescriptor: ctx.provisionApp.applicationUnderTestDescriptor,
        installationPolicy: ctx.provisionApp.installationPolicy,
      };
    },
    async execute(input, _ports) {
      const result = await provisionApp(input);
      return {
        output: result.output,
        events: result.events.map((evt) => ({ kind: evt.kind, payload: evt.payload })),
      };
    },
    applyOutput(prev: AgentState, output: ProvisionAppOutput): AgentState {
      return {
        ...prev,
        // No direct state mutation for now; ProvisionApp output contains applicationProvisioningOutcome
        // but doesn't update AgentState fields yet
      };
    },
    onSuccess: "LaunchOrAttach",
    onFailure: {
      retry: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000 },
      backtrackTo: "EnsureDevice",
    },
  };
}

/**
 * createNodeEngine builds a fully-wired engine instance with all setup nodes registered.
 * PURPOSE: Higher-level factory for ready-to-use engine.
 */
export function createNodeEngine(
  sessionPort: EnginePorts["sessionPort"],
  generateId: () => string,
): NodeEngine {
  const registry = buildNodeRegistry(sessionPort, generateId);
  return new NodeEngine(registry);
}

