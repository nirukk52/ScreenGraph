import { APIError, type Query, api } from "encore.dev/api";
import log from "encore.dev/log";
import { artifactsBucket } from "./bucket";
import type { GetArtifactContentResponse } from "./dto";

/**
 * getArtifactContent returns inline screenshot data for a given artifact refId.
 * PURPOSE: Enable frontend clients to render screenshots without direct bucket access.
 */
export const getArtifactContent = api<{ refId?: Query<string> }, GetArtifactContentResponse>(
  { expose: true, method: "GET", path: "/artifacts/content" },
  async ({ refId }) => {
    const logger = log.with({ module: "artifacts", actor: "getContent", refId });

    if (!refId) {
      logger.warn("Missing refId query parameter");
      throw APIError.invalidArgument("refId_required");
    }

    try {
      const buffer = await artifactsBucket.download(refId);
      const mimeType = inferMimeType(refId);
      const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

      return { refId, mimeType, dataUrl };
    } catch (error) {
      logger.error("Failed to download artifact content", { err: error });
      throw APIError.notFound("artifact_content_unavailable");
    }
  },
);

/**
 * inferMimeType derives the MIME type from the artifact reference.
 * PURPOSE: Ensure returned data URLs render correctly in browsers.
 */
function inferMimeType(refId: string): "image/png" | "image/jpeg" {
  if (refId.endsWith(".jpg") || refId.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  return "image/png";
}

