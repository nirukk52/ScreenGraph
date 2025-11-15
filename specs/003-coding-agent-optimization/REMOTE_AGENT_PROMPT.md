# Remote Agent Handoff Prompt

**Purpose**: Single comprehensive prompt to hand off spec implementation to remote coding agents (Claude Web, Cursor Web, etc.)

**Usage**: Copy the template below, fill in placeholders, paste to remote agent.

---

## 📋 Template (Copy & Customize)

```markdown
# Implement Spec-[NUMBER]: [TITLE]

You are implementing a spec for **ScreenGraph**, a UX testing automation platform. This is a complete handoff with full context.

---

## 📁 Project Context

**Stack:**
- **Backend**: Encore.ts (TypeScript backend framework) - Services, PubSub, Database (PostgreSQL)
- **Frontend**: SvelteKit 2 + Svelte 5 (runes: $state, $derived, $effect) + Tailwind CSS v4
- **Testing**: Playwright (E2E), Vitest (unit tests), Encore test (backend integration)
- **Mobile**: Appium (Android/iOS automation)

**Repository**: /Users/priyankalalge/ScreenGraph/Code/ScreenGraph

**Architecture:**
- Backend and frontend are completely independent (no shared code)
- Backend: `backend/` - Encore services (agent, run, graph, artifacts, appinfo)
- Frontend: `frontend/` - SvelteKit routes + components
- All automation: `.cursor/commands/` - Task commands
- Documentation: `.cursor/rules/*.mdc` - Founder rules (non-negotiable)

---

## 📖 Critical Documentation (Read FIRST)

Before starting, review these files:

1. **Founder Rules** (non-negotiable standards):
   - `.cursor/rules/founder_rules.mdc` - Architecture, naming, type safety, American spelling
   - NO `any` types, NO `console.log`, NO manual fetch (use Encore clients)
   - Functions MUST have descriptive names (not `handle()`, `process()`)

2. **Domain-Specific Rules**:
   - `.cursor/rules/backend_coding_rules.mdc` - Encore.ts patterns
   - `.cursor/rules/frontend_engineer.mdc` - SvelteKit + Svelte 5 standards

3. **Spec Files** (your implementation guide):
   - `specs/[SPEC_NUMBER]/spec.md` - Full specification
   - `specs/[SPEC_NUMBER]/plan.md` - Architecture approach
   - `specs/[SPEC_NUMBER]/tasks.md` - Step-by-step tasks (YOUR CHECKLIST)
   - `specs/[SPEC_NUMBER]/acceptance.md` - Success criteria

4. **3-Command System** (use during implementation):
   - `specs/003-coding-agent-optimization/QUICK_REFERENCE.md` - Cheat sheet
   - `specs/003-coding-agent-optimization/THE_3_COMMANDS.md` - Full guide

---

## 🎯 Your Mission

Implement **ALL tasks** from `specs/[SPEC_NUMBER]/tasks.md` following the workflow below.

**Spec Summary:**
- **Problem**: [Brief description of what we're solving]
- **Solution**: [High-level approach from plan.md]
- **Scope**: [What's in scope, what's not]

---

## ⚡ Implementation Workflow (Follow Exactly)

### Step 0: Load Context (MANDATORY)

Before starting ANY work:

```
@project-context Implement spec-[NUMBER] [title]
```

**This searches past work and provides:**
- Similar past specs and solutions
- Files you'll need to modify
- Known gotchas and workarounds
- Recommended MCP tools to use

**DO NOT SKIP THIS.** It prevents 20+ hours of rework.

---

### Step 1: Create Feature Branch

```bash
git checkout main
git pull
git checkout -b spec-[NUMBER]-[short-description]
```

**Branch naming**: `spec-XXX-description` (e.g., `spec-002-sse-updates`)

---

### Step 2: Implement Each Task from tasks.md

Open `specs/[SPEC_NUMBER]/tasks.md` and work through each task:

```markdown
## For EACH task:

1. Run guidance command:
   @during-task [specific task description from tasks.md]
   
   # Returns:
   # - Which MCP tools to use
   # - Quick 3-step workflow
   # - Vibe recommendation (backend/frontend/qa)

2. Implement the task:
   - Follow founder rules (no any, no console.log, American spelling)
   - Use Encore clients (never manual fetch)
   - Write tests alongside code
   - Follow domain-specific patterns from .cursor/rules/

3. Test immediately:
   # Backend changes:
   cd backend && encore test [test-file]
   
   # Frontend changes:
   cd frontend && bun test [test-file]

4. Verify no regressions:
   cd .cursor && task qa:smoke:all

5. Check founder rules compliance:
   cd .cursor && task founder:rules:check

6. Move to next task.
```

**Call `@during-task` 5-10 times during implementation** (300 tokens each, keeps you aligned).

**Example task flow:**

```bash
# Task 1: Create database table
@during-task Create runs table with status and metadata columns
# Returns: backend_vibe, use encore-mcp
# Implement: backend/db/migrations/XXX_create_runs.up.sql
# Test: encore test

# Task 2: Add API endpoint
@during-task Create POST /run/start endpoint
# Returns: backend_vibe, use encore-mcp + context7
# Implement: backend/run/encore.service.ts
# Test: encore test backend/run/tests/

# Task 3: Frontend integration
@during-task Build run creation form in Svelte
# Returns: frontend_vibe, use svelte + browser
# Implement: frontend/src/routes/runs/new/+page.svelte
# Test: bun test
```

---

### Step 3: Integration Testing

After all tasks complete:

```bash
# Start services
cd .cursor && task founder:servers:start

# Run full smoke tests
task qa:smoke:all

# Backend integration tests (if any)
# Note: Appium auto-starts via EnsureDevice node (Spec-001)
# Only requirement: Device/emulator connected and authorized
task backend:integration:[test-name]

# Frontend E2E tests (if any)
cd frontend && bunx playwright test
```

**All tests must pass before proceeding.**

**Note**: Appium is auto-managed (Spec-001). The agent's `EnsureDevice` node automatically starts Appium if not running. You only need to ensure a device/emulator is connected and authorized.

---

### Step 4: Quality Checks (Pre-Push)

```bash
cd .cursor

# 1. Founder rules compliance
task founder:rules:check

# 2. Type checking
task frontend:typecheck
task backend:typecheck

# 3. Linting
task frontend:lint

# 4. All tests
task qa:smoke:all
task backend:test
task frontend:test
```

**DO NOT commit until ALL checks pass.**

---

### Step 5: Commit & Push

```bash
# Stage changes
git add .

# Commit (descriptive message)
git commit -m "feat(spec-[NUMBER]): [brief description]

- [Key change 1]
- [Key change 2]
- [Key change 3]

Closes #[SPEC_NUMBER]"

# Push
git push origin spec-[NUMBER]-[description]
```

**Note**: Pre-push hook runs automatically (founder rules + smoke tests).

---

### Step 6: Document Learnings (MANDATORY)

After push succeeds:

```
@after-task Completed spec-[NUMBER] [title]
```

**This generates a Graphiti documentation template. You MUST:**

1. Review the template
2. Fill in all bracketed placeholders:
   - Problem statement
   - Solution approach (high-level, not code)
   - Key learnings
   - Gotchas with workarounds
   - ALL files modified
   - Related specs/bugs
3. Execute the `add_memory()` call

**Example template**:

```typescript
add_memory({
  name: "Spec-[NUMBER]: [Title]",
  episode_body: `
    [Tags: [domain], spec, [technologies]]
    
    **Problem**: [What we solved]
    
    **Solution**: [High-level approach]
    
    **Key Learnings**:
    - [Learning 1]
    - [Learning 2]
    
    **Gotchas**:
    - [Gotcha 1 with workaround]
    - [Gotcha 2 with workaround]
    
    **Files Modified**:
    - [Complete list of files]
    
    **Tests Added**:
    - [Test files]
    
    **Related**: Spec-[NUMBER]
    **Date**: [YYYY-MM-DD]
  `,
  group_id: "screengraph",
  source: "text"
});
```

**DO NOT SKIP THIS.** Future specs depend on this documentation.

---

## 🚨 Critical Rules (Violations = Rework)

### Architecture
- ✅ Backend/frontend completely independent (no shared node_modules)
- ✅ Use Encore generated clients (never manual fetch)
- ❌ NO root package.json (except dev harness)
- ❌ NO shared code between backend/frontend

### Naming
- ✅ Functions: `verbNoun` format (e.g., `createAgentState`, `fetchUserProfile`)
- ❌ Generic names: `handle()`, `process()`, `manager()`
- ✅ Classes: Singular nouns (e.g., `ScreenGraphProjector`)

### Type Safety
- ✅ Explicit types everywhere
- ❌ NEVER use `any` type (use `unknown` or specific types)
- ✅ Encore.ts limitation: NO indexed access types `(typeof X)[number]` - use explicit unions

### Logging
- ✅ Use `encore.dev/log` only (structured JSON)
- ❌ NEVER use `console.log` (violates founder rules)

### Spelling
- ✅ American English only: `canceled`, `color`, `optimize`
- ❌ British English: `cancelled`, `colour`, `optimise`

### Testing
- ✅ Import ALL subscriptions in `encore test` files
- ✅ Test for flow reliability (not petty edge cases)
- ✅ Backend: `encore test`, Frontend: `bun test`
- ✅ **Appium is automated** (Spec-001): Agent auto-starts Appium when needed
- ✅ Device requirement: Only Android device/emulator must be connected and authorized

### Git Workflow
- ✅ ALWAYS create new branch for work
- ✅ Commit ONLY when explicitly approved by founder
- ❌ NEVER commit to main/master directly
- ❌ NEVER push without pre-push hooks passing

---

## 🎭 MCP Tools Available (Use Them!)

You have access to these MCP tools via `@[tool-name]`:

**Knowledge Management:**
- `graphiti` - Search past solutions, document learnings (group_id: "screengraph")
- `context7` - Fetch up-to-date library documentation

**Backend Development:**
- `encore-mcp` - Introspect Encore services, databases, traces
- Query database: `mcp_encore-mcp_query_database`
- Get services: `mcp_encore-mcp_get_services`
- Get traces: `mcp_encore-mcp_get_traces`

**Frontend Development:**
- `svelte` - Svelte 5 documentation (195 resources!)
- `playwright` - Browser automation for testing
- Use `list-sections` first, then `get-documentation`

**Testing:**
- `browser` - Playwright browser control (navigate, snapshot, click)

**Deployment:**
- `vercel` - Frontend deployment
- `github` - Repository operations

**Reasoning:**
- `sequential-thinking` - Multi-step problem solving

---

## 📋 Checklist (Before Saying "Done")

```
Implementation:
 ☐ All tasks in tasks.md completed
 ☐ Called @during-task for each subtask (5-10 times)
 ☐ Tests written alongside code
 ☐ No any types used
 ☐ No console.log used
 ☐ American spelling throughout
 ☐ Descriptive function names

Testing:
 ☐ Smoke tests pass: task qa:smoke:all
 ☐ Unit tests pass: task backend:test, task frontend:test
 ☐ Integration tests pass (if applicable)
 ☐ Type checking passes: task frontend:typecheck
 ☐ Linting passes: task frontend:lint

Quality:
 ☐ Founder rules pass: task founder:rules:check
 ☐ Pre-push hook succeeded
 ☐ All acceptance criteria met (specs/[NUMBER]/acceptance.md)

Documentation:
 ☐ Ran @after-task and filled template
 ☐ Executed add_memory() with complete details
 ☐ All files listed, gotchas documented
 ☐ Group_id: "screengraph" used

Git:
 ☐ Branch created: spec-[NUMBER]-[description]
 ☐ Commits have descriptive messages
 ☐ Pushed to origin
 ☐ Ready for PR
```

---

## 🆘 If You Get Stuck

### Backend Issues
1. Load `backend-debugging_skill`: 10-phase debugging procedure
2. Use `encore-mcp` to introspect services/database
3. Check `backend/DEBUGGING_PROCEDURE.md`

### Frontend Issues
1. Load `frontend-debugging_skill`: 10-phase debugging procedure
2. Use `svelte` MCP for Svelte 5 patterns
3. Use `playwright` for browser inspection

### Testing Issues
1. Load `backend-testing_skill` for Encore test patterns
2. Load `webapp-testing_skill` for Playwright E2E
3. Remember: Import subscriptions in encore test!
4. **Appium automated** (Spec-001): Agent auto-starts Appium - just ensure device connected

### General
1. Search Graphiti: `search_memory_nodes(query: "[topic]", group_ids: ["screengraph"])`
2. Use `sequential-thinking` for complex reasoning
3. Check `.cursor/rules/founder_rules.mdc` for standards

---

## 🎯 Success Criteria

**You're done when:**

1. ✅ ALL tasks from tasks.md completed
2. ✅ ALL tests passing (smoke + unit + integration)
3. ✅ ALL quality checks passing (founder rules, lint, typecheck)
4. ✅ ALL acceptance criteria met (acceptance.md)
5. ✅ Branch pushed, ready for PR
6. ✅ Documentation captured in Graphiti via @after-task

**Estimated effort**: [X hours/days based on tasks.md complexity]

---

## 📞 Handoff Summary

**What you're implementing**: [1-sentence description]

**Where to start**: 
1. `@project-context Implement spec-[NUMBER] [title]`
2. Open `specs/[SPEC_NUMBER]/tasks.md`
3. Follow implementation workflow above

**Key files**:
- Spec: `specs/[SPEC_NUMBER]/spec.md`
- Tasks: `specs/[SPEC_NUMBER]/tasks.md`
- Plan: `specs/[SPEC_NUMBER]/plan.md`

**Expected outcome**: [Brief description of what success looks like]

**Gotchas to watch for**: [Any known issues from @project-context results]

---

## 🚀 Ready? Start Here:

```
@project-context Implement spec-[NUMBER] [title]
```

Then proceed with Step 1 (create branch) and work through tasks.md systematically.

**Remember**: Call `@during-task` before each subtask (5-10 times total). Document with `@after-task` when complete.

Good luck! 🎯
```

---

## 🔧 Customization Instructions

**Before sending to remote agent, fill in:**

1. `[NUMBER]` - Spec number (e.g., 002)
2. `[TITLE]` - Spec title (e.g., "Real-time Run Status Updates")
3. `[short-description]` - Branch name suffix (e.g., "sse-updates")
4. **Problem**: Brief problem statement from spec.md
5. **Solution**: High-level approach from plan.md
6. **Scope**: What's in/out of scope
7. **Expected outcome**: What success looks like
8. **Gotchas**: Any known issues to watch for
9. **Estimated effort**: Based on tasks.md complexity

**Optional additions:**
- Paste relevant sections from plan.md if complex architecture
- Add specific file paths if known in advance
- Include related specs/bugs for context

---

## 📊 Token Efficiency

This single prompt provides COMPLETE context:
- Project structure and stack
- Critical documentation references
- Step-by-step workflow
- Quality standards
- Testing requirements
- Git workflow
- Available MCP tools
- Success criteria

**Remote agent can implement entire spec from this one prompt.**

**Cost**: ~5000 tokens total (3-command system during implementation)  
**Savings**: 20+ hours of back-and-forth clarifications

---

**Last Updated**: 2025-11-14  
**File**: `specs/003-coding-agent-optimization/REMOTE_AGENT_PROMPT.md`

