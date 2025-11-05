/** Represents the canonical lifecycle states a run can occupy (matches migration 008 enum). */
export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";

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

/** Indicates the acknowledgement payload passed back when canceling a run (American spelling). */
export interface CancelRunResponse {
  runId: string;
  status: "CANCELED";
  canceledAt: Date;
}

/**
 * Run represents the database row from the runs table (migration 008 schema).
 * PURPOSE: Aligns with MVP schema (removed multi-tenancy, simplified fields).
 */
export interface Run {
  run_id: string;
  app_package: string;
  status: string;
  stop_reason: string | null;
  worker_id: string | null;
  lease_expires_at: Date | null;
  created_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
  updated_at: Date;
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
