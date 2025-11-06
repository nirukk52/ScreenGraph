import { api } from "encore.dev/api";
import type { ToolsManifest } from "./types";

/**
 * PURPOSE: Expose an Onyx-compatible manifest of steering-docs actions.
 */

export const getSteeringTools = api<void, ToolsManifest>(
  { expose: true, method: "GET", path: "/steering/tools" },
  async () => {
    return {
      tools: [
        { name: "list_index", title: "List Docs Index", description: "List all docs with metadata", method: "GET", path: "/steering/index" },
        { name: "reindex", title: "Rebuild Docs Index", description: "Rebuild the docs index", method: "POST", path: "/steering/index/rebuild" },
        { name: "search", title: "Search Docs", description: "Search across docs", method: "GET", path: "/steering/search", params: { q: "string", category: "string?" } },
        { name: "get_doc", title: "Get Document", description: "Fetch a document content", method: "GET", path: "/steering/docs/:category/:filename" },
        { name: "create_doc", title: "Create Document", description: "Create a new document", method: "POST", path: "/steering/docs/:category", bodySchema: { filename: "string", content: "string", author: "string?", message: "string?" } },
        { name: "update_doc", title: "Update Document", description: "Update an existing document", method: "PATCH", path: "/steering/docs/:category/:filename", bodySchema: { content: "string", author: "string?", message: "string?" } },
        { name: "rename_doc", title: "Rename Document", description: "Rename a document", method: "POST", path: "/steering/docs/:category/:filename/rename", bodySchema: { newFilename: "string" } },
        { name: "archive_doc", title: "Archive Document", description: "Archive a document", method: "POST", path: "/steering/docs/:category/:filename/archive" },
        { name: "restore_doc", title: "Restore Document", description: "Restore an archived document", method: "POST", path: "/steering/docs/:category/:filename/restore" },
        { name: "list_revisions", title: "List Revisions", description: "List revisions of a document", method: "GET", path: "/steering/docs/:category/:filename/revisions" },
        { name: "get_revision", title: "Get Revision", description: "Get a specific revision", method: "GET", path: "/steering/docs/:category/:filename/revisions/:revisionId" },
        { name: "revert_revision", title: "Revert to Revision", description: "Revert to a previous revision", method: "POST", path: "/steering/docs/:category/:filename/revert/:revisionId", bodySchema: { author: "string?", message: "string?" } },
        { name: "stream_events", title: "Stream Events", description: "Stream doc events via SSE", method: "GET", path: "/steering/events" },
        { name: "maintenance_preview", title: "Maintenance Preview", description: "Preview cleanup plan", method: "POST", path: "/steering/maintenance/preview", bodySchema: { mode: "\"quick\"|\"full\"?" } },
        { name: "maintenance_cleanup", title: "Maintenance Cleanup", description: "Execute cleanup actions", method: "POST", path: "/steering/maintenance/cleanup", bodySchema: { mode: "\"quick\"|\"full\"?", dryRun: "boolean?" } },
      ],
    };
  },
);


