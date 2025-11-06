import { api } from "encore.dev/api";
import { readIndex, rebuildIndex } from "./indexer";
import type { DocumentMetadata } from "./types";

/**
 * PURPOSE: Read the derived index; rebuild on-demand if not present.
 */

export const getDocsIndex = api<void, { docs: DocumentMetadata[] }>(
  { expose: true, method: "GET", path: "/steering/index" },
  async () => {
    const idx = await readIndex();
    if (idx) return { docs: idx };
    const rebuilt = await rebuildIndex();
    return { docs: rebuilt };
  },
);


