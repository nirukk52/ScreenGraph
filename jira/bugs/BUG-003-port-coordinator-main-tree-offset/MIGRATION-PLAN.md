# Migration Plan: Hybrid Worktree Model

**Goal**: Main tree = runtime environment (default ports), Worktrees = code editing only  
**Approach**: Incremental, low-risk, minimal damage to current setup  
**Time**: 2-3 hours total

---

## 🎯 Target Architecture

### Main Tree ("ScreenGraph")
- **Purpose**: Runtime environment for testing
- **Ports**: Default (4000, 5173, 9400, 4723)
- **Services**: Backend + Frontend running
- **Code Changes**: Read-only (guarded against commits)
- **Use**: Testing, running, debugging

### Worktrees (feature-xyz)
- **Purpose**: Code development only
- **Ports**: None (no services running)
- **Services**: Not started
- **Code Changes**: Yes (commit to feature branches)
- **Use**: AI agent development, code editing

---

## 📋 Migration Steps (Incremental)

### Phase 1: Add Guards to Main Tree (30 min)

**Goal**: Prevent accidental commits to main tree

**Step 1.1: Create Pre-Commit Hook** (15 min)

```bash
# File: .git/hooks/pre-commit
#!/bin/bash

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))
BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$WORKTREE_NAME" = "ScreenGraph" ]; then
    echo "🚫 ERROR: Cannot commit on main tree"
    echo ""
    echo "Main tree is for RUNNING services, not development."
    echo ""
    echo "To make changes:"
    echo "  1. Create a worktree: git worktree add ../feature-xyz -b feature-xyz"
    echo "  2. Open in Cursor: cursor ../feature-xyz"
    echo "  3. Make changes and commit there"
    echo ""
    echo "To bypass this check (emergencies only):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

echo "✅ Committing on worktree: $WORKTREE_NAME (branch: $BRANCH)"
exit 0
```

```bash
# Make it executable
chmod +x .git/hooks/pre-commit
```

**Step 1.2: Add Cursor Notification** (15 min)

```bash
# File: .cursor/main-tree-reminder.sh
#!/bin/bash

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))

if [ "$WORKTREE_NAME" = "ScreenGraph" ]; then
    cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║                    📍 MAIN TREE MODE                       ║
╟────────────────────────────────────────────────────────────╢
║  This is the RUNTIME ENVIRONMENT                           ║
║                                                             ║
║  ✅ DO:  Run services, test, debug                         ║
║  ❌ DON'T: Make code changes or commit here                ║
║                                                             ║
║  To develop features:                                      ║
║  $ git worktree add ../feature-xyz -b feature-xyz          ║
║  $ cursor ../feature-xyz                                   ║
╚════════════════════════════════════════════════════════════╝

EOF
fi
```

Add to `.cursor/commands/startup`:
```bash
#!/bin/bash
.cursor/main-tree-reminder.sh
```

---

### Phase 2: Simplify Main Tree Services (45 min)

**Goal**: Main tree always uses default ports (no coordination)

**Step 2.1: Update Frontend to Prefer Default** (20 min)

```typescript
// File: frontend/src/lib/getEncoreClient.ts

/**
 * Get the backend URL for API calls.
 * 
 * Rules:
 * 1. Main tree (runtime env): Always use http://localhost:4000
 * 2. Worktrees: Don't run services (code editing only)
 * 3. Override: VITE_BACKEND_BASE_URL env var (for special cases)
 */
export function getBackendUrl(): string {
  // Check for explicit override (testing, special cases)
  const override = import.meta.env.VITE_BACKEND_BASE_URL;
  if (override) {
    console.log(`[Frontend] Using override backend: ${override}`);
    return override;
  }

  // Default: main tree runtime environment
  const defaultUrl = 'http://localhost:4000';
  console.log(`[Frontend] Using default backend: ${defaultUrl}`);
  return defaultUrl;
}

// Export the client
export const client = getBackendUrl();
```

**Step 2.2: Create Simple Start Scripts** (15 min)

```bash
# File: scripts/start-backend.sh
#!/bin/bash
set -e

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))

if [ "$WORKTREE_NAME" != "ScreenGraph" ]; then
    echo "⚠️  WARNING: You're trying to start backend on a worktree"
    echo ""
    echo "Worktrees are for CODE EDITING only."
    echo "Run services on the main tree instead:"
    echo ""
    echo "  cd ~/ScreenGraph/Code/ScreenGraph"
    echo "  ./scripts/start-backend.sh"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Starting backend on port 4000..."
cd backend
encore run
```

```bash
# File: scripts/start-frontend.sh
#!/bin/bash
set -e

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))

if [ "$WORKTREE_NAME" != "ScreenGraph" ]; then
    echo "⚠️  WARNING: You're trying to start frontend on a worktree"
    echo ""
    echo "Worktrees are for CODE EDITING only."
    echo "Run services on the main tree instead:"
    echo ""
    echo "  cd ~/ScreenGraph/Code/ScreenGraph"
    echo "  ./scripts/start-frontend.sh"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🚀 Starting frontend on port 5173..."
cd frontend
bun run dev
```

```bash
chmod +x scripts/start-backend.sh scripts/start-frontend.sh
```

**Step 2.3: Update CLAUDE.md** (10 min)

```markdown
## Quick Start (Main Tree Only)

### Starting Services
```bash
# Terminal 1: Backend
./scripts/start-backend.sh    # Port 4000

# Terminal 2: Frontend  
./scripts/start-frontend.sh   # Port 5173
```

### Development Workflow

**Main Tree** (ScreenGraph):
- Purpose: Runtime environment
- Run services here
- Test features here
- Switch branches to test different features
- ❌ Don't commit code changes here

**Worktrees** (feature branches):
- Purpose: Code editing
- Create: `git worktree add ../feature-xyz -b feature-xyz`
- Open: `cursor ../feature-xyz`
- Make code changes and commit
- ❌ Don't run services here

### Testing a Feature
```bash
# 1. Develop in worktree
cd ~/ScreenGraph-worktrees/feature-xyz
# Make changes, commit

# 2. Test in main tree
cd ~/ScreenGraph/Code/ScreenGraph
git checkout feature-xyz
# Services auto-reload
# Test at http://localhost:5173
```
```

---

### Phase 3: Deprecate Port Coordination (30 min)

**Goal**: Keep port-coordinator.mjs for backward compatibility but don't rely on it

**Step 3.1: Mark as Deprecated** (10 min)

```javascript
// File: scripts/port-coordinator.mjs

console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.warn('⚠️  DEPRECATED: Port coordination is deprecated');
console.warn('');
console.warn('New workflow:');
console.warn('  - Main tree: Use default ports (4000, 5173)');
console.warn('  - Worktrees: Code editing only (no services)');
console.warn('');
console.warn('This script will be removed in a future update.');
console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.warn('');

// ... rest of existing code
```

**Step 3.2: Keep Old Scripts But Warn** (10 min)

```bash
# File: scripts/dev-backend.sh
#!/bin/bash

echo "⚠️  DEPRECATED: Use ./scripts/start-backend.sh instead"
echo ""
echo "This script uses port coordination which is being phased out."
echo "New workflow: Run services on main tree only (default ports)."
echo ""
sleep 3

# Continue with existing logic for backward compatibility
# ... existing code
```

**Step 3.3: Update Founder Rules** (10 min)

Add to `.cursor/rules/founder_rules.mdc`:

```markdown
## Port Management (Updated 2025-11-07)

### Main Tree (Runtime Environment)
- **Purpose**: Run services for testing
- **Backend**: http://localhost:4000 (fixed)
- **Frontend**: http://localhost:5173 (fixed)
- **Dashboard**: http://localhost:9400 (fixed)
- **Appium**: http://localhost:4723 (fixed)

### Worktrees (Development Only)
- **Purpose**: Code editing only
- **Services**: Don't run services on worktrees
- **Ports**: N/A (no services)
- **Testing**: Switch main tree to feature branch

### Guards
- Pre-commit hook prevents commits on main tree
- Start scripts warn if running services on worktree
- Frontend defaults to localhost:4000 (main tree)
```

---

### Phase 4: Clean Up Existing Worktrees (15 min)

**Goal**: Stop services on existing worktrees, keep code

**Step 4.1: Stop Services on All Worktrees**

```bash
# Find and stop all encore processes
pkill -f "encore run"

# Find and stop all vite processes on non-standard ports
lsof -ti:5174,5175,5176,5177,5178,5179,5180,5181 | xargs kill -9 2>/dev/null || true

# Find and stop all encore processes on non-standard ports
lsof -ti:4001,4002,4003,4004,4005,4006,4007,4008 | xargs kill -9 2>/dev/null || true
```

**Step 4.2: Document Existing Worktrees**

```bash
# File: .cursor/worktree-status.sh
#!/bin/bash

echo "📍 Worktree Status"
echo ""

git worktree list | while read -r line; do
    path=$(echo "$line" | awk '{print $1}')
    branch=$(echo "$line" | awk '{print $2}' | tr -d '[]')
    
    if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
        echo "🏠 MAIN TREE: $path"
        echo "   Purpose: Runtime environment"
        echo "   Services: Should be running here"
        echo ""
    else
        cd "$path"
        changes=$(git status --porcelain | wc -l)
        last_commit=$(git log -1 --format="%ar" 2>/dev/null || echo "no commits")
        
        echo "🔧 WORKTREE: $path"
        echo "   Branch: $branch"
        echo "   Changes: $changes uncommitted files"
        echo "   Last commit: $last_commit"
        echo "   Purpose: Code editing only (no services)"
        echo ""
    fi
done
```

---

### Phase 5: Add Convenience Commands (30 min)

**Goal**: Make the new workflow easy to use

**Step 5.1: Create Worktree Helper**

```bash
# File: scripts/create-worktree.sh
#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/create-worktree.sh <feature-name>"
    echo ""
    echo "Example: ./scripts/create-worktree.sh auth-system"
    echo ""
    echo "This will:"
    echo "  1. Create worktree at ../feature-<name>"
    echo "  2. Create branch feature/<name>"
    echo "  3. Open in new Cursor window"
    exit 1
fi

FEATURE_NAME=$1
WORKTREE_NAME="feature-${FEATURE_NAME}"
BRANCH_NAME="feature/${FEATURE_NAME}"
WORKTREE_PATH="../${WORKTREE_NAME}"

echo "🌳 Creating worktree for: $FEATURE_NAME"
echo ""
echo "  Worktree: $WORKTREE_PATH"
echo "  Branch: $BRANCH_NAME"
echo ""

# Create worktree
git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

echo ""
echo "✅ Worktree created!"
echo ""
echo "Next steps:"
echo "  1. Open in Cursor: cursor $WORKTREE_PATH"
echo "  2. Make code changes (commit freely)"
echo "  3. Test: Switch main tree to $BRANCH_NAME"
echo ""
echo "Remember: This worktree is for CODE EDITING only."
echo "Run services on the main tree (ScreenGraph)."
echo ""

# Optionally open in Cursor
read -p "Open in Cursor now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cursor "$WORKTREE_PATH"
fi
```

**Step 5.2: Create Test Helper**

```bash
# File: scripts/test-feature.sh
#!/bin/bash
set -e

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))

if [ "$WORKTREE_NAME" != "ScreenGraph" ]; then
    echo "❌ ERROR: This script must run on main tree"
    echo ""
    echo "Current location: $WORKTREE_NAME (worktree)"
    echo "Required location: ScreenGraph (main tree)"
    echo ""
    echo "Navigate to main tree:"
    echo "  cd ~/ScreenGraph/Code/ScreenGraph"
    echo "  ./scripts/test-feature.sh <branch-name>"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: ./scripts/test-feature.sh <branch-name>"
    echo ""
    echo "Example: ./scripts/test-feature.sh feature/auth-system"
    echo ""
    echo "This will:"
    echo "  1. Switch to the feature branch"
    echo "  2. Restart services (auto-reload)"
    echo "  3. Open browser to test"
    exit 1
fi

BRANCH=$1

echo "🧪 Testing feature: $BRANCH"
echo ""

# Switch branch
git checkout "$BRANCH"

echo ""
echo "✅ Switched to $BRANCH"
echo ""
echo "Services will auto-reload. Test at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend: http://localhost:4000"
echo ""
```

**Step 5.3: Create Status Command**

```bash
# File: scripts/dev-status.sh
#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Development Environment Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Current location
WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "📍 Current Location: $WORKTREE_NAME"
echo "🌿 Current Branch: $BRANCH"
echo ""

# Check if main tree
if [ "$WORKTREE_NAME" = "ScreenGraph" ]; then
    echo "🏠 Mode: RUNTIME ENVIRONMENT (Main Tree)"
    echo "   ✅ Run services here"
    echo "   ❌ Don't commit code here"
else
    echo "🔧 Mode: DEVELOPMENT (Worktree)"
    echo "   ✅ Edit code and commit here"
    echo "   ❌ Don't run services here"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Services Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check backend
if lsof -ti:4000 > /dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:4000)
    echo "✅ Backend: Running (PID $BACKEND_PID, port 4000)"
else
    echo "❌ Backend: Not running"
    echo "   Start: ./scripts/start-backend.sh"
fi

# Check frontend
if lsof -ti:5173 > /dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:5173)
    echo "✅ Frontend: Running (PID $FRONTEND_PID, port 5173)"
else
    echo "❌ Frontend: Not running"
    echo "   Start: ./scripts/start-frontend.sh"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌳 Worktrees"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

git worktree list

echo ""
```

```bash
chmod +x scripts/*.sh
```

---

## 🚀 Migration Execution Plan

### Day 1: Add Guards (1 hour)

```bash
# Phase 1: Guards
1. Create pre-commit hook
2. Test: Try to commit on main tree (should fail)
3. Create startup reminder
4. Test: Open main tree in Cursor (should show warning)
```

**Validation**: Commits blocked on main tree ✓

---

### Day 1: Simplify Services (1 hour)

```bash
# Phase 2: Services
1. Update frontend/src/lib/getEncoreClient.ts
2. Create start-backend.sh and start-frontend.sh
3. Test: Start services on main tree
4. Verify: Frontend connects to http://localhost:4000
```

**Validation**: Services run on default ports ✓

---

### Day 2: Clean Up (30 min)

```bash
# Phase 3 & 4: Deprecation & Cleanup
1. Add deprecation warnings to old scripts
2. Stop all services on worktrees
3. Update documentation
4. Run dev-status.sh to verify state
```

**Validation**: Only main tree runs services ✓

---

### Day 2: Add Convenience (30 min)

```bash
# Phase 5: Helpers
1. Create create-worktree.sh
2. Create test-feature.sh
3. Create dev-status.sh
4. Test workflow end-to-end
```

**Validation**: New workflow is smooth ✓

---

## 📊 Before vs After

### Before (Current State)

```
Main Tree (ScreenGraph):
  - Backend: Port 4007 (hash-based offset)
  - Frontend: Port 5180 (hash-based offset)
  - Purpose: Unclear (runtime? development?)
  - Commits: Allowed

Worktree (Px8w6):
  - Backend: Port 4008
  - Frontend: Port 5181
  - Purpose: Development + Runtime
  - Frontend connects to: Port 4002 (BUG!)
```

**Problems**:
- Port coordination complex
- Frontend connects to wrong backend
- No clear separation of concerns
- Commits anywhere

---

### After (Target State)

```
Main Tree (ScreenGraph):
  - Backend: Port 4000 (default)
  - Frontend: Port 5173 (default)
  - Purpose: Runtime environment (testing)
  - Commits: Blocked (pre-commit hook)

Worktree (feature-xyz):
  - Backend: Not running
  - Frontend: Not running
  - Purpose: Code editing only
  - Commits: Encouraged
```

**Benefits**:
- ✅ Simple (default ports)
- ✅ No port coordination
- ✅ Clear separation
- ✅ Guards prevent mistakes
- ✅ Frontend always connects correctly

---

## ✅ Success Criteria

After migration:

- [ ] Main tree blocked from commits (pre-commit hook works)
- [ ] Services run on default ports (4000, 5173)
- [ ] Frontend connects to correct backend
- [ ] Start scripts warn if used on worktrees
- [ ] `dev-status.sh` shows clear status
- [ ] Can create worktree with `create-worktree.sh`
- [ ] Can test feature with `test-feature.sh`
- [ ] Documentation updated

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# Remove pre-commit hook
rm .git/hooks/pre-commit

# Restore old scripts
git checkout scripts/dev-backend.sh
git checkout scripts/dev-frontend.sh

# Restore frontend
git checkout frontend/src/lib/getEncoreClient.ts

# Start services the old way
./scripts/dev-backend.sh
./scripts/dev-frontend.sh
```

**Risk**: Low (changes are mostly additive)

---

## 📝 Checklist

### Prerequisites
- [ ] Commit all current changes
- [ ] Stop all running services
- [ ] Backup `~/.screengraph/ports.json`

### Phase 1: Guards
- [ ] Create pre-commit hook
- [ ] Test commit blocking
- [ ] Create startup reminder
- [ ] Test in Cursor

### Phase 2: Services  
- [ ] Update getEncoreClient.ts
- [ ] Create start scripts
- [ ] Test services start
- [ ] Verify frontend connection

### Phase 3: Deprecation
- [ ] Add warnings to old scripts
- [ ] Update CLAUDE.md
- [ ] Update founder rules

### Phase 4: Cleanup
- [ ] Stop worktree services
- [ ] Document worktree status
- [ ] Verify main tree only

### Phase 5: Helpers
- [ ] Create create-worktree.sh
- [ ] Create test-feature.sh
- [ ] Create dev-status.sh
- [ ] Test end-to-end workflow

### Validation
- [ ] Run `@test-default-run` (should pass)
- [ ] Create test worktree
- [ ] Try to commit on main (should block)
- [ ] Test feature switching

---

## 🎯 Timeline

**Total Time**: 3 hours  
**Risk Level**: Low  
**Reversibility**: High  

**Recommended Schedule**:
- Day 1 AM: Phases 1-2 (guards + services)
- Day 1 PM: Test and validate
- Day 2 AM: Phases 3-5 (cleanup + helpers)
- Day 2 PM: Documentation and final testing

---

## 💡 Key Principles

1. **Additive Changes**: Don't delete old code immediately
2. **Guards Not Blocks**: Warn but allow overrides (--no-verify)
3. **Clear Messaging**: Every error/warning explains the fix
4. **Backwards Compatible**: Old scripts still work (with warnings)
5. **Incremental**: Each phase independently valuable

---

**Ready to start? Begin with Phase 1 (guards) - lowest risk, immediate value.**

