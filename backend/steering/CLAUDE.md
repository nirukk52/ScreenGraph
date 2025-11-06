# Steering Service – Quick Reference

> **For agents and coding assistants working on steering-docs**

---

## Service Purpose

Expose typed, versioned, never-delete CRUD over `steering-docs/` with Onyx integration.

---

## Key Files

- **Types**: `types.ts` (DTOs, unions, no `any`)
- **Core**: `repo.ts`, `hash.ts`, `indexer.ts`, `revisions.ts`
- **Auth**: `auth.ts` (validates `STEERING_WRITE_TOKEN`)
- **Events**: `events.ts`, `events.stream.ts` (SSE)
- **Endpoints**: `*.ts` (create, update, rename, archive, restore, revert, index, search, tools)

---

## Viewing Everything

### 1. Encore API Explorer

```
http://localhost:9400
```

Navigate to `steering` service → view all endpoints with schemas.

### 2. Direct API Base

```
http://localhost:4000/steering/...
```

### 3. Tools Manifest (for Onyx)

```bash
curl http://localhost:4000/steering/tools | jq
```

Lists all available tools with names, paths, methods, params.

### 4. Index (all docs metadata)

```bash
curl http://localhost:4000/steering/index | jq
```

### 5. Search

```bash
curl "http://localhost:4000/steering/search?q=YOUR_QUERY" | jq
```

### 6. SSE Events (live tail)

```bash
curl -N http://localhost:4000/steering/events
```

---

## Common Patterns

### Read a Doc

```typescript
import { steering } from "~encore/clients";
const doc = await steering.getDoc({ category: "preferences", filename: "code-style.md" });
```

### Update a Doc

```typescript
await steering.updateDoc({
  category: "tasks",
  filename: "today.md",
  content: "# Updated\n\nNew content.",
  Authorization: "Bearer TOKEN"
});
```

### Search

```typescript
const results = await steering.searchDocs({ q: "agent architecture" });
```

### List Revisions

```typescript
const revs = await steering.listDocRevisions({ category: "rules", filename: "coding-standards.md" });
```

### Revert

```typescript
await steering.revertDocToRevision({
  category: "rules",
  filename: "coding-standards.md",
  revisionId: "2025-11-06T10-00-00-000Z-abc123",
  author: "founder",
  Authorization: "Bearer TOKEN"
});
```

---

## Auth for Writes

All mutating endpoints require `STEERING_WRITE_TOKEN`:

```bash
# Set secret locally
encore secret set --type local STEERING_WRITE_TOKEN

# Use in requests
curl -H "Authorization: Bearer YOUR_TOKEN" ...
# OR
curl -H "X-Steering-Write-Token: YOUR_TOKEN" ...
```

---

## Index & Lifecycle

- Index: `steering-docs/.meta/docs.index.json`
- Lifecycle: `steering-docs/.meta/lifecycle.json` (`"active" | "archived"`)
- Revisions: `steering-docs/<category>/.versions/<filename>/manifest.json`

Rebuild index:

```bash
curl -X POST http://localhost:4000/steering/index/rebuild -H "Authorization: Bearer TOKEN"
```

---

## Event Types (SSE)

- `docs.document.changed` – create/update
- `docs.document.renamed` – rename
- `docs.document.lifecycle` – archive/restore
- `docs.index.rebuilt` – index rebuilt (or heartbeat)

---

## Testing

```bash
cd backend
encore test ./steering
```

---

## Logging

All endpoints log with:

```typescript
log.with({ module: "steering", actor: "api", op: "updateDoc", ... })
```

---

## Never-Delete Guarantee

- **Archive** sets lifecycle to `archived`; content remains
- **Revisions** append snapshots; no overwrites
- **Rename** moves atomically; old revisions preserved under new name

---

## Onyx Workflow

1. Get manifest: `GET /steering/tools`
2. Register tools in Onyx config
3. Provide `STEERING_WRITE_TOKEN` to Onyx
4. Chat: "Search for X", "Update Y with Z", "Show revision history of Q"

---

## Quick Checklist for Agents

- [ ] Read `README.md` for full API reference
- [ ] Set `STEERING_WRITE_TOKEN` secret
- [ ] Use `~encore/clients` for type-safe calls
- [ ] Never hardcode paths; use `repo.ts` helpers
- [ ] Log with `module:"steering"`, structured fields
- [ ] Rebuild index after bulk changes
- [ ] Emit events after mutations via `events.ts`

---

## Related

- Feature requests: `jira/feature-requests/FR-011` to `FR-015`
- Project rules: `.cursor/rules/backend_engineer.mdc`
- Backend handoff: `BACKEND_HANDOFF.md`

