# ScreenGraph

**Autonomous Mobile App Exploration Platform**

ScreenGraph enables autonomous agents to explore and understand mobile applications through advanced UI perception, action planning, and goal-oriented execution.

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   SvelteKit     │────────▶│   Encore Backend │
│   Frontend      │  REST   │   Services      │
│   (Vercel)      │  +WS    │   (Encore Cloud)│
└─────────────────┘         └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │   Database      │
                              └─────────────────┘
```

- **Frontend:** SvelteKit app deployed on Vercel
- **Backend:** Encore.ts services deployed on Encore Cloud
- **Database:** PostgreSQL managed by Encore

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
├── backend/                  # Encore backend services
│   ├── run/                 # Run service (agent orchestration)
│   │   ├── start.ts        # Start new run endpoint
│   │   ├── stream.ts       # WebSocket streaming
│   │   ├── cancel.ts       # Cancel run endpoint
│   │   └── health.ts       # Health check
│   ├── steering/            # Steering service (documentation)
│   │   ├── list-docs.ts
│   │   ├── get-doc.ts
│   │   └── update-doc.ts
│   ├── agent/               # Agent domain logic
│   │   ├── domain/         # Core business logic
│   │   ├── nodes/          # Agent nodes
│   │   ├── orchestrator/   # Orchestration
│   │   └── tests/          # Agent tests
│   ├── db/                  # Database migrations
│   │   └── migrations/
│   └── steering-docs/      # Documentation files
├── frontend/                 # SvelteKit frontend
│   ├── src/
│   │   ├── routes/         # SvelteKit routes
│   │   │   ├── +page.svelte              # Start run
│   │   │   ├── run/[id]/+page.svelte     # Run timeline
│   │   │   └── steering/+page.svelte     # Steering wheel
│   │   └── lib/
│   │       ├── api.ts      # API client
│   │       └── components/ # UI components
│   ├── svelte.config.js
│   ├── vercel.json
│   └── package.json
├── encore.app               # Encore configuration
├── package.json             # Root dependencies
└── README.md               # This file
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

- `POST /run` - Start new agent run
- `WS /run/:id/stream` - Stream run events
- `POST /run/:id/cancel` - Cancel run
- `GET /health` - Health check
- `GET /steering/docs` - List documentation
- `GET /steering/docs/:category/:filename` - Get documentation

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

- [Encore.ts Docs](https://encore.dev/docs)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Vercel Docs](https://vercel.com/docs)
- [API Documentation](backend/API_DOCUMENTATION.md)

### Development Guides

- [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development guide
- [SPLIT_REPO_MILESTONES.md](SPLIT_REPO_MILESTONES.md) - Repository split plan
- [MILESTONE_2_STATUS.md](MILESTONE_2_STATUS.md) - Backend hardening status
- [MILESTONE_3_STATUS.md](MILESTONE_3_STATUS.md) - Frontend migration status

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

See [SPLIT_REPO_MILESTONES.md](SPLIT_REPO_MILESTONES.md) for current milestones:

- ✅ Milestone 1: Repo split strategy
- ✅ Milestone 2: Backend hardening
- 🟡 Milestone 3: SvelteKit migration (in progress)
- ⏳ Milestone 4: Integration & cutover

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
