export type CrawlStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface DeviceConfig {
  platform: "android" | "ios";
  version?: string;
}

export interface StartCrawlRequest {
  appPackage: string;
  deviceConfig?: DeviceConfig;
  maxSteps?: number;
  goal?: string;
}

export interface StartCrawlResponse {
  crawlId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string;
}

export interface CancelCrawlResponse {
  crawlId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}

export interface CrawlRun {
  id: string;
  status: CrawlStatus;
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

export interface CrawlEvent {
  id: number;
  crawl_id: string;
  event_type: string;
  payload: any;
  created_at: Date;
}

export interface CrawlJob {
  crawlId: string;
}
