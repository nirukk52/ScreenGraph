import type { Query } from "encore.dev/api";

/**
 * PURPOSE: Centralized DTOs, enums, and literal unions for the steering-docs service.
 * Ensures type safety across endpoints and internal modules without magic strings.
 */

export type DocLifecycle = "active" | "archived";

export interface DocumentKey {
  category: string;
  filename: string; // must include .md extension
}

export interface RevisionMeta {
  id: string; // unique revision id (e.g. timestamp-hash)
  createdAt: string; // ISO timestamp
  author?: string;
  message?: string;
  sha: string; // content hash of revision
  size: number; // byte size of the content
}

export interface DocumentMetadata {
  key: DocumentKey;
  lifecycle: DocLifecycle;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  revisionCount: number;
  contentHash: string; // latest content hash for dedupe/maintenance
}

export interface MaintenancePreviewRequest {
  mode?: "quick" | "full";
}

export interface MaintenanceActionPlanItem {
  kind:
    | "dedupe.archive-duplicate"
    | "rename.normalize-filename"
    | "categorize.move-to-uncategorized"
    | "index.rebuild"
    | "frontmatter.ensure"
    | "links.report";
  key?: DocumentKey;
  details?: Record<string, unknown>;
}

export interface MaintenancePreviewResponse {
  planned: MaintenanceActionPlanItem[];
}

export interface MaintenanceCleanupRequest {
  mode?: "quick" | "full";
  dryRun?: boolean;
}

export interface MaintenanceCleanupResponse {
  applied: MaintenanceActionPlanItem[];
}

export type SteeringEventType =
  | "docs.document.changed"
  | "docs.document.renamed"
  | "docs.document.lifecycle"
  | "docs.index.rebuilt"
  | "docs.maintenance.progress";

export interface SteeringEvent<T = Record<string, unknown>> {
  type: SteeringEventType;
  data: T;
  ts: string; // ISO timestamp
}

export interface ToolsManifest {
  tools: Array<{
    name: string;
    title: string;
    description: string;
    method: "GET" | "POST" | "PATCH";
    path: string;
    params?: Record<string, unknown>;
    bodySchema?: Record<string, unknown>;
  }>;
}

export interface SearchRequest {
  q: Query<string>;
  category?: Query<string>;
}

export interface SearchHit {
  key: DocumentKey;
  score: number;
  snippet: string;
}

export interface SearchResponse {
  hits: SearchHit[];
}


