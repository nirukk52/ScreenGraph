# ScreenGraph

**Autonomous UX Mapping, Drift Detection & AI-Driven QA**

AI agents crawl mobile apps, discover screens/transitions, and build a navigable knowledge graph.

## What It Does

- Autonomous exploration via UI actions
- Real-time UX map generation
- Visual/structural diff detection
- Competitor UX mapping
- Test gap identification
- Analytics overlay on graph
- AI agent context for RAG/planning

## Who It's For

- QA: Regression detection, exploratory testing
- Product: UX analysis, journey mapping
- Design: Flow consistency validation
- Founders: Competitive benchmarking
- Engineering: Visual bug replay

## Core Concepts

- **ScreenGraph**: Screens (nodes) + actions (edges)
- **Flows**: Reusable step sequences
- **Perceptual Hashing**: Screen uniqueness detection
- **Policies**: Exploration strategies
- **Artifacts**: Screenshots, XMLs, OCR, traces

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   SvelteKit     │────────▶│   Encore Backend│
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

**Stack:**
- **Backend**: Encore.ts microservices
- **Frontend**: SvelteKit 2 (Svelte 5)
- **Agent**: XState-driven orchestration
- **Database**: PostgreSQL with event sourcing
- **Logging**: Structured logs (module/actor)

---

## 📊 ScreenGraph Storage

**Single-Sink Architecture:**
- Agent writes events to `run_events` (append-only log)
- Graph projection service derives screen graph
- No dual-writes

**Screen Deduplication:**
- Identified by structural layout (XML) + visual appearance (perceptual hash)
- Same screen across runs → single canonical record
- Tracks: first seen, last seen, visit count

**Navigation Edges:**
- Captures: Screen A → Action → Screen B
- Evidence-based traversal counts
- Enables pathfinding + reachability analysis

**API Endpoints (Planned):**
- `GET /graph/:app_id` - Full graph
- `GET /graph/screens/:screen_id` - Screen details
- `GET /graph/:app_id/paths` - Pathfinding
- `GET /graph/:app_id/coverage` - Coverage metrics
- `GET /graph/:app_id/stream` - Real-time SSE

---

## 🚀 Prerequisites

**Install Bun:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Install Encore CLI:**
```bash
# macOS
brew install encoredev/tap/encore

# Linux
curl -L https://encore.dev/install.sh | bash
```

---

## 📦 Setup

**Clone:**
```bash
git clone <repository-url>
cd ScreenGraph
```

**Install Dependencies:**
```bash
bun install
cd frontend && bun install
```

**Environment (.env):**
```bash
# Backend: Managed by Encore (encore secret set)
# Frontend: Create frontend/.env
PUBLIC_API_BASE=http://localhost:4000  # local
# PUBLIC_API_BASE=https://steering-wheel-documentation-65b2.encr.app  # prod
```

---

## Run

### Backend
```bash
cd backend && encore run
```
- API: `http://localhost:4000`
- Dashboard: `http://localhost:9400`

### Frontend
```bash
cd frontend && bun run dev
```
- UI: `http://localhost:5173`

---

## Test

### Backend
```bash
cd backend && encore test
```

**Specific test:**
```bash
cd backend && encore test agent/tests/determinism.test.ts
```

### Frontend
```bash
cd frontend && bun test
```

---

## 🌐 Key API Endpoints

**Run Management:**
- `POST /run` - Start agent run
- `GET /run/:id/stream` - SSE event stream
- `POST /run/:id/cancel` - Cancel run
- `GET /health` - Health check

**Event Types:**
- `agent.*` - Agent state transitions
- `screen.discovered` - New screen found
- `screen.mapped` - Screen added to graph
- `edge.created` - New navigation edge
- `edge.reinforced` - Existing edge traversed

---

## 📁 Project Structure

```
ScreenGraph/
├── backend/
│   ├── agent/              # Agent orchestration
│   │   ├── orchestrator/   # XState machine + worker
│   │   ├── nodes/          # Setup/Main/Policy/Recovery/Terminal
│   │   ├── ports/          # Interfaces
│   │   └── adapters/       # Implementations
│   ├── run/                # Run API endpoints
│   ├── graph/              # Graph projection
│   ├── artifacts/          # Screenshot/XML storage
│   └── db/migrations/      # Schema migrations
├── frontend/
│   ├── src/routes/         # SvelteKit routes
│   └── src/lib/            # Components + Encore client
├── .cursor/
│   ├── commands/           # Task automation
│   └── rules/              # Coding standards
└── vibes/                  # Engineering personas
```

---

## 🔧 Database

**Migrations:**
```bash
cd backend && encore db reset --all    # Reset dev cluster
cd backend && encore db shell db       # Shell access
cd backend && encore db migrate        # Run migrations
```

**Test Cluster:**
```bash
cd backend && encore db reset --all --test
cd backend && encore db shell db --test
```

---

## 🐛 Troubleshooting

**Port conflicts:**
```bash
lsof -ti:4000 | xargs kill    # Backend
lsof -ti:5173 | xargs kill    # Frontend
```

**Database issues:**
```bash
cd backend && encore db reset --all
```

**Frontend sync errors:**
```bash
cd frontend
rm -rf .svelte-kit node_modules
bun install
bunx svelte-kit sync
bun run dev
```

---

## 📤 Deployment

**Backend (Encore Cloud):**
```bash
encore auth login
git push encore main
```
Dashboard: https://app.encore.cloud/steering-wheel-documentation-65b2

**Frontend (Vercel):**
```bash
cd frontend && vercel --prod
```
Set env: `PUBLIC_API_BASE=https://steering-wheel-documentation-65b2.encr.app`

---

## 🔐 Secrets

**Backend:**
```bash
encore secret set --type prod SecretName
encore secret list
```

**Frontend:**
Vercel Dashboard → Settings → Environment Variables

---

## 📊 Monitoring

**Backend:**
- Dashboard: https://app.encore.cloud/steering-wheel-documentation-65b2
- Logs: `encore logs` or `encore logs --env=prod`
- Metrics: Auto-collected by Encore

**Frontend:**
- Vercel Dashboard: https://vercel.com/dashboard
- Analytics: Enable in settings

---

## 🎯 Status

**✅ Completed:**
- Agent orchestration (XState machine)
- Structured logging (module/actor)
- Type-safe APIs (Encore generated clients)
- Event sourcing + snapshots
- Run lifecycle (start/cancel/stream)

**🟡 In Progress:**
- Node handler implementation
- Main loop (Perceive → Act → Verify)
- Graph projection service

**⏳ Upcoming:**
- LLM integration for action selection
- Graph visualization UI
- Multi-policy exploration
- Analytics overlay

---

## 📚 Resources

**Framework Docs:**
- [Encore.ts](https://encore.dev/docs)
- [SvelteKit](https://kit.svelte.dev/docs)

**Project Docs:**
- `CLAUDE.md` - Commands + quick reference
- `.cursor/rules/` - Coding standards
- `backend/agent/CLAUDE.md` - Agent architecture
- `backend/graph/README.md` - Graph implementation
- `backend/API_DOCUMENTATION.md` - Complete API reference

**External:**
- [Encore Cloud](https://app.encore.cloud)
- [Vercel Dashboard](https://vercel.com/dashboard)

---

## 🤝 Contributing

**Git Workflow:**
```bash
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: description"
git push origin feature/my-feature
```

**Standards:**
- Backend: Encore.ts conventions
- Frontend: Svelte 5 runes (`$state`, `$derived`, `$effect`)
- TypeScript: Strict mode, no `any`
- Testing: All tests passing before PR

---

## 📝 License

[Your License Here]

---

**ScreenGraph** - Autonomous UX mapping for mobile apps.

For detailed commands: `CLAUDE.md`  
For coding standards: `.cursor/rules/founder_rules.mdc`
