import { api, Header } from "encore.dev/api";
import { writeLifecycle, rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";
import { publish } from "./events";

/**
 * PURPOSE: Restore an archived document to active lifecycle.
 */

interface Params { category: string; filename: string }

interface Headers {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

interface Response { success: boolean }

export const restoreDoc = api<Params & Headers, Response>(
  { expose: true, method: "POST", path: "/steering/docs/:category/:filename/restore" },
  async ({ category, filename, ...headers }) => {
    requireWriteToken(headers);
    await writeLifecycle({ category, filename }, "active");
    await rebuildIndex();
    await publish("docs.document.lifecycle", { category, filename, lifecycle: "active" });
    return { success: true };
  },
);


