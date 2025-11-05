# ScreenGraph

**Autonomous Mobile App Exploration Platform**

ScreenGraph enables autonomous agents to explore and understand mobile applications through advanced UI perception, action planning, and goal-oriented execution.

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   SvelteKit     │────────▶│   Encore Backend │
│   Frontend      │  REST   │   Services      │
│   (Vercel)      │  +SSE   │   (Encore Cloud)│
└─────────────────┘         └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │   + Event Store │
                              └─────────────────┘
```

### Core Components
- **Frontend:** SvelteKit 2 (Svelte 5) deployed on Vercel
- **Backend:** Encore.ts microservices on Encore Cloud
- **Agent:** XState-driven orchestration (`backend/agent/engine/xstate/agent.machine.ts`) with persistent state snapshots
- **Logging:** Unified structured logs with module/actor organization
- **Database:** PostgreSQL with event sourcing and snapshot persistence

### Recent Milestones ✅
- **Agent Orchestration**: XState-first machine with integrated retry/backtrack
- **Structured Logging**: Production-ready log-based QA methodology
- **Type Safety**: End-to-end via Encore generated clients
- **Graph Projection**: Event-sourced screen graph with canonical screen deduplication

---

## 📊 ScreenGraph Storage & Querying

### Overview

ScreenGraph builds a **canonical graph** of mobile app screens and navigation edges by projecting agent perception events into persistent graph tables.

### How It Works

**Single-Sink Architecture**
- Agent writes all events to `run_events` (append-only log)
- Graph projection service reads events and derives screen graph
- No dual-writes: clean separation between agent logic and graph storage

**Screen Deduplication**
- Each screen is identified by its structural layout (XML) and visual appearance (perceptual hash)
- Same screen encountered across multiple runs → single canonical record
- Tracks discovery metadata: first seen, last seen, visit count

**Navigation Edges**
- Captures transitions: Screen A → Action → Screen B
- Evidence-based: counts how many times each path is traversed
- Enables pathfinding and reachability analysis

### Planned API Endpoints

**Graph Retrieval**
- `GET /graph/:app_id` - Retrieve complete application graph (screens, actions, edges)
- `GET /graph/screens/:screen_id` - Get detailed screen info with incoming/outgoing edges

**Graph Analysis**
- `GET /graph/:app_id/paths` - Find navigation paths between screens
- `GET /graph/:app_id/coverage` - Exploration completeness metrics
- `GET /graph/:app_id/unreachable` - Identify isolated screens

**Live Updates**
- `GET /graph/:app_id/stream` - Real-time SSE stream of graph changes across all runs
- Per-run graph events already available via `/run/:id/stream`

**Event Types**: `screen.discovered`, `screen.mapped`, `edge.created`, `edge.reinforced`, `coverage.updated`

> **Implementation Details**: See `backend/graph/README.md` for schemas, algorithms, and operational procedures

---

### Next Steps: Graph Service Implementation

#### Phase 1: Projection Service (Current Priority)
- [ ] Create `/graph` Encore service
- [ ] Implement projection cursor table (`graph_projection_cursors`)
- [ ] Background worker to tail `run_events` and project to graph tables
- [ ] Add `source_run_seq` column to `graph_persistence_outcomes` (migration 004)
- [ ] Update `/run/:id/stream` to interleave graph outcomes

#### Phase 2: Query Endpoints
- [ ] `GET /graph/:app_id` - Full graph retrieval
- [ ] `GET /graph/screens/:screen_id` - Screen details with edges
- [ ] `GET /graph/:app_id/coverage` - Coverage statistics
- [ ] Add pagination and filtering for large graphs

#### Phase 3: Advanced Querying
- [ ] `GET /graph/:app_id/paths` - Path finding between screens
- [ ] `GET /graph/:app_id/unreachable` - Detect unreachable screens
- [ ] `GET /graph/:app_id/diff?from_run=:A&to_run=:B` - Compare graph states

#### Phase 4: Cross-Run Streaming
- [ ] `GET /graph/:app_id/stream` - Real-time graph events (all runs)
- [ ] Pub/Sub topic: `graph.events.{app_id}`
- [ ] Frontend dashboard for live graph visualization

#### Phase 5: Graph Analytics
- [ ] Coverage heatmaps (which screens/actions explored most)
- [ ] Graph complexity metrics (cyclomatic complexity, average path length)
- [ ] Exploration efficiency (time to discover N% of graph)

---

## 🚀 Quick Start

### Prerequisites

- **Bun** - Package manager and runtime
- **Encore CLI** - Backend framework
- **Git** - Version control

#### Install Bun

```bash
# macOS
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

#### Install Encore CLI

```bash
# macOS
brew install encoredev/tap/encore

# Linux
curl -L https://encore.dev/install.sh | bash

# Verify installation
encore version
```

---

## 📦 Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd ScreenGraph
```

### 2. Install Dependencies

```bash
# Root dependencies (Encore.dev)
bun install

# Frontend dependencies
cd frontend
bun install
cd ..
```

### 3. Environment Configuration

#### Backend (Encore)

No `.env` file needed. Encore manages secrets through:
- **Encore Cloud Dashboard:** https://app.encore.cloud
- **CLI:** `encore secret set`

#### Frontend (SvelteKit)

Create `frontend/.env`:

```bash
# Production API
PUBLIC_API_BASE=https://steering-wheel-documentation-65b2.encr.app

# Local development
# PUBLIC_API_BASE=http://localhost:4000
```

---

## 🖥️ Local Development

### Backend (Encore)

#### Start Backend Services

```bash
# From project root
encore run
```

**Services Available:**
- API: `http://localhost:4000`
- Development
 Dashboard: `http://localhost:9400`

#### Database Migrations

```bash
# Reset database (local only)
encore db reset run steering

# Connect to database shell
encore db shell db

# Get connection string
encore db conn-uri db
```

#### Viewing Logs

```bash
# Stream logs
encore logs

# Production logs
encore logs --env=prod
```

### Frontend (SvelteKit)

#### Start Development Server

```bash
cd frontend
bun run dev
```

**Frontend Available:** `http://localhost:5173`

#### Type Checking

```bash
cd frontend
bun run check
```

---

## 🧪 Testing

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
bun run test
```

---

## 📤 Deployment

### Backend to Encore Cloud

#### 1. Authenticate

```bash
encore auth login
encore auth whoami
```

#### 2. Deploy

```bash
# Stage changes
git add -A
git commit -m "feat: description of changes"

# Deploy to Encore Cloud
git push encore main
```

**Deployment URL:** https://app.encore.cloud/steering-wheel-documentation-65b2/deploys

#### 3. Verify Deployment

- Check dashboard for build status
- Test API endpoints
- Verify database migrations applied

### Frontend to Vercel

#### Option A: Vercel CLI (Recommended)

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

#### Option B: GitHub Integration

1. Connect repository to Vercel
2. Set environment variables:
   - `PUBLIC_API_BASE`: `https://steering-wheel-documentation-65b2.encr.app`
3. Configure build settings:
   - Build Command: `bun run build`
   - Output Directory: `dist`
   - Install Command: `bun install`
4. Deploy on push to `main`

#### Environment Variables Required

In Vercel Dashboard → Settings → Environment Variables:
- `PUBLIC_API_BASE`: `https://steering-wheel-documentation-65b2.encr.app`

---

## 📁 Project Structure

```
ScreenGraph/
├── docs/                    # Documentation
│   ├── LOGGING_PLAN.md     # Logging implementation plan
│   └── FOUNDER_QA_METHODOLOGY.md  # Log-based QA guide
├── backend/                 # Encore backend services
│   ├── CLAUDE.md           # Backend engineering context
│   ├── run/                # Run service (agent orchestration API)
│   │   ├── CLAUDE.md       # Run service documentation
│   │   ├── start.ts        # POST /run - Start new run
│   │   ├── stream.ts       # GET /run/:id/stream - SSE events
│   │   ├── cancel.ts       # POST /run/:id/cancel
│   │   └── health.ts       # GET /health
│   ├── agent/              # Agent domain logic
│   │   ├── CLAUDE.md       # Agent architecture guide
│   │   ├── orchestrator/   # Orchestration engine
│   │   │   ├── node-engine.ts      # Control plane
│   │   │   ├── node-registry.ts    # Handler factory
│   │   │   ├── orchestrator.ts     # Persistence
│   │   │   ├── worker.ts           # Execution loop
│   │   │   ├── subscription.ts     # Pub/Sub handler
│   │   │   └── README.md           # Architecture overview
│   │   ├── domain/         # Core business logic
│   │   ├── nodes/          # Agent nodes
│   │   │   ├── setup/      # EnsureDevice, ProvisionApp, etc.
│   │   │   ├── main/       # Perceive, Act, Verify cycle
│   │   │   ├── policy/     # Policy switching
│   │   │   ├── recovery/   # Error recovery
│   │   │   └── terminal/   # Completion nodes
│   │   ├── ports/          # Abstract interfaces
│   │   ├── adapters/       # Concrete implementations
│   │   ├── persistence/    # Repository implementations
│   │   └── tests/          # Agent tests
│   ├── logging/            # Structured logging
│   │   ├── CLAUDE.md       # Logging guide
│   │   ├── logger.ts       # Logger helpers
│   │   └── HANDOFF.md      # Implementation summary
│   ├── db/                 # Database migrations
│   │   └── migrations/
│   └── steering-docs/      # Documentation content
├── frontend/               # SvelteKit frontend
│   ├── CLAUDE.md          # Frontend engineering context
│   ├── src/
│   │   ├── routes/        # SvelteKit routes
│   │   │   ├── +page.svelte              # Start run
│   │   │   ├── run/[id]/+page.svelte     # Run timeline
│   │   │   └── steering/+page.svelte     # Steering wheel
│   │   └── lib/
│   │       ├── encore-client.ts  # Generated Encore client
│   │       └── components/       # UI components
│   ├── svelte.config.js
│   └── package.json
├── PROJECT_STATUS.md       # Current status and next steps
├── CLAUDE.md              # Encore + SvelteKit integration guide
├── LOCAL_SETUP.md         # Local development setup
└── README.md             # This file
```

---

## 🔧 Development Workflows

### Adding a New API Endpoint

**Backend (Encore):**

```typescript
// backend/run/new-endpoint.ts
import { api } from "encore.dev/api";

export const newEndpoint = api(
  { expose: true, method: "GET", path: "/new" },
  async () => {
    return { message: "Hello" };
  }
);
```

**Frontend (SvelteKit):**

```typescript
// frontend/src/lib/api.ts
export async function callNewEndpoint() {
  const response = await fetch(`${API_BASE}/new`);
  return response.json();
}
```

### Adding a Database Migration

```bash
# Create migration file
touch backend/db/migrations/004_new_table.up.sql

# Write SQL
echo "CREATE TABLE new_table (...);" > backend/db/migrations/004_new_table.up.sql

# Encore auto-applies migrations on startup
encore run
```

### Frontend Page Routing

SvelteKit uses file-based routing:

```
src/routes/
├── +page.svelte              → /
├── about/+page.svelte         → /about
└── run/[id]/+page.svelte     → /run/:id
```

---

## 🌐 API Documentation

Full API documentation: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

### Key Endpoints

**Run Management:**
- `POST /run` - Start new agent run
- `GET /run/:id/stream` - Server-Sent Events stream of run events
- `POST /run/:id/cancel` - Cancel running job
- `GET /health` - Health check

**Documentation (Steering):**
- `GET /steering/docs` - List documentation
- `GET /steering/docs/:category/:filename` - Get documentation

### Logging & Observability

All components use structured logging with `module` and `actor` fields for filtering:

**Dashboard Search Examples:**
```
module:"agent" AND actor:"worker" AND runId:<ID>
module:"run" AND actor:"start" AND runId:<ID>
actor:"orchestrator" AND runId:<ID>
level:ERROR AND runId:<ID>
```

See [backend/logging/CLAUDE.md](backend/logging/CLAUDE.md) for complete logging guide.

---

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill
```

**Database connection errors:**
```bash
# Reset database
encore db reset run steering
```

**Can't find encore.app:**
```bash
# Verify file exists at root
ls encore.app
```

### Frontend Issues

**SvelteKit sync errors:**
```bash
cd frontend
rm -rf .svelte-kit
bunx svelte-kit sync
bun run dev
```

**TypeError on dev server start:**
```bash
cd frontend
rm -rf .svelte-kit node_modules
bun install
bunx svelte-kit sync
bun run dev
```

**Note:** Use `@sveltejs/adapter-auto` for local development, switch to `@sveltejs/adapter-vercel` before deploying.

**API not connecting:**
- Check `PUBLIC_API_BASE` environment variable
- Verify backend is running on correct port
- Check CORS configuration in `encore.app`

**Build errors:**
```bash
cd frontend
rm -rf node_modules .svelte-kit
bun install
bun run build
```

---

## 👥 Contributing

### Code Style

- **Backend:** Follow Encore.ts conventions
- **Frontend:** Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier configured

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Commit
git add -A
git commit -m "feat: description"

# Push
git push origin feature/my-feature

# Create PR on GitHub
```

### Testing Requirements

- Backend: All tests passing (`encore test`)
- Frontend: Manual testing before PR
- No console errors in browser

---

## 📚 Resources

### Documentation

- **[Encore.ts Docs](https://encore.dev/docs)** - Backend framework
- **[SvelteKit Docs](https://kit.svelte.dev/docs)** - Frontend framework
- **[API Documentation](backend/API_DOCUMENTATION.md)** - Complete API reference
- **[Logging Guide](backend/logging/CLAUDE.md)** - Structured logging reference
- **[Agent Architecture](backend/agent/CLAUDE.md)** - Orchestration design
- **[Backend Engineering](backend/CLAUDE.md)** - Backend standards
- **[Frontend Engineering](frontend/CLAUDE.md)** - Frontend standards

### Development Guides

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current status and next steps
- **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Detailed setup instructions
- **[CLAUDE.md](CLAUDE.md)** - Encore + SvelteKit integration
- **[docs/LOGGING_PLAN.md](docs/LOGGING_PLAN.md)** - Logging implementation plan
- **[docs/FOUNDER_QA_METHODOLOGY.md](docs/FOUNDER_QA_METHODOLOGY.md)** - Log-based QA guide

### External Services

- **Encore Cloud:** https://app.encore.cloud
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repository:** <repository-url>

---

## 🔐 Secrets Management

### Backend Secrets

Configure via Encore Cloud:

```bash
# Set secret
encore secret set --type prod SecretName

# List secrets
encore secret list

# View secret (if set)
encore secret get SecretName
```

### Frontend Environment Variables

Set in Vercel Dashboard:
- Settings → Environment Variables
- Add: `PUBLIC_API_BASE`

---

## 📊 Monitoring

### Backend (Encore Cloud)

- **Dashboard:** https://app.encore.cloud/steering-wheel-documentation-65b2
- **Logs:** `encore logs`
- **Metrics:** Available in dashboard
- **Traces:** Automatic with Encore

### Frontend (Vercel)

- **Dashboard:** https://vercel.com/dashboard
- **Analytics:** Enable in Vercel settings
- **Logs:** Available in Vercel dashboard

---

## 🎯 Milestones & Roadmap

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status.

### ✅ Completed
- Agent orchestration infrastructure (Agent Machine, Worker, Orchestrator)
- Structured logging with module/actor organization
- Type-safe API contracts with Encore generated clients
- Event sourcing and snapshot persistence
- Run lifecycle management (start, cancel, stream)

### 🟡 In Progress
- Node handler implementation (wiring to real Appium/LLM calls)
- Main loop nodes (Perceive → Act → Verify cycle)

### ⏳ Upcoming
- LangGraph.js integration for decision loop
- Policy switching and recovery nodes
- Frontend timeline UI for run visualization
- Performance optimization and monitoring

---

## 🤝 Getting Help

- **Team Channel:** [Slack/Discord]
- **Issues:** Create GitHub issue
- **Documentation:** Check docs/ folder
- **Encore Discord:** https://encore.dev/discord

---

## 📝 License

[Your License Here]

---

**Welcome to ScreenGraph! 🚀**

For detailed setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).
