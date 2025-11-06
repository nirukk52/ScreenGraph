import { api, APIError, Header } from "encore.dev/api";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "encore.dev/log";
import { normalizeFilename } from "./hash";
import { requireWriteToken } from "./auth";
import { rebuildIndex, getRevisionBaseDir } from "./indexer";
import { publish } from "./events";

/**
 * PURPOSE: Rename a document atomically and move its revisions directory.
 */

interface RenameDocParams {
  category: string;
  filename: string;
  newFilename: string;
}

interface RenameDocResponse { success: boolean }

const BASE = path.resolve("../steering-docs");

interface Headers {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

export const renameDoc = api<RenameDocParams & Headers, RenameDocResponse>(
  { expose: true, method: "POST", path: "/steering/docs/:category/:filename/rename" },
  async ({ category, filename, newFilename, ...headers }) => {
    requireWriteToken(headers);

    const logger = log.with({ module: "steering", actor: "api", op: "renameDoc", category, filename, newFilename });

    const oldPath = path.resolve(path.join(BASE, category, filename));
    const basePath = path.resolve(BASE);
    if (!oldPath.startsWith(basePath)) throw APIError.invalidArgument("Invalid path");

    const normalized = normalizeFilename(newFilename);
    const newPath = path.resolve(path.join(BASE, category, normalized));
    if (!newPath.startsWith(basePath)) throw APIError.invalidArgument("Invalid path");

    try {
      await fs.access(oldPath);
    } catch {
      throw APIError.notFound("Documentation file not found");
    }

    // Ensure target does not exist
    try {
      await fs.access(newPath);
      throw APIError.alreadyExists("Target filename already exists");
    } catch {}

    // Move file
    await fs.rename(oldPath, newPath);

    // Move revisions directory if present
    const oldRevDir = getRevisionBaseDir(category, filename);
    const newRevDir = getRevisionBaseDir(category, normalized);
    try {
      await fs.mkdir(path.dirname(newRevDir), { recursive: true });
      await fs.rename(oldRevDir, newRevDir);
    } catch (e) {
      // ok if no revisions yet
    }

    await rebuildIndex();
    await publish("docs.document.renamed", { category, filename, newFilename: normalized });
    logger.info("document renamed");
    return { success: true };
  },
);


