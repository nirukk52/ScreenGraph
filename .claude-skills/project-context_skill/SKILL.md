---
name: project-context
description: Self-improving context loader that MUST be run before every prompt. Searches Graphiti for relevant past work, loads appropriate vibe, and provides intelligent recommendations.
---

# Project Context Skill (PRE-FLIGHT MANDATORY)

**USAGE**: Run this before EVERY prompt to load relevant context from past work.

```
@project-context [your upcoming task/question]
```

---

## What This Skill Does

1. **Searches Graphiti** for similar past work (bugs, patterns, solutions)
2. **Recommends the right vibe** to load (backend/frontend/qa/infra)
3. **Surfaces relevant context** (gotchas, files, past decisions)
4. **Provides actionable starting points** based on institutional knowledge
5. **Auto-improves** by documenting its own effectiveness

---

## Phase 1: Parse Intent

**Extract from user's prompt:**
- Domain (backend, frontend, testing, devops, appium)
- Task type (feature, bug, refactor, debug, test, spec)
- Key entities (agent, device, UI component, database, API)
- Spec-kit phase (if applicable: research, plan, implement, retro)

**Examples:**
- "Fix agent stalling on consent dialog" → backend, debugging, agent, appium
- "Build navigation component" → frontend, feature, UI
- "Write E2E test for run flow" → testing, E2E, run
- "Research real-time updates" → frontend, spec-discovery, sse
- "Plan SSE implementation" → frontend, spec-planning, architecture
- "Implement task 1 from spec-002" → frontend, spec-implementation

---

## Phase 2: Search Graphiti & Get MCP Recommendations

**Adjust searches based on intent:**

**If spec-related (research, plan, implement):**
```typescript
// Search for past specs
const pastSpecs = await search_memory_nodes({
  query: "spec [domain] [feature-type]",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Search for implementation patterns
const patterns = await search_memory_nodes({
  query: "[domain] implementation patterns",
  group_ids: ["screengraph"],
  max_nodes: 10
});
```

**If task-related (standard work):**
```typescript
// Search 1: Broad domain patterns
const domainPatterns = await search_memory_nodes({
  query: "[domain] patterns and best practices",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Search 2: Specific past work
const pastWork = await search_memory_nodes({
  query: "[specific task keywords]",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Search 3: Known gotchas
const gotchas = await search_memory_facts({
  query: "[technology/component] issues and workarounds",
  group_ids: ["screengraph"],
  max_facts: 10
});
```

**Always get MCP recommendations:**
```typescript
const mcpRecs = await suggest_mcps({
  task: "[user's task description]",
  include_examples: false  // Keep it brief
});
```

**Extract from results:**
- ✅ Similar past solutions
- ✅ Related files to check
- ✅ Known gotchas to avoid
- ✅ Relevant architectural decisions
- ✅ **Recommended MCPs to use**

---

## Phase 3: Recommend Vibe & MCPs

**Based on domain, recommend vibe to load:**

| If task involves... | Load this vibe |
|---------------------|----------------|
| Backend API, agent, database, Encore | `backend_vibe` |
| Frontend UI, Svelte, routing, components | `frontend_vibe` |
| E2E tests, Playwright, integration tests | `qa_vibe` |
| CI/CD, Task commands, MCP servers, automation | `infra_vibe` |
| Multiple domains simultaneously | `backend_vibe` + `frontend_vibe` (explicitly state both) |

**Also include MCP recommendations from screengraph-orchestrator:**

The orchestrator provides:
- Prioritized list of MCPs to use (graphiti always first)
- Specific tools to call within each MCP
- Usage examples and integration guidance
- Workflow suggestions tailored to the task

---

## Phase 4: Surface Context

**Present to user in this format:**

```markdown
## 🎯 Context Loaded for: [Task]

### 📚 Relevant Past Work
- [Past solution 1 with reference]
- [Past solution 2 with reference]
- [Gotcha from past attempt]

### 📁 Files to Check
- [File 1] - [Why relevant]
- [File 2] - [Why relevant]

### ⚠️ Known Gotchas
- [Gotcha 1 with workaround]
- [Gotcha 2 with workaround]

### 🎭 Vibe & MCPs
[Output from orchestrator includes both vibe and MCPs]

**Vibe**: `[vibe_name]` (skills: [skill1, skill2])  
**MCPs**:
1. [MCP 1]
2. [MCP 2]  
3. [MCP 3]

(The orchestrator automatically determines the right vibe based on task category)

### 🚀 Suggested Starting Point
1. [First action based on past patterns]
2. [Second action based on MCP recommendations]
3. [Third action]

### 📖 Additional Resources (if needed)
- Context7 library: [If external docs needed]
- Related skills: [Relevant skills to use]
```

---

## Phase 5: Auto-Improvement

**After task completion, document effectiveness:**

```typescript
// At end of session, ask user:
// "Did the context I provided help? What was missing?"

// Then document:
await add_memory({
  name: "Project Context Effectiveness - [Date]",
  episode_body: `
    [Tags: meta, project-context, self-improvement]
    
    **Task**: [What user asked for]
    **Context Provided**: [Summary of what I surfaced]
    **Outcome**: [Was it helpful? What was used? What was missing?]
    **Improvements**: [How to search better next time]
    
    **Patterns Discovered**:
    - [New pattern recognized]
    - [Connection between past work items]
    
    **Search Query Effectiveness**:
    - Queries used: [list]
    - Hit rate: [how many results were relevant]
    - Suggested improvements: [better keywords, different approach]
  `,
  group_id: "screengraph",
  source: "text"
});
```

---

## Usage Examples

### Example 1: Backend Debugging

**User says:**
```
@project-context Fix agent hanging on device connection
```

**Skill response:**
```markdown
## 🎯 Context Loaded for: Agent Device Connection Issue

### 📚 Relevant Past Work
- BUG-011: Appium shell stall - Learned to check WebDriver session health
- BUG-015: Privacy consent dialog stall - Must check for modals before policy execution
- Agent recovery patterns - Documented in device-check.ts

### 📁 Files to Check
- backend/agent/nodes/setup/EnsureDevice/device-check.ts - Device health checks
- backend/agent/nodes/setup/EnsureDevice/node.ts - Connection logic
- backend/agent/machine/AgentMachine.ts - State transitions

### ⚠️ Known Gotchas
- Appium sessions can timeout silently (set explicit timeouts)
- First-run consent dialogs block automation (check before starting)
- WebDriver commands fail without proper error surfacing

### 🎭 Recommended Vibe
**Load `backend_vibe`** for this task.

Use: encore-mcp for introspection, backend-debugging skill for systematic approach

### 🚀 Suggested Starting Point
1. Use encore-mcp to check latest agent state and run events
2. Add checkpoint logs in device-check.ts to narrow hang location
3. Verify WebDriver session is still alive
4. Check for modal dialogs blocking UI hierarchy

### 📖 Additional Resources
- Skill: backend-debugging (10-phase procedure)
- MCP: encore-mcp (query database, check traces)
```

### Example 2: Frontend Feature

**User says:**
```
@project-context Build real-time run status component
```

**Skill response:**
```markdown
## 🎯 Context Loaded for: Real-time Run Status Component

### 📚 Relevant Past Work
- Run page uses SSE for real-time updates (frontend/src/routes/runs/[runId]/+page.svelte)
- Svelte 5 runes pattern: $state for reactive data
- Event stream integration documented in run service

### 📁 Files to Check
- frontend/src/routes/runs/[runId]/+page.svelte - Existing SSE implementation
- backend/run/encore.service.ts - Event stream endpoint
- backend/run/stream.repo.ts - Run events query

### ⚠️ Known Gotchas
- SSE connections must handle browser reconnect gracefully
- Svelte 5 runes: Use $state() for reactivity, not let/const
- Event stream order: subscribe BEFORE fetching initial state (avoid race condition)

### 🎭 Recommended Vibe
**Load `frontend_vibe`** for this task.

Use: svelte MCP for autofixer, playwright for testing

### 🚀 Suggested Starting Point
1. Review existing SSE pattern in run detail page
2. Create component with $state() for status
3. Subscribe to run_events stream
4. Handle reconnection and error states
5. Test with playwright browser inspection

### 📖 Additional Resources
- Context7: svelte/svelte (Svelte 5 runes, $state, $effect)
- Skill: frontend-development (Svelte 5 patterns)
```

### Example 3: Testing

**User says:**
```
@project-context Write E2E test for agent run flow
```

**Skill response:**
```markdown
## 🎯 Context Loaded for: Agent Run E2E Test

### 📚 Relevant Past Work
- Existing E2E test: tests/e2e-run.spec.ts - Full run flow coverage
- Backend testing with encore test (includes all subscriptions)
- Integration test pattern: backend/agent/tests/metrics.test.ts

### 📁 Files to Check
- frontend/tests/e2e-run.spec.ts - Existing E2E pattern
- backend/agent/tests/metrics.test.ts - Backend test structure
- .claude-skills/backend-testing_skill/SKILL.md - Testing workflow

### ⚠️ Known Gotchas
- MUST import all subscriptions in encore test (agent, artifacts, graph)
- Appium + device must be running for integration tests
- E2E tests: Use playwright browser MCP instead of manual inspection
- Frontend E2E: Wait for SSE events, not just HTTP responses

### 🎭 Recommended Vibe
**Load `qa_vibe`** for this task.

Use: playwright MCP for frontend, encore-mcp for backend verification

### 🚀 Suggested Starting Point
1. Review existing e2e-run.spec.ts for pattern
2. Identify user flow to test
3. Write Playwright test with browser snapshots
4. Verify backend state with encore-mcp queries
5. Add to smoke test suite if critical path

### 📖 Additional Resources
- Skill: webapp-testing (Playwright-first approach)
- Skill: backend-testing (Encore test patterns)
- MCP: encore-mcp (verify backend state during test)
```

---

## Search Query Patterns (Self-Improvement)

**Track what works:**

| User Intent | Effective Queries | Hit Rate | Refinement Needed |
|-------------|-------------------|----------|-------------------|
| "Fix agent stall" | "agent state machine error", "device connection timeout" | High | Add "recovery patterns" |
| "Build component" | "Svelte 5 component patterns", "UI real-time updates" | Medium | Add specific component type |
| "Write test" | "E2E testing patterns", "integration test structure" | High | No change |
| "Debug database" | "database migration", "schema constraints" | Low | Add "SQL errors" |

**Document in Graphiti:**
```typescript
await add_memory({
  name: "Project Context Query Effectiveness - [Month]",
  episode_body: `
    [Tags: meta, project-context, search-queries]
    
    **Effective Query Patterns**:
    - Agent issues: "agent state" + "error handling" + "recovery"
    - UI components: "[framework] component" + "real-time" + "patterns"
    - Testing: "[test-type] testing patterns" + "structure"
    
    **Query Refinements Needed**:
    - Database issues: Add "constraint violations" to generic "database" queries
    - Performance: Add "optimization" + "bottleneck" keywords
    
    **New Patterns Discovered**:
    - When user mentions "stall/hang", always search for "timeout" and "session"
    - When user mentions "build X", search for both "X component pattern" and "X integration"
  `,
  group_id: "screengraph",
  source: "text"
});
```

---

## Integration with Other Skills

**Before starting work:**
1. Run `@project-context [task]`
2. Load recommended vibe
3. Use surfaced context to inform approach
4. Proceed with domain-specific skills

**After completing work:**
1. Document solution in Graphiti (per founder_rules)
2. Update project-context effectiveness if needed

---

## Skill Maintenance

**Monthly review:**
1. Search Graphiti for "project-context effectiveness" entries
2. Analyze hit rates and query patterns
3. Update search strategies
4. Document improvements

**Continuous learning:**
- Every 10 uses, review what context was most helpful
- Adjust search queries based on success patterns
- Add new domain categories as project evolves
- Refine vibe recommendations based on actual usage

---

## Quick Reference

**Mandatory usage:**
```
@project-context [describe your task in natural language]
```

**What you get:**
- ✅ Relevant past work and solutions
- ✅ Files to check
- ✅ Known gotchas and workarounds
- ✅ Recommended vibe to load
- ✅ Actionable starting points

**What happens behind the scenes:**
1. Parse your intent
2. Search Graphiti for similar work
3. Extract relevant context
4. Recommend tools and approaches
5. Document effectiveness for future improvement

---

## Meta: This Skill's Purpose

**Problem**: Starting work without context leads to:
- ❌ Reinventing solutions
- ❌ Hitting known gotchas
- ❌ Missing relevant files
- ❌ Inefficient debugging

**Solution**: Load institutional knowledge automatically
- ✅ Search Graphiti before every task
- ✅ Surface relevant past work
- ✅ Provide intelligent recommendations
- ✅ Self-improve based on effectiveness

**Outcome**: Every task starts with full context, every solution improves the knowledge base.

