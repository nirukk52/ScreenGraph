import { api, APIError, Header } from "encore.dev/api";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "encore.dev/log";
import { getRevisionContent, recordRevision } from "./revisions";
import { rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";
import { publish } from "./events";

/**
 * PURPOSE: Revert a document to a previous revision by writing a new head.
 */

interface Params { category: string; filename: string; revisionId: string; author?: string; message?: string }

interface Headers { Authorization?: Header<string>; "X-Steering-Write-Token"?: Header<string> }

export const revertDocToRevision = api<Params & Headers, { success: boolean }>(
  { expose: true, method: "POST", path: "/steering/docs/:category/:filename/revert/:revisionId" },
  async ({ category, filename, revisionId, author, message, ...headers }) => {
    requireWriteToken(headers);

    const base = path.resolve("../steering-docs");
    const filePath = path.resolve(path.join(base, category, filename));
    if (!filePath.startsWith(path.resolve(base))) throw APIError.invalidArgument("bad_path");

    const res = await getRevisionContent(category, filename, revisionId);
    if (!res) throw APIError.notFound("revision_not_found");

    await fs.writeFile(filePath, res.content, "utf-8");
    const meta = await recordRevision(category, filename, res.content, author, message ?? `revert ${revisionId}`);
    await rebuildIndex();
    await publish("docs.document.changed", { category, filename, revisionId: meta.id });
    log.with({ module: "steering", actor: "api", op: "revertRevision" }).info("document reverted");
    return { success: true };
  },
);


