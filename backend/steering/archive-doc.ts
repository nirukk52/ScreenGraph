import { api, Header } from "encore.dev/api";
import { writeLifecycle, rebuildIndex } from "./indexer";
import { requireWriteToken } from "./auth";
import { publish } from "./events";

/**
 * PURPOSE: Mark a document as archived (non-destructive lifecycle change).
 */

interface Params {
  category: string;
  filename: string;
}

interface Headers {
  Authorization?: Header<string>;
  "X-Steering-Write-Token"?: Header<string>;
}

interface Response { success: boolean }

export const archiveDoc = api<Params & Headers, Response>(
  { expose: true, method: "POST", path: "/steering/docs/:category/:filename/archive" },
  async ({ category, filename, ...headers }) => {
    requireWriteToken(headers);
    await writeLifecycle({ category, filename }, "archived");
    await rebuildIndex();
    await publish("docs.document.lifecycle", { category, filename, lifecycle: "archived" });
    return { success: true };
  },
);


