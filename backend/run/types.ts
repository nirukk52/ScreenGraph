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
  id: string;
  status: RunStatus;
  app_package: string;
  device_config: DeviceConfig | null;
  max_steps: number;
  goal: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
  error_message: string | null;
}

export interface RunEvent {
  id: number;
  run_id: string;
  event_type: string;
  payload: any;
  created_at: Date;
}

export interface RunJob {
  runId: string;
  apkPath: string;
  appiumServerUrl: string;
}
