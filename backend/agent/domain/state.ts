export type RunStatus = "running" | "paused" | "completed" | "failed" | "canceled";
export type StopReason =
  | "success"
  | "budget_exhausted"
  | "crash"
  | "no_progress"
  | "user_cancelled"
  | null;
export type NodeExecutionOutcomeStatus = "SUCCESS" | "FAILURE";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Perception {
  screenshotRefId: string | null;
  uiHierarchyXmlRefId: string | null;
  ocrRefId: string | null;
  screenPerceptualHash64: string | null;
}

export interface Counters {
  stepsTotal: number;
  screensNew: number;
  noProgressCycles: number;
  outsideAppSteps: number;
  restartsUsed: number;
  errors: number;
}

export interface Budgets {
  maxSteps: number;
  maxTimeMs: number;
  maxTaps: number;
  outsideAppLimit: number;
  restartLimit: number;
}

export interface AgentState {
  tenantId: string;
  projectId: string;
  runId: string;
  policyVersion: number;
  nodeName: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  resumeToken: string;
  randomSeed: number;
  timestamps: Timestamps;

  deviceRuntimeContextId: string | null;
  applicationForegroundContextId: string | null;

  perception: Perception;

  availableActionCandidateIds: string[];
  chosenActionDecisionId: string | null;
  actionExecutionOutcomeId: string | null;
  verificationAssessmentId: string | null;
  graphPersistenceOutcomeId: string | null;
  progressEvaluationId: string | null;
  continuationDecisionId: string | null;

  recoveryDispositionId: string | null;
  checkpointRefId: string | null;

  counters: Counters;
  budgets: Budgets;

  status: RunStatus;
  stopReason: StopReason;

  lastEventSequence: number;
  checksum: string | null;
}

/**
 * CommonNodeInput captures the shared run metadata provided to agent nodes.
 * It keeps node inputs aligned on identifiers, sequencing, and randomness.
 */
export interface CommonNodeInput {
  runId: string;
  stepOrdinal?: number;
  iterationOrdinalNumber?: number;
  randomSeed?: number;
}

export interface CommonNodeOutput {
  nodeName: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  policyVersion: number;
  resumeToken: string;
  randomSeed: number;
  nodeExecutionOutcomeStatus: NodeExecutionOutcomeStatus;
  errorId: string | null;
  retryable: boolean | null;
  humanReadableFailureSummary: string | null;
}

export function createInitialState(
  tenantId: string,
  projectId: string,
  runId: string,
  budgets: Budgets,
  now: string,
): AgentState {
  return {
    tenantId,
    projectId,
    runId,
    policyVersion: 1,
    nodeName: "InitialSetup",
    stepOrdinal: 0,
    iterationOrdinalNumber: 0,
    resumeToken: `${runId}-000`,
    randomSeed: 123456,
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    deviceRuntimeContextId: null,
    applicationForegroundContextId: null,
    perception: {
      screenshotRefId: null,
      uiHierarchyXmlRefId: null,
      ocrRefId: null,
      screenPerceptualHash64: null,
    },
    availableActionCandidateIds: [],
    chosenActionDecisionId: null,
    actionExecutionOutcomeId: null,
    verificationAssessmentId: null,
    graphPersistenceOutcomeId: null,
    progressEvaluationId: null,
    continuationDecisionId: null,
    recoveryDispositionId: null,
    checkpointRefId: null,
    counters: {
      stepsTotal: 0,
      screensNew: 0,
      noProgressCycles: 0,
      outsideAppSteps: 0,
      restartsUsed: 0,
      errors: 0,
    },
    budgets,
    status: "running",
    stopReason: null,
    lastEventSequence: 0,
    checksum: null,
  };
}

export function advanceStep(
  state: AgentState,
  nodeName: string,
  now: string,
  seed: number,
): AgentState {
  return {
    ...state,
    nodeName,
    stepOrdinal: state.stepOrdinal + 1,
    resumeToken: `${state.runId}-${String(state.stepOrdinal + 1).padStart(3, "0")}`,
    randomSeed: seed,
    timestamps: {
      ...state.timestamps,
      updatedAt: now,
    },
    counters: {
      ...state.counters,
      stepsTotal: state.counters.stepsTotal + 1,
    },
  };
}
