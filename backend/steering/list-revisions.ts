import { api } from "encore.dev/api";
import { listRevisions } from "./revisions";
import type { RevisionMeta } from "./types";

/**
 * PURPOSE: List revision metadata for a document.
 */

interface Params { category: string; filename: string }

export const listDocRevisions = api<Params, { revisions: RevisionMeta[] }>(
  { expose: true, method: "GET", path: "/steering/docs/:category/:filename/revisions" },
  async ({ category, filename }) => {
    const revisions = await listRevisions(category, filename);
    return { revisions };
  },
);


