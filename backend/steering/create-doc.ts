import { api, APIError, Header } from "encore.dev/api";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "encore.dev/log";
import { normalizeFilename } from "./hash";
import { recordRevision } from "./revisions";
import { rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";
import { publish } from "./events";

/**
 * PURPOSE: Create a new documentation file with initial revision and update index.
 */

interface CreateDocParams {
  category: string;
  filename: string; // may be normalized to kebab-case .md
  content: string;
  author?: string;
  message?: string;
}

interface CreateDocResponse {
  success: boolean;
}

const STEERING_DOCS_PATH = path.resolve("../steering-docs");

interface CreateDocHeaders {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

export const createDoc = api<CreateDocParams & CreateDocHeaders, CreateDocResponse>(
  { expose: true, method: "POST", path: "/steering/docs/:category" },
  async ({ category, filename, content, author, message, ...headers }) => {
    requireWriteToken(headers);

    const normalized = normalizeFilename(filename);
    const dir = path.join(STEERING_DOCS_PATH, category);
    const filePath = path.join(dir, normalized);
    const resolvedPath = path.resolve(filePath);
    const basePath = path.resolve(STEERING_DOCS_PATH);

    if (!resolvedPath.startsWith(basePath)) {
      throw APIError.invalidArgument("Invalid file path");
    }

    const logger = log.with({ module: "steering", actor: "api", op: "createDoc", category, filename: normalized });

    try {
      await fs.mkdir(dir, { recursive: true });
      // Fail if exists
      try {
        await fs.access(resolvedPath);
        throw APIError.alreadyExists("Documentation file already exists");
      } catch (e) {
        // ok if ENOENT
      }

      await fs.writeFile(resolvedPath, content, "utf-8");
      const meta = await recordRevision(category, normalized, content, author, message);
      await rebuildIndex();
      await publish("docs.document.changed", { category, filename: normalized, revisionId: meta.id });
      logger.info("document created");
      return { success: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw APIError.notFound("Category not found");
      }
      if (error instanceof APIError) {
        throw error;
      }
      throw APIError.internal("Failed to create documentation file");
    }
  },
);


