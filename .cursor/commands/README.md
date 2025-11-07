# Cursor Commands

**Purpose:** Developer command palette powered by [Taskfile](https://taskfile.dev/).

All commands are defined as Task definitions and can be executed via:
- `task <namespace>:<command>` in terminal
- `@<command>` in Cursor chat (legacy shell scripts)
- Git hooks (Husky)
- GitHub Actions (CI/CD)
- Claude Skills (AI agent)

---

## Quick Reference

### Start Services
```bash
task founder:servers:start     # Start backend + frontend
task founder:servers:stop      # Stop all services
task founder:servers:status    # Check service status
```

### Development
```bash
task backend:dev               # Start backend only
task frontend:dev              # Start frontend only
task frontend:typecheck        # Run TypeScript checks
```

### Testing
```bash
task qa:smoke:backend          # Backend smoke tests
task qa:smoke:frontend         # Frontend smoke tests
task founder:testing:smoke     # Run all smoke tests
```

### Worktree Management
```bash
task shared:preflight          # Run preflight checks
task shared:check-worktree     # Verify worktree isolation
task ops:ports:show            # Show port assignments
```

### Quality Checks
```bash
task founder:rules:check       # Validate founder rules
task founder:workflows:regen-client  # Regenerate Encore client
```

---

## Task Namespaces

Tasks are organized by domain:

### `shared:*` - Shared Utilities
- `shared:preflight` - Run all preflight checks
- `shared:check-worktree` - Verify worktree isolation
- `shared:load-env` - Load environment variables
- `shared:validate:commit-message` - Validate commit message format

### `founder:*` - Founder Commands
High-level orchestration and project management commands.

#### `founder:servers:*`
- `founder:servers:start` - Start backend + frontend
- `founder:servers:stop` - Stop all services
- `founder:servers:restart` - Restart all services
- `founder:servers:status` - Service status check

#### `founder:worktrees:*`
- `founder:worktrees:create` - Create new worktree
- `founder:worktrees:switch` - Switch between worktrees
- `founder:worktrees:prune` - Clean up merged worktrees
- `founder:worktrees:status` - Show worktree info

#### `founder:testing:*`
- `founder:testing:smoke` - Run all smoke tests
- `founder:testing:backend` - Backend tests only
- `founder:testing:frontend` - Frontend tests only

#### `founder:rules:*`
- `founder:rules:check` - Validate all founder rules
- `founder:rules:sync` - Sync latest rules from main

#### `founder:workflows:*`
- `founder:workflows:regen-client` - Regenerate frontend client
- `founder:workflows:db-reset` - Reset database
- `founder:workflows:release` - Create release tag

#### `founder:jira:*`
- `founder:jira:new-bug` - Create bug report
- `founder:jira:new-feature` - Create feature request
- `founder:jira:status-report` - Generate status report
- `founder:jira:link-worktree` - Link worktree to issue

### `backend:*` - Backend Commands
Backend-specific development tasks.

- `backend:dev` - Start backend dev server
- `backend:logs` - View backend logs
- `backend:health` - Check backend health
- `backend:db:migrate` - Run database migrations
- `backend:db:reset` - Reset database
- `backend:db:shell` - Open database shell

### `frontend:*` - Frontend Commands
Frontend-specific development tasks.

- `frontend:dev` - Start frontend dev server
- `frontend:build` - Build for production
- `frontend:typecheck` - Run TypeScript checks
- `frontend:lint` - Run linter

### `ops:*` - Operations Commands
Port management, environment, and infrastructure.

#### `ops:ports:*`
- `ops:ports:reserve` - Reserve ports for worktree
- `ops:ports:release` - Release port reservations
- `ops:ports:show` - Show current port assignments
- `ops:ports:validate` - Validate port configuration

#### `ops:env:*`
- `ops:env:print` - Print all environment variables
- `ops:env:switch` - Switch environment mode

### `qa:*` - Quality Assurance Commands
Testing and quality checks.

#### `qa:smoke:*`
- `qa:smoke:backend` - Backend smoke tests
- `qa:smoke:frontend` - Frontend smoke tests

#### `qa:appium:*`
- `qa:appium:start` - Start Appium server
- `qa:appium:stop` - Stop Appium server

---

## Architecture

### Taskfile Structure

```
.cursor/
├── Taskfile.yml                 # Root orchestrator
└── commands/
    ├── Taskfile.yml             # Includes all sub-domains
    ├── shared/
    │   └── Taskfile.yml         # Shared utilities
    ├── founder/
    │   └── Taskfile.yml         # Founder commands
    ├── backend/
    │   └── Taskfile.yml         # Backend tasks
    ├── frontend/
    │   └── Taskfile.yml         # Frontend tasks
    ├── ops/
    │   └── Taskfile.yml         # Operations tasks
    └── qa/
        └── Taskfile.yml         # QA tasks
```

### Integration Points

**All four automation systems call the same tasks:**

```
┌─────────────┐
│   HUSKY     │  Git Hooks → task founder:rules:check
└──────┬──────┘
       │
┌──────▼──────┐
│   CURSOR    │  Commands → task <namespace>:<command>
└──────┬──────┘
       │
┌──────▼──────┐
│   GITHUB    │  Actions → task qa:smoke:*
└──────┬──────┘
       │
┌──────▼──────┐
│   CLAUDE    │  Skills → task founder:servers:start
└──────┬──────┘
       │
┌──────▼──────┐
│  TASKFILE   │  Central orchestrator
└──────┬──────┘
       │
┌──────▼──────┐
│ automation/ │  Shared library
└─────────────┘
```

---

## Usage Examples

### Basic Command Execution
```bash
# Show all available tasks
task --list

# Run a specific task
task founder:servers:start

# Run with verbose output
task --verbose founder:rules:check

# See what a task would do (dry run)
task --dry founder:servers:start
```

### Environment Variables
Tasks automatically resolve environment variables:
```bash
# These are set by Taskfile from automation/scripts/env.mjs
echo $BACKEND_PORT    # e.g., 4100
echo $FRONTEND_PORT   # e.g., 5273
echo $WORKTREE_NAME   # e.g., jcCtc
```

### Chaining Tasks
```bash
# Run multiple tasks in sequence
task shared:preflight founder:servers:start

# Or in parallel (if independent)
task qa:smoke:backend & task qa:smoke:frontend & wait
```

### In Cursor Chat
You can still use `@` mentions:
```
@start         # Calls legacy script (backward compatible)
@stop          # Calls legacy script (backward compatible)

# Or use task commands:
Run: task founder:servers:start
Run: task qa:smoke:backend
```

---

## Migration from Shell Scripts

### Phase 1: Foundation (COMPLETE)
- ✅ Created `automation/` shared library
- ✅ Extracted worktree detection logic
- ✅ Extracted founder rules checker
- ✅ Extracted environment resolver

### Phase 2: Taskfile Setup (IN PROGRESS)
- 🚧 Installing Taskfile
- 🚧 Creating root Taskfile.yml
- 🚧 Creating domain Taskfiles

### Phase 3: Command Migration (PENDING)
Old shell scripts are still available for backward compatibility:
```bash
.cursor/commands/start                    # OLD
task founder:servers:start                # NEW

.cursor/commands/verify-worktree-isolation # OLD
task shared:preflight                     # NEW
```

Both work during migration period.

---

## Creating New Commands

### 1. Add to Appropriate Taskfile

```yaml
# .cursor/commands/founder/Taskfile.yml
version: '3'

tasks:
  my-new-command:
    desc: "Description of what this does"
    deps:
      - task: shared:preflight  # Optional: run prerequisite tasks
    cmds:
      - echo "Doing the thing..."
      - node ../../../automation/scripts/my-script.mjs
    silent: false
```

### 2. Test the Task
```bash
task founder:my-new-command
```

### 3. Document in This README
Add entry to appropriate namespace section above.

---

## Troubleshooting

### "task: command not found"
Install Taskfile:
```bash
# macOS
brew install go-task

# Or via install script
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

### "Task not found"
Make sure you're in the repository root:
```bash
cd /path/to/ScreenGraph
task --list
```

### "Permission denied" errors
Make scripts executable:
```bash
chmod +x automation/scripts/*.mjs
chmod +x .cursor/commands/shared/preflight.sh
```

### Tasks not seeing latest changes
Taskfile caches some results. Force refresh:
```bash
task --force founder:rules:check
```

---

## Best Practices

### 1. Use Descriptive Task Names
```yaml
# ✅ Good
task: frontend:typecheck:strict

# ❌ Bad  
task: frontend:check
```

### 2. Add Dependencies
```yaml
tasks:
  deploy:
    desc: "Deploy to production"
    deps:
      - task: founder:rules:check
      - task: qa:smoke:backend
      - task: qa:smoke:frontend
    cmds:
      - ./scripts/deploy.sh
```

### 3. Provide Clear Descriptions
```yaml
tasks:
  db-reset:
    desc: "Reset database (⚠️  DESTRUCTIVE - requires confirmation)"
    prompt: "This will delete all data. Continue?"
    cmds:
      - encore db reset
```

### 4. Use Variables
```yaml
tasks:
  start-backend:
    desc: "Start backend on configured port"
    vars:
      PORT:
        sh: node automation/scripts/env.mjs backend-port
    cmds:
      - echo "Starting backend on port {{.PORT}}"
      - cd backend && encore run --port {{.PORT}}
```

---

## Related Documentation

- `automation/README.md` - Shared automation library docs
- `.cursor/rules/founder_rules.mdc` - Founder rules enforced by tasks
- `.husky/README.md` - Git hooks integration
- `.claude-skills/README.md` - Claude Skills integration
- `FR-013-main.md` - Feature implementation plan

---

**Last Updated:** 2025-11-07  
**Status:** Phase 2 - Taskfile Setup  
**Maintainer:** Founder

