import * as crypto from "node:crypto";
import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import db from "../db";
import { artifactsBucket } from "./bucket";
import type { ArtifactKind, StoreArtifactRequest, StoreArtifactResponse } from "./dto";

/**
 * deriveRef builds a deterministic object ref path based on runId, kind, and content hash.
 * PURPOSE: Ensures idempotency and stable addressing across retries/replays.
 */
function deriveRef(runId: string, kind: ArtifactKind, hashHex: string, ext: string): string {
  return `obj://artifacts/${runId}/${kind}/${hashHex}.${ext}`;
}

/**
 * storeArtifact persists artifact content to object storage and indexes metadata in DB.
 * PURPOSE: Primary internal API for agent to persist screenshots and UI XML dumps.
 */
export const storeArtifact = api<StoreArtifactRequest, StoreArtifactResponse>(
  { expose: false, method: "POST", path: "/artifacts" },
  async (req) => {
    const baseLog = log.with({ module: "artifacts", actor: "store" });
    baseLog.info("Request received");

    if (!req.runId) throw APIError.invalidArgument("runId is required");
    if (!req.kind) throw APIError.invalidArgument("kind is required");
    if (!req.contentBase64) throw APIError.invalidArgument("contentBase64 is required");

    const isScreenshot = req.kind === "screenshot";
    const isXml = req.kind === "ui_xml";
    if (!isScreenshot && !isXml) throw APIError.invalidArgument("unsupported kind");

    const contentBytes = Buffer.from(req.contentBase64, "base64");
    const contentHashSha256 = crypto.createHash("sha256").update(contentBytes).digest("hex");
    const ext = isScreenshot ? (req.format ?? "png") : "xml";
    const refId = deriveRef(req.runId, req.kind, contentHashSha256, ext);

    const logger = baseLog.with({ runId: req.runId, kind: req.kind, refId });

    // Upload to bucket
    try {
      await artifactsBucket.upload(refId, contentBytes);
    } catch (err) {
      logger.error("Upload failed", { err });
      throw APIError.internal("failed_to_upload_artifact");
    }

    // Index metadata (idempotent by primary key on artifact_ref_id)
    try {
      await db.exec`
        INSERT INTO run_artifacts (artifact_ref_id, run_id, kind, byte_size, content_hash_sha256)
        VALUES (${refId}, ${req.runId}, ${req.kind}, ${contentBytes.byteLength}, ${contentHashSha256})
        ON CONFLICT (artifact_ref_id) DO NOTHING
      `;
    } catch (err) {
      logger.error("Index insert failed", { err });
      throw APIError.internal("failed_to_index_artifact");
    }

    logger.info("Stored artifact", { byteSize: contentBytes.byteLength });
    return { refId, byteSize: contentBytes.byteLength, contentHashSha256 };
  },
);
