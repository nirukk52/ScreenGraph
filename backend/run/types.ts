export type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface DeviceConfig {
  platform: "android" | "ios";
  version?: string;
}

export interface StartRunRequest {
  apkPath: string;
  appiumServerUrl: string;
  maxSteps?: number;
  goal?: string;
}

export interface StartRunResponse {
  runId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string;
}

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
}

export interface RunJob {
  runId: string;
  apkPath: string;
  appiumServerUrl: string;
}
