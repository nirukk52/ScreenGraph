# Steering Service

**Purpose**: Manage project documentation (`steering-docs/`) with versioning, lifecycle, search, and Onyx integration for chat-based editing.

---

## Overview

The steering service provides a typed API layer over the `steering-docs/` directory, enabling:

- **Full revision history**: Every edit appends a versioned snapshot; nothing is ever deleted
- **Lifecycle management**: Archive/restore docs without losing content
- **Search & indexing**: Fast content search with filename and heading boosts
- **Onyx integration**: Chat-based docs management via tools manifest
- **Real-time events**: SSE stream for live updates

---

## Quick Start

### 1. Set Write Token Secret

```bash
# In backend/
encore secret set --type local STEERING_WRITE_TOKEN
# Enter a secure token when prompted
```

### 2. Start Backend

```bash
cd backend
encore run
```

### 3. View All Endpoints

Open the Encore API Explorer:

```
http://localhost:9400
```

Or via API directly:

```
http://localhost:4000/#/api
```

### 4. Browse Available Tools (for Onyx)

```bash
curl http://localhost:4000/steering/tools | jq
```

---

## API Reference

### Read Operations (No Auth)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/steering/docs` | GET | List all docs with lifecycle metadata |
| `/steering/docs/:category/:filename` | GET | Get document content |
| `/steering/index` | GET | Get full index with metadata |
| `/steering/search?q=&category=` | GET | Search docs by content |
| `/steering/docs/:category/:filename/revisions` | GET | List revisions |
| `/steering/docs/:category/:filename/revisions/:revisionId` | GET | Get revision content |
| `/steering/tools` | GET | Onyx tools manifest |
| `/steering/events` | STREAM | SSE event stream |

### Write Operations (Require Token)

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/steering/docs/:category` | POST | Create doc | `{ filename, content, author?, message? }` |
| `/steering/docs/:category/:filename` | PATCH | Update doc | `{ content, author?, message? }` |
| `/steering/docs/:category/:filename/rename` | POST | Rename doc | `{ newFilename }` |
| `/steering/docs/:category/:filename/archive` | POST | Archive doc | - |
| `/steering/docs/:category/:filename/restore` | POST | Restore doc | - |
| `/steering/docs/:category/:filename/revert/:revisionId` | POST | Revert to revision | `{ author?, message? }` |
| `/steering/index/rebuild` | POST | Rebuild index | - |

**Auth**: Include token via:
- Header: `Authorization: Bearer <token>`
- Or: `X-Steering-Write-Token: <token>`

---

## Examples

### Search for Docs

```bash
curl "http://localhost:4000/steering/search?q=agent+architecture"
```

### Get a Document

```bash
curl http://localhost:4000/steering/docs/preferences/code-style.md
```

### Create a Document

```bash
curl -X POST http://localhost:4000/steering/docs/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "new-task.md",
    "content": "# New Task\n\nDescription here.",
    "author": "founder",
    "message": "initial draft"
  }'
```

### Update a Document

```bash
curl -X PATCH http://localhost:4000/steering/docs/tasks/new-task.md \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# New Task\n\nUpdated description.",
    "author": "founder",
    "message": "clarified requirements"
  }'
```

### List Revisions

```bash
curl http://localhost:4000/steering/docs/tasks/new-task.md/revisions
```

### Revert to Previous Revision

```bash
curl -X POST http://localhost:4000/steering/docs/tasks/new-task.md/revert/2025-11-06T12-34-56-789Z-abc123def456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"author":"founder","message":"revert to initial draft"}'
```

### Archive a Document

```bash
curl -X POST http://localhost:4000/steering/docs/tasks/old-task.md/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Stream Events (SSE)

```bash
curl -N http://localhost:4000/steering/events
```

Or with EventSource in browser:

```javascript
const events = new EventSource('http://localhost:4000/steering/events');
events.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## Index & Metadata

The service maintains a derived index at `steering-docs/.meta/docs.index.json`:

```json
[
  {
    "key": { "category": "preferences", "filename": "code-style.md" },
    "lifecycle": "active",
    "createdAt": "2025-11-06T10:00:00.000Z",
    "updatedAt": "2025-11-06T12:00:00.000Z",
    "revisionCount": 3,
    "contentHash": "abc123..."
  }
]
```

Lifecycle state: `steering-docs/.meta/lifecycle.json`

Revisions: `steering-docs/<category>/.versions/<filename>/manifest.json` + `<revisionId>.md`

---

## Onyx Integration

### 1. Get Tools Manifest

```bash
curl http://localhost:4000/steering/tools
```

### 2. Register in Onyx

Configure Onyx to call steering endpoints as actions/tools. Each tool in the manifest includes:
- `name`: unique tool identifier
- `title`: human-readable name
- `description`: what the tool does
- `method`, `path`: HTTP details
- `params`, `bodySchema`: request schema

### 3. Chat with Docs

Example Onyx queries:
- "Search for agent recovery docs"
- "Show me the code-style preferences"
- "Update the testing rules with XYZ"
- "What changed in milestone-1-current?"
- "Archive old brainstorming docs"

---

## Event Types

The SSE stream emits:

| Event Type | Payload | When |
|------------|---------|------|
| `docs.document.changed` | `{ category, filename, revisionId }` | Create/update |
| `docs.document.renamed` | `{ category, filename, newFilename }` | Rename |
| `docs.document.lifecycle` | `{ category, filename, lifecycle }` | Archive/restore |
| `docs.index.rebuilt` | `{ heartbeat?: true }` | Index rebuild or heartbeat |

---

## File Structure

```
backend/steering/
├── types.ts                 # DTOs and type unions
├── repo.ts                  # Safe fs operations
├── hash.ts                  # Content hashing & normalization
├── indexer.ts               # Index builder & lifecycle map
├── revisions.ts             # Revision store
├── auth.ts                  # Write token validation
├── events.ts                # Event publisher
├── events.stream.ts         # SSE endpoint
├── get-doc.ts               # Read doc
├── list-docs.ts             # List docs (enriched)
├── create-doc.ts            # Create doc
├── update-doc.ts            # Update doc
├── rename-doc.ts            # Rename doc
├── archive-doc.ts           # Archive doc
├── restore-doc.ts           # Restore doc
├── list-revisions.ts        # List revisions
├── get-revision.ts          # Get revision
├── revert-revision.ts       # Revert to revision
├── index.read.ts            # Read index
├── index.rebuild.ts         # Rebuild index
├── search.endpoint.ts       # Search docs
├── tools.ts                 # Onyx tools manifest
├── steering.test.ts         # Tests
├── encore.service.ts        # Service registration
└── README.md                # This file

steering-docs/
├── .meta/
│   ├── docs.index.json      # Derived index
│   └── lifecycle.json       # Lifecycle state
├── preferences/
│   └── .versions/
│       └── code-style.md/
│           ├── manifest.json
│           └── 2025-11-06T10-00-00-000Z-abc123.md
├── rules/
├── tasks/
└── ...
```

---

## Testing

```bash
cd backend
encore test ./steering
```

---

## Troubleshooting

### "permission_denied" on writes

Ensure `STEERING_WRITE_TOKEN` is set and provided in requests.

### Index not updating

Manually rebuild:

```bash
curl -X POST http://localhost:4000/steering/index/rebuild \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### SSE connection closes immediately

Check backend logs for errors; verify Encore service is running and endpoint is registered.

---

## Future Enhancements

- Maintenance cleanup endpoint (dedupe, normalize, categorize)
- Link validation and broken link reports
- Frontmatter enforcement
- Category aliases and redirects
- Full-text search with heading extraction

---

## Related Docs

- Feature requests: `jira/feature-requests/FR-011` through `FR-015`
- Backend handoff: `BACKEND_HANDOFF.md`
- Project overview: root `README.md`

