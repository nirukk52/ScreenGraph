import { api, Header } from "encore.dev/api";
import { rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";

/**
 * PURPOSE: Explicitly rebuild the docs index; write-protected.
 */

interface Headers { Authorization?: Header<string>; "X-Steering-Write-Token"?: Header<string> }

export const rebuildDocsIndex = api<Headers, { success: true }>(
  { expose: true, method: "POST", path: "/steering/index/rebuild" },
  async (headers) => {
    requireWriteToken(headers);
    await rebuildIndex();
    return { success: true } as const;
  },
);


