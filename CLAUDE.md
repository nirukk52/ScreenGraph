# CLAUDE.md - Project Quick Reference

> **Purpose**: This document is personally managed by the founder. Keep it short, clear, to the point with bulletpoints/surgical edits.

---

## 📚 Documentation Hierarchy & Usage

### 1. `.cursor/rules/founder_rules.mdc` — Non-Negotiable Standards
**What**: Immutable development rules enforced across all agents/developers  
**Scope**: Architecture boundaries, naming conventions, type safety, American spelling  
**Usage**: Reference when making ANY code changes to ensure compliance

**Examples:**
- ✅ Must use `calculateTotalPrice()` not `handle()`
- ✅ Backend/frontend completely independent (no shared node_modules)
- ✅ No `any` types, no `console.log`, American English only

---

### 2. `CLAUDE.md` (This File) — Project Quick Reference
**What**: Project-specific configuration, ports, commands  
**Scope**: Environment values, common commands, troubleshooting  
**Usage**: Quick lookup for "how do I run X?" or "what port is Y?"

**Examples:**
- Backend runs on `http://localhost:4000`
- Start services: `bun run dev` or `cd .cursor && task founder:servers:start`
- Regenerate client: `task founder:workflows:regen-client`

---

### 3. `.cursor/commands/` (Taskfile) — Deterministic Automation
**What**: Shell scripts and Task commands for repeatable workflows  
**Scope**: Dev server management, database operations, testing, deployment  
**Usage**: Run via `cd .cursor && task <command>` for any automation

**Examples:**
```bash
task founder:servers:start     # Start backend + frontend with health checks
task backend:db:migrate        # Run database migrations
task qa:smoke:all              # Run all smoke tests
```

---

### 4. `.claude-skills/` — AI Conversational Playbooks
**What**: Multi-step procedures for AI agents to orchestrate complex tasks  
**Scope**: Debugging workflows, skill creation, analysis procedures  
**Usage**: Say to Claude: "Run smoke tests" or "Debug the backend issue"

**Types:**
- **Task-based** (30 skills): Call Task commands + MCP tools (`skills.json`)
- **Knowledge-based** (5 skills): Multi-phase debugging procedures (`SKILL.md`)

**Examples:**
- Say: "Run smoke tests" → Executes `task qa:smoke:all`
- Say: "Debug backend" → Follows 10-phase Encore.ts debugging procedure
- Say: "Create a skill for X" → Runs skill-creator workflow

---

## When to Use What?

| Scenario | Use |
|----------|-----|
| "What naming convention?" | `.cursor/rules/founder_rules.mdc` |
| "What port is frontend?" | `CLAUDE.md` |
| "Start the dev servers" | `.cursor/commands/` (Task) |
| "Debug this complex issue" | `.claude-skills/` |
| "Can I use `any` type?" | `.cursor/rules/founder_rules.mdc` (NO!) |
| "Regenerate API client" | `CLAUDE.md` → `task founder:workflows:regen-client` |
| "Run database migration" | `.cursor/commands/` → `task backend:db:migrate` |
| "Multi-step debugging help" | `.claude-skills/backend-debugging` |
> 
> **Scope**: Project-specific configurations and quick-start commands ONLY. DO NOT duplicate content from `.cursor/rules/*.mdc`.
> 
> **For comprehensive rules, see**: `.cursor/rules/founder_rules.mdc`, `backend_coding_rules.mdc`, `frontend_engineer.mdc`, `frontend_llm_instruction.mdc`

---

## Quick Start

### 1. Turborepo Harness (FR-018 Pilot)
```bash
# Start backend + frontend together
bun run dev

# Focus on individual service
bun run dev:backend
bun run dev:frontend

# Delegate to Taskfile via harness bridge
bun run task founder:servers:status
```

**Notes:**
- Harness introduced in FR-018 using Turborepo (`turbo run`).
- Root `package.json` is dev-only; backend/frontend dependencies stay isolated.
- Guardrails (Taskfile, Husky, CI) still run via `bun run task …`.
- Standard ports come from `.env` (shared across all trees).

### 2. Unified Automation (Task Commands)
```bash
# Start everything (with health checks & auto-wait)
cd .cursor && task founder:servers:start

# Check status
task founder:servers:status

# Run tests
task qa:smoke:all

# Stop services
task founder:servers:stop

# List all commands
task --list
```

**Start Command Features:**
- ✅ Auto-installs dependencies
- ✅ Clears conflicting processes
- ✅ Health checks (waits for services to be ready)
- ✅ Streams logs directly in the harness terminal
- ✅ Error handling with helpful messages

### 3. Legacy Commands (Still Work)
```bash
@start-services      # Starts both backend + frontend
@stop-services       # Stops all services
```

### 4. Generate Encore Client
```bash
# NEW way
cd .cursor && task founder:workflows:regen-client

# OR old way
cd frontend && bun run gen
```

---

## Unified Automation System ⭐ NEW

### Four Entry Points, One System

All automation runs through `automation/` library via **Task commands**:
- **Husky Hooks** → Auto-validate on commit/push
- **Cursor Commands** → Manual `task <command>`
- **Claude Skills** → Natural language → Tasks
- **GitHub Actions** → CI/CD (scaffolded)

### Common Commands
```bash
cd .cursor  # All commands run from .cursor/

# Development
task founder:servers:start           # Start backend + frontend
task founder:servers:stop            # Stop all services
task founder:servers:status          # Check service status

# Testing
task qa:smoke:backend                # Backend smoke test
task qa:smoke:frontend               # Frontend smoke test
task qa:smoke:all                    # All smoke tests

# Quality
task founder:rules:check             # Validate founder rules
task frontend:typecheck              # TypeScript check
task frontend:lint                   # Lint check

# Backend
task backend:dev                     # Start backend only
task backend:health                  # Health check
task backend:db:migrate              # Run migrations
task backend:db:shell                # Database shell

# Frontend
task frontend:dev                    # Start frontend only
task frontend:build                  # Production build
task frontend:gen                    # Regenerate client

# Environment
task ops:env:print                   # Print env vars from .env
```

### Git Hooks (Auto-Enforced)
- **pre-commit**: Validates founder rules (no console.log, no any types, American spelling)
- **pre-push**: Runs smoke tests before push
- Bypass: `HUSKY=0 git commit` (emergency only)

### Claude Skills (AI-Assisted)
Say to Claude: "Run smoke tests" → Executes `task qa:smoke:all`  
Say to Claude: "Create a skill for database migrations" → Creates new skill  
See: `.claude-skills/skills.json` for 33 available skills

**Skill Types:**
- **Task-based** (30 skills): Automation workflows in `skills.json`
- **Knowledge-based** (5 skills): Playbooks captured in `SKILL.md`
  - `backend-debugging` - 10-phase Encore.ts debugging
  - `frontend-debugging` - 10-phase SvelteKit debugging
  - `webapp-testing` - Playwright-first ScreenGraph testing playbook (includes Cursor tooling appendix)
  - `graphiti-mcp-usage` - Graphiti knowledge-management workflow
  - `skill-creator` - Create new skills workflow

**Creating New Skills:**
```bash
# Say to Claude:
"Create a skill for [purpose]"

# Or use directly:
python3 skills-main/skill-creator/scripts/init_skill.py <skill-name> --path .claude-skills/
```

### Documentation
- `automation/README.md` - Automation library docs
- `.cursor/commands/README.md` - All Task commands
- `.husky/README.md` - Git hooks guide
- `.claude-skills/README.md` - Skills documentation
- `.claude-skills/skill-creator/SKILL.md` - How to create new skills

---

## Project-Specific Configuration

### CORS Settings (encore.app)
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

### Path Mappings (tsconfig.json)
```json
"paths": {
  "~encore/*": ["./backend/encore.gen/*"],
  "~/*": ["./*"]
}
```

### Package Manager
- **All projects**: Use `bun` exclusively
- **Backend**: `cd backend && bun install`
- **Frontend**: `cd frontend && bun install`

### Environment Files
- `.env` (committed defaults for main tree)
- `.env.example` (template)
- Type-safe validation: `backend/config/env.ts`, `frontend/src/lib/env.ts`
- Encrypted secrets: `.env.vault` managed via `bunx dotenvx`

---

## Project-Specific Usage Patterns

### API Calls (Frontend)
```typescript
// ✅ ALWAYS use generated Encore client
import { users } from '~encore/clients';
const user = await users.create({ name: 'John' });

// ❌ NEVER use manual fetch
const response = await fetch('/api/users', { ... }); // WRONG
```

### Logging (Backend)
```typescript
// ✅ ALWAYS use Encore structured logging
import log from "encore.dev/log";
const logger = log.with({ module: "agent", runId });
logger.info("state transition", { from: "idle", to: "planning" });

// ❌ NEVER use console.log
console.log("something happened"); // WRONG
```

### Database Queries (Backend)
```typescript
// ✅ Use Encore SQLDatabase with typed results
const rows = await db.query<{ id: string; name: string }>`
  SELECT id, name FROM users WHERE status = ${status}
`;
for await (const row of rows) {
  logger.info("user found", { userId: row.id });
}
```

---

## Environment-Specific Values

### Local Development
- Backend API: `http://localhost:4000`
- Frontend Dev: `http://localhost:5173`
- Encore Dashboard: `http://localhost:9400`

### Production
- Backend: Encore Cloud (auto-deployed)
- Frontend: Vercel (auto-deployed from `frontend/`)

---

## Key Project Files

### Configuration
- `backend/encore.app` - Backend config with CORS and services
- `tsconfig.json` - Shared TypeScript config with path mappings
- `biome.json` - Code formatting and linting rules

### Generated
- `backend/encore.gen/` - Auto-generated Encore types and clients
- `frontend/src/lib/encore-client.ts` - Generated API client (run `bun run gen`)

### Data
- `backend/db/migrations/` - Database migrations (sequential `.up.sql` files)
- `backend/artifacts/` - Artifact storage service
- `backend/graph/` - Screen graph projection and hashing

---

## Common Commands (Task-Based) ⭐ NEW

### Development
```bash
cd .cursor  # All task commands run from .cursor/

# Regenerate frontend client after backend changes
task founder:workflows:regen-client

# View logs
task backend:logs      # or task frontend:logs

# Check health
task backend:health
```

### Database
```bash
cd .cursor

# Reset database
task founder:workflows:db-reset

# Run migrations
task backend:db:migrate

# Access database shell
task backend:db:shell
```

### Testing
```bash
cd .cursor

# Backend tests
task backend:test

# Frontend tests
task frontend:test

# Smoke tests
task qa:smoke:all
```

### Legacy Commands (Still Work)
```bash
# Old way (still functional)
cd frontend && bun run gen
cd backend && encore db reset
cd backend && encore test
```

---

## Project-Specific Conventions

### Naming
- **Functions**: `verbNoun` format (e.g., `createAgentState`, `transitionToPlanning`)
- **Types/Interfaces**: `PascalCase` with descriptive names (e.g., `AgentStateSnapshot`, `RunEventPayload`)
- **Files**: `kebab-case.ts` or `PascalCase.ts` for classes (e.g., `agent-state.repo.ts`, `AgentMachine.ts`)

### File Organization
- **Backend**: Group by service/domain (`backend/agent/`, `backend/run/`, `backend/graph/`)
- **Frontend**: Route-based (`frontend/src/routes/`, `frontend/src/lib/components/`)

### Enums and Constants
```typescript
// ✅ Use literal unions or const enums
type AgentStatus = "idle" | "planning" | "acting" | "completed";
const RUN_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  COMPLETED: "completed"
} as const;

// ❌ Never use magic strings
if (status === "active") { ... } // WRONG - use RUN_STATUS.ACTIVE
```

---

## Migration Patterns

### Database Migrations
- Sequential numbering: `001_initial.up.sql`, `002_add_column.up.sql`
- One migration per logical change
- Always test rollback scenario mentally
- Use American English spelling in column names

### API Changes
1. Update backend endpoint
2. Run `bun run gen` in frontend
3. Update frontend to use new types
4. Commit both changes together

---

## Troubleshooting

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

---

## Document Maintenance Rules

### ✅ Add to CLAUDE.md
- Project-specific configuration values
- Environment-specific URLs/ports
- Common commands unique to this project
- Project-specific naming conventions
- Quick troubleshooting for common issues

### ❌ Do NOT Add to CLAUDE.md
- General Encore.ts concepts (→ `backend_coding_rules.mdc`)
- General coding principles (→ `founder_rules.mdc`)
- Backend patterns/architecture (→ `backend_coding_rules.mdc`)
- Frontend patterns/architecture (→ `frontend_engineer.mdc`)
- Philosophy or "why" explanations (→ cursor rules)

### Editing Guidelines
- Keep entries to 1-3 lines with code examples
- Use bulletpoints, never prose
- Update immediately when project config changes
- Remove outdated entries proactively
- Link to cursor rules for detailed explanations
- Enforce naming conventions: rule files must end `_rules`, skill artifacts end `_skill`, and `.cursor/commands` entries stay natural-language headlines of five words or fewer.
