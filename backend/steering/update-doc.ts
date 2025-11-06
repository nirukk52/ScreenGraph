import { api, APIError, Header } from "encore.dev/api";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "encore.dev/log";
import { recordRevision } from "./revisions";
import { rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";
import { publish } from "./events";

interface UpdateDocParams {
  category: string;
  filename: string;
  content: string;
}

interface UpdateDocResponse {
  success: boolean;
}

const STEERING_DOCS_PATH = path.resolve("../steering-docs");

interface UpdateDocHeaders {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

export const updateDoc = api<UpdateDocParams & UpdateDocHeaders, UpdateDocResponse>(
  {
    expose: true,
    method: "PATCH",
    path: "/steering/docs/:category/:filename",
  },
  async ({ category, filename, content, ...headers }) => {
    requireWriteToken(headers);

    const filePath = path.join(STEERING_DOCS_PATH, category, filename);
    const resolvedPath = path.resolve(filePath);
    const basePath = path.resolve(STEERING_DOCS_PATH);

    if (!resolvedPath.startsWith(basePath)) {
      throw APIError.invalidArgument("Invalid file path");
    }

    const logger = log.with({ module: "steering", actor: "api", op: "updateDoc", category, filename });

    try {
      await fs.access(resolvedPath);
      // Write new content
      await fs.writeFile(resolvedPath, content, "utf-8");
      // Record revision snapshot
      const meta = await recordRevision(category, filename, content);
      // Update index (simple full rebuild for v1)
      await rebuildIndex();
      await publish("docs.document.changed", { category, filename, revisionId: meta.id });
      logger.info("document updated");
      return { success: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw APIError.notFound("Documentation file not found");
      }
      throw APIError.internal("Failed to update documentation file");
    }
  },
);
