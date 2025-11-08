# GitHub Copilot Instructions for ScreenGraph

This document provides custom instructions for GitHub Copilot when working on the ScreenGraph project.

## Project Overview

ScreenGraph is an autonomous mobile app exploration platform built with:
- **Backend**: Encore.ts microservices on Encore Cloud
- **Frontend**: SvelteKit 2 (Svelte 5) on Vercel
- **Database**: PostgreSQL with event sourcing
- **Agent**: XState-driven orchestration with persistent state snapshots

## Architecture Rules

### Service Independence
- Backend (`backend/`) and frontend (`frontend/`) are completely independent services
- No root-level coupling - root only holds docs and Git config
- No shared code or `node_modules` between backend and frontend
- Backend never imports frontend; frontend never touches backend code
- No root `package.json` or `encore.app`

### Directory Structure
```
/ScreenGraph
├── backend/   ← Encore backend (independent)
│   ├── encore.app
│   ├── package.json
│   └── bun.lock
├── frontend/  ← SvelteKit frontend (independent)
│   ├── package.json
│   └── bun.lock
└── README.md  ← Docs only, shared tsconfig, biome config
```

## Coding Standards

### Naming Conventions
- **Functions**: Use descriptive verb phrases (e.g., `createAgentState`, `transitionToPlanning`)
  - Begin with verbs: `calculate`, `fetch`, `save`, `handle`, `get`, `set`
  - Be specific and descriptive - avoid generic names like `handle()` or `process()`
- **Classes**: Use descriptive singular nouns or noun phrases (e.g., `AgentStateSnapshot`, `RunEventPayload`)
- **Files**: Use `kebab-case.ts` or `PascalCase.ts` for classes (e.g., `agent-state.repo.ts`, `AgentMachine.ts`)
- **Domain-oriented naming**: Names should describe real-world concepts, not just technology
  - Avoid standalone names like `Hasher`, `Mapper`, `Processor`, `Manager`
  - Prefix with specific business concept (e.g., `ScreenHasher`, `EventMapper`)

### File Organization
- **Backend**: Group by service/domain (`backend/agent/`, `backend/run/`, `backend/graph/`)
- **Frontend**: Route-based (`frontend/src/routes/`, `frontend/src/lib/components/`)

### Type Safety
- **NO `any` ALLOWED** - Biome linter enforces this as an error
- Every function, class, enum, and DTO must have explicit types
- DTOs must be defined at the top of the file or imported from shared contracts
- For dynamic data, use union types or discriminated types instead of `any`
- Temporary loose types: use `{ [key: string]: unknown }` or `Record<string, unknown>` - never `any`
- Prefer TypeScript's built-in utility types (`Record`, `Partial`, `Pick`) over `any`

### Constants and Enums
- **NO MAGIC STRINGS** - Define literal unions or enums
- **NO MAGIC NUMBERS** - Define named constants

```typescript
// ✅ CORRECT
type AgentStatus = "idle" | "planning" | "acting" | "completed";
const RUN_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  COMPLETED: "completed"
} as const;

// ❌ WRONG
if (status === "active") { ... } // Use RUN_STATUS.ACTIVE instead
```

### Spelling & Language
- **Use American English spelling exclusively**
- Examples: "canceled" not "cancelled", "color" not "colour", "optimize" not "optimise"
- Applies to: variable names, function names, enum values, database columns, type names, comments, documentation

### Documentation
- Every function, class, enum, and DTO must have a comment explaining its purpose in the codebase
- Use JSDoc for public functions

## Backend Development (Encore.ts)

### Package Manager
- **Use Bun exclusively** for all package management
- `cd backend && bun install`
- Never use npm or yarn

### API Definitions
```typescript
// Always use Encore's api() function
import { api } from "encore.dev/api";

interface RequestParams {
  name: string;
}

interface ResponseData {
  message: string;
}

export const endpoint = api(
  { expose: true, method: "POST", path: "/endpoint" },
  async (params: RequestParams): Promise<ResponseData> => {
    return { message: `Hello ${params.name}` };
  }
);
```

### Logging
- **NEVER use `console.log`** - Use ONLY `encore.dev/log`
- Always create contextual loggers with structured data

```typescript
// ✅ CORRECT
import log from "encore.dev/log";
const logger = log.with({ module: "agent", runId, workerId });
logger.info("state transition", { from: "idle", to: "planning" });

// ❌ WRONG
console.log("something happened"); // NEVER DO THIS
```

**Required log context fields:**
- `module`: Service or domain module name
- `actor`: Component or handler name
- `runId`: (Optional) Run identifier
- `workerId`: (Optional) Worker identifier
- `nodeName`: (Optional) Agent node name
- `stepOrdinal`: (Optional) Step number
- `eventSeq`: (Optional) Event sequence

**Log payload structure:**
- Always use structured JSON objects
- Include `stopReason` and `err.*` fields on failures
- Capture snapshot state when transitions occur

### Database
- Use Encore `SQLDatabase` with typed results

```typescript
const rows = await db.query<{ id: string; name: string }>`
  SELECT id, name FROM users WHERE status = ${status}
`;
for await (const row of rows) {
  logger.info("user found", { userId: row.id });
}
```

### Database Migrations
- Sequential numbering: `001_initial.up.sql`, `002_add_column.up.sql`
- One migration per logical change
- Always consider rollback scenarios
- Use American English spelling in column names

### Build & Run
```bash
# Run backend
cd backend && encore run

# Reset database (local only)
encore db reset

# Access database shell
encore db shell run --write

# Run tests
encore test

# View logs
encore logs
```

**Backend Services:**
- API: `http://localhost:4000`
- Development Dashboard: `http://localhost:9400`

## Frontend Development (SvelteKit)

### Package Manager
- **Use Bun exclusively**
- `cd frontend && bun install`

### API Calls
- **ALWAYS use generated Encore client** - never manual `fetch()`

```typescript
// ✅ CORRECT
import { users } from '~encore/clients';
const user = await users.create({ name: 'John' });

// ❌ WRONG
const response = await fetch('/api/users', { ... }); // NEVER DO THIS
```

### Svelte 5 Syntax (Required)
- Use **runes** for all state management - not Svelte 4 syntax

```typescript
// State
let count = $state(0);

// Derived values
const double = $derived(count * 2);

// Side effects
$effect(() => {
  // Note: In frontend, console.log is acceptable for local debugging
  // In backend, ALWAYS use encore.dev/log for structured logging
});

// Props
let { foo = true, bar } = $props();

// Event handlers (no colons)
<button onclick={handleClick}>Click</button>
```

### Path Mappings
```json
{
  "paths": {
    "~encore/*": ["./backend/encore.gen/*"],
    "~/*": ["./*"]
  }
}
```

### Generate Encore Client
After backend API changes, always regenerate the frontend client:
```bash
cd frontend && bun run gen
```

### Build & Run
```bash
# Run frontend
cd frontend && bun run dev

# Type checking
cd frontend && bun run check

# Build
cd frontend && bun run build
```

**Frontend Dev Server:** `http://localhost:5173`

## Type Safety Workflow

1. Update backend endpoint
2. Run `bun run gen` in frontend to regenerate client
3. Update frontend to use new types
4. Commit both changes together

**Generated clients guarantee full end-to-end type safety.**

## Code Style & Formatting

### Biome Configuration
- Indentation: 2 spaces
- Line width: 100 characters
- Line ending: LF
- Linter: Enabled with strict rules
- `noExplicitAny`: Error level
- Organize imports: Enabled

### Format & Lint
```bash
# Format code
bun run format

# Lint code
bun run lint
```

## Security Requirements

### CORS Settings
Configured in `backend/encore.app`:
```json
"global_cors": {
  "allow_origins_without_credentials": ["*"],
  "allow_origins_with_credentials": [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://screengraph.vercel.app",
    "https://*.vercel.app"
  ]
}
```

### Security Practices
- Never hardcode passwords, tokens, or secrets
- Use Encore Cloud for secret management (`encore secret set`)
- Validate all user input
- Set cookies with `httpOnly`, `secure`, and `sameSite: strict`

## Testing Guidelines

### Philosophy
- Focus on flow reliability, correctness, and creative consistency
- Test high-level flows, not just edge cases or petty tests
- Validate behavior, not just functional output

### Backend Tests
```bash
# Run all tests
encore test

# Run specific test file
encore test backend/agent/tests/determinism.test.ts

# Watch mode
encore test --watch

# With coverage
encore test --coverage
```

**Note:** Always use `encore test`, never `bun test` directly for Encore applications.

### Frontend Tests
```bash
cd frontend
bun test
```

## Build & Deployment

### Backend Deployment (Encore Cloud)
```bash
# Authenticate
encore auth login

# Deploy
git push encore main

# View deployment status
# https://app.encore.cloud/steering-wheel-documentation-65b2/deploys
```

Backend builds via Encore Cloud CI - don't script builds manually.

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Production deploy
vercel --prod
```

**Environment Variables:**
- `PUBLIC_API_BASE`: `https://steering-wheel-documentation-65b2.encr.app` (production)
- `PUBLIC_API_BASE`: `http://localhost:4000` (local development)

## Prohibited Actions

### Absolute Prohibitions
- ❌ No root `package.json`
- ❌ No root `encore.app`
- ❌ No shared `node_modules`
- ❌ No backend ↔ frontend imports
- ❌ No manual HTTP `fetch()` calls
- ❌ No `console.log` (use structured logging)
- ❌ No `any` type
- ❌ No magic strings or numbers
- ❌ No British English spelling

## Common Commands Reference

### Development Workflow
```bash
# Backend
cd backend && encore run

# Frontend
cd frontend && bun run dev

# Regenerate frontend client after backend changes
cd frontend && bun run gen

# Reset local database
cd backend && encore db reset

# View logs
encore logs
```

### Database Operations
```bash
# Access database shell
encore db shell run --write

# Get connection string
encore db conn-uri run
```

### Testing
```bash
# Backend tests
cd backend && encore test

# Frontend tests
cd frontend && bun test
```

## Documentation Reference

- Main README: `/README.md`
- Backend Guide: `/backend/CLAUDE.md`
- Frontend Guide: `/frontend/CLAUDE.md`
- Founder Rules: `/.cursor/rules/founder_rules.mdc`
- Backend Engineer Guide: `/.cursor/rules/backend_engineer.mdc`
- Frontend Engineer Guide: `/.cursor/rules/frontend_engineer.mdc`
- Encore.ts Instructions: `/.cursor/rules/backend_llm_instructions.mdc`
- Svelte Instructions: `/.cursor/rules/frontend_llm_instruction.mdc`
- Logging Guide: `/backend/logging/CLAUDE.md`
- Agent Architecture: `/backend/agent/CLAUDE.md`

## Quick Troubleshooting

### "Type not found" errors in frontend
```bash
cd frontend && bun run gen
```

### Database migration stuck
```bash
encore db reset
encore run
```

### CORS errors in development
- Check `backend/encore.app` has `http://localhost:5173` in allowed origins
- Verify frontend is running on correct port

### Port already in use
```bash
lsof -ti:4000 | xargs kill
```

## Key Project Patterns

### API Changes Workflow
1. Update backend endpoint
2. Run `bun run gen` in frontend
3. Update frontend to use new types
4. Commit both changes together

### Handoff Document (Optional)
- Project uses handoff documents (`BACKEND_HANDOFF.md`, `FRONTEND_HANDOFF.md`) to communicate in-flight work
- Before editing code with uncommitted changes, check relevant handoff documents to understand context
- Before switching tasks or ending a session, update the appropriate handoff document with your progress

### Cursor Commands
The project includes cursor commands in `.cursor/commands/` directory to help with common workflows:
- `update-handoff` - Update BACKEND_HANDOFF.md or FRONTEND_HANDOFF.md with current work status
- `open-pr` - Commit, push, and open a PR towards main branch
- `create_a_bug_for_it` - Create a bug report in /docs/bug-logs
- `update_knowledge_graph.txt` - Update Graphiti MCP Memory System with session summary

## Why These Rules Matter

- **Isolation** → Clean Deployment
- **Type Safety** → Zero API Drift
- **Encapsulation** → Predictable CI
- **Clarity** → Easy Onboarding & Maintenance
- **Structured Logging** → Powerful Debugging & QA
- **No Magic Values** → Maintainable Codebase
