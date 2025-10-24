export interface RunsTable {
  run_id: string;
  tenant_id: string;
  project_id: string;
  status: "running" | "paused" | "completed" | "failed" | "canceled";
  created_at: string;
  updated_at: string;
}

export interface RunEventsTable {
  event_id: string;
  run_id: string;
  tenant_id: string;
  project_id: string;
  sequence: number;
  ts: string;
  kind: string;
  version: string;
  payload: Record<string, unknown>;
  checksum: string;
}

export interface RunOutboxTable {
  run_id: string;
  sequence: number;
  event_id: string;
  published_at: string | null;
}

export interface AgentStateSnapshotsTable {
  run_id: string;
  step_ordinal: number;
  state_json: string;
  created_at: string;
}

export interface ScreensTable {
  screen_id: string;
  run_id: string;
  perceptual_hash_64: string;
  screenshot_ref: string;
  xml_ref: string;
  evidence_counter: number;
  created_at: string;
  updated_at: string;
}

export interface ActionsTable {
  action_id: string;
  run_id: string;
  from_screen_id: string;
  to_screen_id: string;
  action_kind: string;
  evidence_counter: number;
  created_at: string;
  updated_at: string;
}

export interface ArtifactsIndexTable {
  artifact_ref_id: string;
  kind: "screenshot" | "xml" | "ocr";
  content_hash_sha256: string;
  run_id: string;
  created_at: string;
}
