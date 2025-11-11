/**
 * ArtifactKind enumerates the allowed artifact categories.
 * PURPOSE: Prevent magic strings in control flow and paths.
 */
export type ArtifactKind = "screenshot" | "ui_xml";

/**
 * StoreArtifactRequest defines the payload for storing an artifact.
 * PURPOSE: Typed DTO for Encore endpoint request validation.
 */
export interface StoreArtifactRequest {
  runId: string;
  kind: ArtifactKind;
  contentBase64: string;
  // Optional image-specific fields
  format?: "png" | "jpg";
  widthPx?: number;
  heightPx?: number;
  captureTimestampMs?: number;
}

/**
 * StoreArtifactResponse returns the deterministic reference and echo metadata.
 * PURPOSE: Stable API response for callers and indexing.
 */
export interface StoreArtifactResponse {
  refId: string;
  byteSize: number;
  contentHashSha256: string;
}

/**
 * GetArtifactMetaResponse exposes indexed metadata for a refId.
 * PURPOSE: Simple query shape without streaming content (MVP).
 */
export interface GetArtifactMetaResponse {
  refId: string;
  runId: string;
  kind: ArtifactKind;
  byteSize: number | null;
  contentHashSha256: string | null;
  createdAt: string;
}
