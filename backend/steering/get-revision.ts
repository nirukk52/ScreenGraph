import { api, APIError } from "encore.dev/api";
import { getRevisionContent } from "./revisions";

/**
 * PURPOSE: Fetch a specific revision's content.
 */

interface Params { category: string; filename: string; revisionId: string }

export const getDocRevision = api<Params, { content: string; meta: { id: string; createdAt: string; author?: string; message?: string; sha: string; size: number } }>(
  { expose: true, method: "GET", path: "/steering/docs/:category/:filename/revisions/:revisionId" },
  async ({ category, filename, revisionId }) => {
    const res = await getRevisionContent(category, filename, revisionId);
    if (!res) throw APIError.notFound("revision_not_found");
    return res;
  },
);


