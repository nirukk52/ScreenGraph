import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import type { GetArtifactMetaResponse } from "./dto";
import db from "../db";

/**
 * getArtifactMeta returns indexed metadata for a given refId.
 * PURPOSE: Allow internal services to look up artifact details without streaming content.
 */
export const getArtifactMeta = api<{ refId: string }, GetArtifactMetaResponse>(
  { expose: false, method: "GET", path: "/artifacts/:refId" },
  async (req) => {
    const logger = log.with({ module: "artifacts", actor: "getMeta", refId: req.refId });
    logger.info("Request received");

    const row = await db.queryRow<{
      artifact_ref_id: string;
      run_id: string;
      kind: string;
      byte_size: number | null;
      content_hash_sha256: string | null;
      created_at: string;
    }>`
      SELECT artifact_ref_id, run_id, kind, byte_size, content_hash_sha256, created_at
      FROM run_artifacts
      WHERE artifact_ref_id = ${req.refId}
    `;

    if (!row) {
      logger.info("Not found");
      throw APIError.notFound("artifact_not_found");
    }

    return {
      refId: row.artifact_ref_id,
      runId: row.run_id,
      kind: row.kind as never,
      byteSize: row.byte_size,
      contentHashSha256: row.content_hash_sha256,
      createdAt: row.created_at,
    };
  },
);


