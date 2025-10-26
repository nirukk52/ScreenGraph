export interface DeviceRuntimeContext {
  driverSessionId: string;
  deviceId: string;
  capabilitiesEcho: Record<string, unknown>;
  healthProbeStatus: "HEALTHY" | "UNHEALTHY";
}

export interface ApplicationProvisioningOutcome {
  appPresenceStatus: "PRESENT" | "MISSING";
  installedVersionName: string;
  installedVersionCode: number;
  signatureValidationStatus: "MATCHED" | "MISMATCHED";
}

export interface ApplicationForegroundContext {
  currentPackageId: string;
  currentActivityName: string;
  appBroughtToForegroundTimestamp: string;
}

export interface UiStabilityAssessment {
  quietWindowObservedMillis: number;
  networkInFlightStatus: "NONE" | "IN_FLIGHT";
}

export interface PerceptionArtifacts {
  screenshotObjectStorageReference: string;
  uiHierarchyXmlObjectStorageReference: string;
  screenPerceptualHash64: string;
  normalizedViewportSize: { width: number; height: number };
}

export interface ActionCandidate {
  actionCandidateId: string;
  actionKind: "TAP" | "SWIPE" | "BACK" | "TEXT_INPUT";
  hitTargetBounds: { x: number; y: number; width: number; height: number };
  elementStableIdentitySignature: string;
  confidenceScore: number;
}

export interface ChosenActionDecision {
  selectedActionCandidateId: string;
  selectionRationalePlaintext: string;
  fallbackUsed: boolean;
}

export type ActionExecutionOutcomeStatus = "COMPLETED" | "TIMEOUT" | "FAILED";

export interface VerificationAssessment {
  visualChangeDetected: boolean;
  postActionScreenPerceptualHash64: string;
  perceptualHammingDistance: number;
}

export type GraphPersistenceOperationKind =
  | "UPSERTED_SCREEN_AND_ACTION"
  | "SCREEN_ALREADY_EXISTS"
  | "NO_CHANGE";

export interface GraphPersistenceOutcome {
  screenRecordIdentity: string;
  actionRecordIdentity: string;
  persistenceOperationKind: GraphPersistenceOperationKind;
}

export type ProgressState = "FORWARD_PROGRESS" | "STALL" | "LOOP_DETECTED";

export interface ProgressEvaluation {
  progressState: ProgressState;
  basis: string;
}

export type RoutingDirective = "CONTINUE" | "SWITCH_POLICY" | "RESTART_APP" | "STOP";

export interface ContinuationDecision {
  routingDirective: RoutingDirective;
  routingDirectiveReason: string;
}

export interface EffectiveStrategyConfiguration {
  strategyName: string;
  policyVersion: number;
}

export type RecoveryDisposition = "RETRY_NEXT_NODE" | "ESCALATE_TO_RESTART" | "ABORT";
