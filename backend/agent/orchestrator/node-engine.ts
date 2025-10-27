import type { AgentState, StopReason } from "../domain/state";
import { advanceStep } from "../domain/state";
import type { EventKind } from "../domain/events";
import type { SessionPort, DeviceConfiguration } from "../ports/appium/session.port";
import type {
  EnsureDeviceInput,
  EnsureDeviceOutput,
} from "../nodes/setup/ensure-device";
import type {
  ProvisionAppInput,
  ProvisionAppOutput,
} from "../nodes/setup/provision-app";

/**
 * NodeName enumerates the orchestrated nodes known to the engine.
 * PURPOSE: Drives typed routing for node execution and transitions.
 */
export type NodeName = "EnsureDevice" | "ProvisionApp" | "LaunchOrAttach" | "WaitIdle";

/**
 * NodeEvent represents a node-emitted domain event envelope.
 * PURPOSE: Carries node-local telemetry to Orchestrator for durable append.
 */
export interface NodeEvent {
  kind: EventKind;
  payload: Record<string, unknown>;
}

/**
 * EnginePorts encapsulates external side-effectful adapters required by nodes.
 * PURPOSE: Centralizes allowed IO (e.g., Appium session) for dependency injection.
 */
export interface EnginePorts {
  sessionPort: SessionPort;
}

/**
 * EngineContext carries static configuration needed to build typed node inputs.
 * PURPOSE: Supplies non-state inputs (e.g., device config, APK descriptor).
 */
export interface EngineContext {
  ensureDevice: {
    deviceConfiguration: DeviceConfiguration;
    driverReusePolicy: "REUSE_OR_CREATE";
  };
  provisionApp: {
    installationPolicy: "INSTALL_IF_MISSING";
    applicationUnderTestDescriptor: {
      androidPackageId: string;
      apkStorageObjectReference: string;
      expectedBuildSignatureSha256: string;
    };
  };
}

/**
 * TransitionPolicy defines retry/backtrack semantics for failed node executions.
 * PURPOSE: Encodes deterministic control flow without hardcoding in Worker.
 */
export interface TransitionPolicy {
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  backtrackTo?: NodeName;
}

/**
 * NodeExecutorResult is the typed outcome returned by individual node executors.
 * PURPOSE: Wraps output payload and any node-generated events for persistence.
 */
export interface NodeExecutorResult<OutputT> {
  output: OutputT;
  events: NodeEvent[];
}

/**
 * NodeHandler describes a single node executor with typed IO and transitions.
 * PURPOSE: Enables a registry of strongly-typed, composable nodes.
 */
export interface NodeHandler<InputT, OutputT, N extends NodeName> {
  name: N;
  buildInput(state: AgentState, ctx: EngineContext): InputT;
  execute(input: InputT, ports: EnginePorts): Promise<NodeExecutorResult<OutputT>>;
  applyOutput(prev: AgentState, output: OutputT): AgentState;
  onSuccess: NodeName;
  onFailure: TransitionPolicy;
}

// Typed handler specializations for current setup nodes
export type EnsureDeviceHandler = NodeHandler<EnsureDeviceInput, EnsureDeviceOutput, "EnsureDevice">;
export type ProvisionAppHandler = NodeHandler<ProvisionAppInput, ProvisionAppOutput, "ProvisionApp">;

/**
 * NodeRegistry maintains handlers for each orchestrated node.
 * PURPOSE: Central source of truth for node wiring and policies.
 */
export interface NodeRegistry {
  EnsureDevice?: EnsureDeviceHandler;
  ProvisionApp?: ProvisionAppHandler;
}

/**
 * EngineRunOnceArgs contains inputs required to execute a single engine step.
 * PURPOSE: Decouples timing/seed generation (owned by Worker/Orchestrator).
 */
export interface EngineRunOnceArgs {
  state: AgentState;
  nowIso: string;
  seed: number;
  ports: EnginePorts;
  ctx: EngineContext;
}

/**
 * EngineRunOnceResult represents the effect of a single node attempt.
 * PURPOSE: Feeds Worker loop with next state and transition hints.
 */
export interface EngineRunOnceResult {
  state: AgentState;
  nodeName: NodeName;
  outcome: "SUCCESS" | "FAILURE";
  nextNode: NodeName | null;
  backtracked: boolean;
  retryDelayMs: number | null;
  stopReason: StopReason;
  events: NodeEvent[];
}

/**
 * NodeEngine coordinates typed node execution and transition policy.
 * PURPOSE: Pure control plane used by Worker; persistence is delegated to Orchestrator.
 */
export class NodeEngine {
  constructor(private readonly registry: NodeRegistry) {}

  /**
   * runOnce executes the current node and returns the next transition decision.
   */
  async runOnce(args: EngineRunOnceArgs): Promise<EngineRunOnceResult> {
    const { state, nowIso, seed, ports, ctx } = args;

    const currentNode = this.resolveHandler(state.nodeName);

    // Build typed input and execute node
    const input = currentNode.buildInput(state, ctx);
    const { output, events } = await currentNode.execute(input, ports);

    // Advance step and apply node output to state
    const advanced = advanceStep(state, currentNode.name, nowIso, seed);
    const updated = currentNode.applyOutput(advanced, output);

    // Compute transition on outcome
    const outcome: "SUCCESS" | "FAILURE" = output.nodeExecutionOutcomeStatus;
    if (outcome === "SUCCESS") {
      return {
        state: { ...updated, iterationOrdinalNumber: 0 },
        nodeName: currentNode.name,
        outcome,
        nextNode: currentNode.onSuccess,
        backtracked: false,
        retryDelayMs: null,
        stopReason: null,
        events,
      };
    }

    // Failure path: decide retry vs backtrack
    const attempt = (state.iterationOrdinalNumber ?? 0) + 1;
    const { retry, backtrackTo } = currentNode.onFailure;
    if (attempt < retry.maxAttempts) {
      const retryDelayMs = computeBackoffDelayMs(attempt, retry.baseDelayMs, retry.maxDelayMs, seed);
      return {
        state: { ...updated, iterationOrdinalNumber: attempt },
        nodeName: currentNode.name,
        outcome,
        nextNode: currentNode.name,
        backtracked: false,
        retryDelayMs,
        stopReason: null,
        events,
      };
    }

    if (backtrackTo) {
      return {
        state: {
          ...updated,
          nodeName: backtrackTo,
          iterationOrdinalNumber: 0,
          counters: { ...updated.counters, restartsUsed: updated.counters.restartsUsed + 1 },
        },
        nodeName: currentNode.name,
        outcome,
        nextNode: backtrackTo,
        backtracked: true,
        retryDelayMs: null,
        stopReason: null,
        events,
      };
    }

    // Terminal failure
    return {
      state: { ...updated, status: "failed", stopReason: "crash" },
      nodeName: currentNode.name,
      outcome,
      nextNode: null,
      backtracked: false,
      retryDelayMs: null,
      stopReason: "crash",
      events,
    };
  }

  private resolveHandler(nodeName: string): EnsureDeviceHandler | ProvisionAppHandler {
    switch (nodeName) {
      case "EnsureDevice": {
        const h = this.registry.EnsureDevice;
        if (!h) throw new Error("EnsureDevice handler not registered");
        return h;
      }
      case "ProvisionApp": {
        const h = this.registry.ProvisionApp;
        if (!h) throw new Error("ProvisionApp handler not registered");
        return h;
      }
      default:
        throw new Error(`Unsupported node: ${nodeName}`);
    }
  }
}

/**
 * computeBackoffDelayMs returns exponential backoff with deterministic jitter.
 * PURPOSE: Ensure bounded, repeatable retry timing across resumes.
 */
export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  seed: number,
): number {
  const exp = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(exp, maxDelayMs);
  const jitter = (seed & 0xfff) / 0xfff; // [0,1)
  const jittered = Math.floor(capped * (0.75 + 0.25 * jitter));
  return Math.max(baseDelayMs, Math.min(jittered, maxDelayMs));
}

/**
 * createEmptyRegistry produces an empty NodeRegistry scaffold.
 * PURPOSE: Allows wiring the engine without binding node executors yet.
 */
export function createEmptyRegistry(): NodeRegistry {
  return {};
}


