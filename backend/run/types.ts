/** Represents the canonical lifecycle states a run can occupy. */
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface StartRunRequest {
  apkPath: string;
  appiumServerUrl: string;
  packageName: string;
  appActivity: string;
  maxSteps?: number;
  goal?: string;
}

/** Captures the initial metadata returned when a run is created. */
export interface StartRunResponse {
  runId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string;
}

/** Indicates the acknowledgement payload passed back when cancelling a run. */
export interface CancelRunResponse {
  runId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}

export interface Run {
  run_id: string;
  tenant_id: string;
  project_id: string;
  app_config_id: string;
  policy_version: number;
  status: string;
  stop_reason: string | null;
  created_at: Date;
  updated_at: Date;
  processing_by: string | null;
  lease_expires_at: Date | null;
  heartbeat_at: Date | null;
  started_at: Date | null;
  finished_at: Date | null;
  cancel_requested_at: Date | null;
}

/** Defines the parameters dispatched to the orchestrator worker for a run. */
export interface RunJob {
  runId: string;
  apkPath: string;
  appiumServerUrl: string;
  packageName: string;
  appActivity: string;
  maxSteps?: number;
}
