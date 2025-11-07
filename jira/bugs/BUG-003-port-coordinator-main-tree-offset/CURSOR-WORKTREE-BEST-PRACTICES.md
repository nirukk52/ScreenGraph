# How to Actually Use Cursor's Worktree Feature

**TL;DR**: Cursor worktrees let multiple AI agents work on different features simultaneously. But your services should be SHARED, not isolated per-worktree.

---

## 🤔 What Cursor Worktrees Are For

### The Intended Use Case

**Scenario**: You want to build 3 features in parallel using 3 AI agents:
- Agent 1 (worktree `feature-auth`): Build authentication system
- Agent 2 (worktree `feature-graph`): Build graph visualization
- Agent 3 (worktree `feature-export`): Build export functionality

Each agent:
- ✅ Works in its own git worktree (separate branch/checkout)
- ✅ Has its own Cursor window/chat context
- ✅ Makes its own code changes independently
- ✅ Can commit to its own branch

**Key Insight**: Worktrees are for CODE ISOLATION, not RUNTIME ISOLATION.

---

## ❌ What We Did Wrong (Probably)

### Our Current Approach: Full Runtime Isolation

```
Worktree Px8w6:
  - Git checkout: feature-px8w6
  - Backend: localhost:4008
  - Frontend: localhost:5181
  - Database: Separate instance
  - Complete isolation ✓ ... but overkill ✗
```

**Problem**: This is HEAVY. Each worktree runs its own:
- Backend server (different port)
- Frontend server (different port)  
- Database instance
- Entire runtime environment

**When you'd want this**: 
- Testing conflicting changes to backend API
- Running integration tests on different branches simultaneously
- Comparing behavior across branches side-by-side

**Reality**: You probably just want AI agents editing code in parallel, not running separate servers.

---

## ✅ What You Should Probably Do Instead

### Lightweight Worktree Usage (Cursor's Intent)

```
Main Development Environment:
  Backend:  localhost:4000 (ONE instance)
  Frontend: localhost:5173 (ONE instance)
  Database: Shared

Worktree 1 (feature-auth):
  - Just code editing
  - Commits to feature-auth branch
  - Agent 1 working here

Worktree 2 (feature-graph):
  - Just code editing  
  - Commits to feature-graph branch
  - Agent 2 working here

Worktree 3 (feature-export):
  - Just code editing
  - Commits to feature-export branch
  - Agent 3 working here
```

**How it works**:
1. Start backend ONCE on main tree: `cd backend && encore run`
2. Start frontend ONCE on main tree: `cd frontend && bun run dev`
3. Create worktrees for EACH feature: `git worktree add ../feature-auth feature-auth`
4. Open EACH worktree in SEPARATE Cursor window
5. Each AI agent edits code in its worktree
6. When you want to TEST a feature: switch main tree to that branch, restart services

**Benefits**:
- ✅ Lightweight (agents edit code, don't run servers)
- ✅ Fast (no per-worktree overhead)
- ✅ Simple (one set of services)
- ✅ Agents still work in parallel (on different code)

**Trade-off**:
- ❌ Can only RUN/TEST one feature at a time (need to switch branch)
- ✅ But that's probably fine (how often do you need 3 features running simultaneously?)

---

## 🎯 The Cursor Worktree Mental Model

### Think of it like Google Docs with multiple cursors

**Git Worktrees + Cursor = Multiple AI Agents Editing Different Files**

```
Main Repo:
  backend/
    agent/     ← Agent 1 working here (worktree 1)
    graph/     ← Agent 2 working here (worktree 2)  
    artifacts/ ← Agent 3 working here (worktree 3)
  
  ONE backend server running (testing whichever branch is active)
```

**Not**: "Run 3 complete environments in parallel"  
**But**: "Have 3 AI agents editing code in parallel, test one at a time"

---

## 🏗️ Practical Workflow Examples

### Scenario A: Parallel Feature Development (Lightweight)

**Goal**: Build auth, graph, and export features in parallel

**Setup (Once)**:
```bash
# Main tree - run services here
cd ~/ScreenGraph
encore run &                    # Backend on 4000
cd frontend && bun run dev &    # Frontend on 5173

# Create worktrees for features (code only)
git worktree add ../feature-auth -b feature-auth
git worktree add ../feature-graph -b feature-graph
git worktree add ../feature-export -b feature-export
```

**Usage**:
```bash
# Terminal 1: Open worktree 1 in Cursor
cursor ../feature-auth
# Agent 1: "Build authentication system"
# Agent edits code, commits to feature-auth branch

# Terminal 2: Open worktree 2 in Cursor
cursor ../feature-graph  
# Agent 2: "Build graph visualization"
# Agent edits code, commits to feature-graph branch

# Terminal 3: Open worktree 3 in Cursor
cursor ../feature-export
# Agent 3: "Build export functionality"
# Agent edits code, commits to feature-export branch
```

**Testing a feature**:
```bash
# Want to test auth feature?
cd ~/ScreenGraph  # Main tree
git checkout feature-auth
# Services auto-reload (Encore + Vite HMR)
# Test in browser: http://localhost:5173

# Want to test graph feature?
git checkout feature-graph
# Services reload with new code
# Test in browser
```

**Benefits**: 
- 3 agents editing in parallel ✓
- Only 1 backend + frontend running ✓
- Simple, fast, lightweight ✓

---

### Scenario B: Runtime Isolation (Heavy - Rare Use)

**Goal**: Run auth AND graph features simultaneously to compare behavior

**When you'd need this**:
- Debugging regression (compare old vs new side-by-side)
- Integration testing across branches
- Demoing multiple versions to stakeholders

**Setup** (What we built):
```bash
# Worktree 1
cd feature-auth
./scripts/dev-backend.sh   # Port 4001
./scripts/dev-frontend.sh  # Port 5174

# Worktree 2  
cd feature-graph
./scripts/dev-backend.sh   # Port 4002
./scripts/dev-frontend.sh  # Port 5175

# Now both running simultaneously:
# Auth feature: http://localhost:5174
# Graph feature: http://localhost:5175
```

**Cost**:
- 2x backend processes
- 2x frontend processes
- 2x database connections
- Complex port management
- Higher CPU/memory usage

**Reality**: You probably need this <5% of the time.

---

## 🎯 Best Practice Recommendation

### For 95% of Use Cases: Lightweight Workflow

**What to do**:
1. **Run services on main tree ONLY** (ports 4000/5173)
2. **Create worktrees for code editing** (no services)
3. **AI agents edit in parallel** (separate Cursor windows)
4. **Test features one at a time** (switch branch on main tree)

**Port Coordination**: Not needed (everything uses default ports)

**Frontend Backend Discovery**: Simple
```typescript
// frontend/src/lib/getEncoreClient.ts
export function getBackendUrl() {
  return 'http://localhost:4000'; // Always
}
```

---

### For 5% of Use Cases: Full Runtime Isolation

**When you need it**:
- Side-by-side testing of different branches
- Integration tests on multiple branches
- Comparing behavior across versions

**What to do**:
1. Fix the port isolation bug (3 hours)
2. Use `./scripts/dev-backend.sh` and `./scripts/dev-frontend.sh`
3. Each worktree gets unique ports
4. Accept the complexity trade-off

---

## 💡 The Cursor Docs Perspective

Looking at how Cursor likely INTENDS worktrees to be used:

### Cursor's Workflow Vision

```
1. You have a complex task: "Build user authentication"

2. Break it into subtasks:
   - Subtask A: Backend auth API
   - Subtask B: Frontend login UI  
   - Subtask C: Database schema

3. Create worktrees for parallel work:
   git worktree add ../auth-backend -b auth-backend
   git worktree add ../auth-frontend -b auth-frontend
   git worktree add ../auth-db -b auth-db

4. Open each in Cursor:
   cursor ../auth-backend   # Agent 1
   cursor ../auth-frontend  # Agent 2  
   cursor ../auth-db        # Agent 3

5. Agents work in parallel (editing code)

6. Merge branches when done
```

**Key**: Agents edit code in parallel, but share runtime environment.

---

## 🔧 Recommended Setup for ScreenGraph

### Option 1: Simplified (Recommended)

**Remove**:
- Port coordinator
- Per-worktree service scripts
- Runtime isolation

**Keep**:
- Git worktrees for code editing
- Single shared backend/frontend on default ports

**Workflow**:
```bash
# Start services ONCE (main tree)
cd backend && encore run
cd frontend && bun run dev

# Create worktrees for features
git worktree add ../feature-xyz -b feature-xyz

# Open in Cursor
cursor ../feature-xyz

# AI agent edits code, commits

# Test: switch main tree to that branch
cd ~/ScreenGraph
git checkout feature-xyz
# Services auto-reload, test in browser
```

---

### Option 2: Keep Runtime Isolation (If Needed)

**Fix the bug**:
- Update `frontend/src/lib/getEncoreClient.ts`
- Use `VITE_BACKEND_BASE_URL` properly
- Add port validation

**Use when**:
- Actually running multiple features simultaneously
- Side-by-side testing
- Integration testing across branches

**Accept**:
- 3 hours to fix
- Ongoing complexity
- Higher resource usage

---

## 📊 Decision Matrix

| Use Case | Lightweight | Runtime Isolation |
|----------|-------------|-------------------|
| Parallel code editing | ✅ Perfect | ⚠️ Overkill |
| AI agents on different features | ✅ Perfect | ⚠️ Overkill |
| Test one feature at a time | ✅ Perfect | ⚠️ Overkill |
| Side-by-side testing | ❌ Can't do | ✅ Needed |
| Compare branches | ❌ Can't do | ✅ Needed |
| Integration tests across branches | ❌ Can't do | ✅ Needed |
| Resource usage | ✅ Low | ❌ High |
| Complexity | ✅ Low | ❌ High |
| Setup time | ✅ 5 min | ⚠️ 30 min + fixes |

---

## ✅ My Recommendation

### For ScreenGraph Specifically

**Current State**: You built full runtime isolation but haven't needed it enough to test it.

**Suggested Path**: 

1. **Simplify to lightweight worktrees** (1 hour)
   - Remove port coordination
   - Single backend/frontend on default ports
   - Worktrees for code editing only

2. **Use Cursor worktrees as intended**
   - Multiple AI agents edit code in parallel
   - Test features sequentially (switch branches)
   - Simple, fast, works

3. **Re-add runtime isolation later IF needed**
   - You'll know you need it (can't test X without it)
   - By then you'll have real requirements
   - Fix will be justified by actual usage

---

## 🎯 Bottom Line

**Cursor Worktrees**: Multi-cursor editing for AI agents (CODE isolation)  
**Not**: Multi-environment orchestration (RUNTIME isolation)

**Best Practice**: 
- ✅ Use worktrees for parallel code editing
- ✅ Share services (one backend, one frontend)
- ✅ Test features sequentially (switch branches)
- ❌ Don't over-engineer runtime isolation until you need it

**The Test**: Can you accomplish your goals with lightweight worktrees? Probably yes.

---

## 📚 Further Reading

**Cursor Documentation**: Check for official worktree guidance (likely assumes shared runtime)  
**Git Worktrees**: Designed for parallel checkouts, not parallel runtimes  
**Multi-Agent Development**: Code editing parallelism ≠ runtime parallelism

**Your Next Step**: Try lightweight worktrees for 1 week. If you miss runtime isolation, you'll know it's worth fixing.

