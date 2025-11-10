# Vibes — Engineering Persona System

> **Purpose**: Context-switching profiles that configure Claude/AI agents with domain-specific tools, rules, documentation, and workflows.

---

## 🎭 What Are Vibes?

**Vibes** are role-based engineering personas that tell AI agents:
- 🔧 **Which MCP tools to use** (Playwright, Encore MCP, Graphiti, etc.)
- 📚 **Which documentation to follow** (frontend_engineer.mdc, backend_coding_rules.mdc, etc.)
- 🛠️ **Which Task commands to run** (from `.cursor/commands/Taskfile.yml`)
- 🧠 **Which Claude skills to leverage** (from `.claude-skills/`)
- 🔄 **Workflow patterns** for common tasks

**Every vibe extends `base_vibe`**, which provides universal tools (Graphiti, Context7, Sequential-Thinking) and core workflows.

---

## 📁 Available Vibes

| Vibe | When to Use | Primary Tools | Skills |
|------|-------------|---------------|--------|
| **`base_vibe`** | Foundation for all vibes | graphiti, context7, sequential-thinking | N/A (inherited by all) |
| **`backend_vibe`** | Backend/API work | encore-mcp, github | backend-debugging, backend-testing |
| **`frontend_vibe`** | Frontend/UI work | playwright, svelte, figma, vercel | frontend-debugging, frontend-development, webapp-testing |
| **`infra_vibe`** | DevOps/automation | github, vercel | mcp-builder, skill-creator, graphiti-mcp-usage |
| **`qa_vibe`** | Testing/QA | playwright, encore-mcp, github | webapp-testing, backend-testing |
| **`vibe_manager_vibe`** | Vibe/skill/MCP organization | graphiti, github | skill-creator, mcp-builder, graphiti-mcp-usage |

---

## 🚀 Quick Start

### How to Load a Vibe

**Simple:** Just tell Claude which vibe you need!

```
"Load backend_vibe and fix the agent state machine"
```

```
"Load frontend_vibe and implement the navigation component"
```

```
"Load qa_vibe and write E2E tests for the run flow"
```

```
"Load infra_vibe and create a GitHub Actions MCP server"
```

---

## 🧭 Vibe Decision Tree

```
┌─ What are you working on?
│
├─ Backend APIs, database, services, Encore.ts?
│  └─> Load backend_vibe
│
├─ Frontend UI, components, SvelteKit routes, Svelte 5?
│  └─> Load frontend_vibe
│
├─ Testing, QA, smoke tests, E2E flows, Playwright?
│  └─> Load qa_vibe
│
├─ Automation, MCP servers, skills, DevOps, CI/CD?
│  └─> Load infra_vibe
│
└─ Vibes, skills, MCP config, root docs, organizational infrastructure?
   └─> Load vibe_manager_vibe
```

---

## 📖 Detailed Vibe Descriptions

### 🔵 Base Vibe (Foundation)

**File:** `base_vibe.json`

**Purpose:** Universal foundation inherited by all vibes

**Core MCP Tools:**
- **graphiti**: Knowledge graph for architectural decisions
- **context7**: Documentation retrieval
- **sequential-thinking**: Complex reasoning

**Universal Rules:**
- ALWAYS search Graphiti before implementing new patterns
- AFTER solving issues, document via Graphiti
- FOR unfamiliar libraries, use Context7
- WHEN stuck, use sequential-thinking
- Follow `founder_rules.mdc` for standards

**Universal Workflow:**
1. **Before starting:** Load vibe, search Graphiti, review docs
2. **During work:** Use vibe-specific tools, run Task commands
3. **After completing:** Run quality checks, capture decisions

---

### 🟢 Backend Vibe

**File:** `backend_vibe.json`

**Domain:** Encore.ts backend development, APIs, database, services

**MCP Tools:**
- **encore-mcp**: Live backend introspection, API testing
- **github**: Repository operations, code review

**Key Rules:**
- Follow `backend_coding_rules.mdc`
- Use structured logging only (NEVER console.log)
- Typed database queries with SQLDatabase
- Explicit literal unions (NOT indexed access types)
- After API changes: `task founder:workflows:regen-client`

**Common Task Commands:**
```bash
task backend:dev              # Start backend only
task backend:health           # Health check
task backend:test             # Run tests
task backend:db:migrate       # Run migrations
task backend:db:shell         # Database shell
task qa:smoke:backend         # Smoke tests
```

**Claude Skills:**
- `backend-debugging` (10-phase systematic debugging)
- `backend-testing` (testing strategies)

**Workflow Patterns:**
- **API Development:** Search Graphiti → Define types → Implement → Test via encore-mcp → Regen client
- **Database Changes:** Create migration → Migrate → Update repos → Test → Document
- **Debugging:** Load @backend-debugging → Use encore-mcp traces → Check logs → Document solution

---

### 🔵 Frontend Vibe

**File:** `frontend_vibe.json`

**Domain:** SvelteKit 2 + Svelte 5, UI components, routing, SSR

**MCP Tools:**
- **playwright**: Browser automation, UI inspection, testing
- **svelte**: Svelte 5 docs, playground links
- **figma**: Design handoff
- **vercel**: Deployment, production debugging

**Key Rules:**
- Follow `frontend_engineer.mdc` and `frontend_llm_instruction.mdc`
- Svelte 5 runes ONLY ($state, $derived, $effect, $props)
- NEVER legacy reactivity ($: reactive statements)
- Use Encore-generated client (NEVER manual fetch)
- Tailwind v4 + Skeleton UI v4
- Validate with `svelte.autofixer`

**Common Task Commands:**
```bash
task frontend:dev             # Start frontend only
task frontend:build           # Production build
task frontend:test            # Run tests
task frontend:typecheck       # Type checking
task frontend:lint            # Lint code
task frontend:gen             # Regen Encore client
task qa:smoke:frontend        # Smoke tests
```

**Claude Skills:**
- `frontend-debugging` (10-phase SvelteKit debugging)
- `frontend-development` (comprehensive Svelte 5 guide)
- `webapp-testing` (Playwright testing playbook)

**Workflow Patterns:**
- **Component Development:** Load svelte docs → Implement with runes → Inspect via playwright → Validate with autofixer
- **API Integration:** Regen client → Import from ~encore/clients → Handle states → Test
- **Debugging UI:** Load @frontend-debugging → Use playwright.snapshot → Check console → Document
- **Design Implementation:** Fetch figma design → Extract tokens → Implement with Tailwind → Verify

---

### 🟠 Infra Vibe

**File:** `infra_vibe.json`

**Domain:** Automation, MCP servers, skills, DevOps, CI/CD

**MCP Tools:**
- **github**: Workflow management, repo config
- **vercel**: Deployment configuration

**Key Rules:**
- Use `@mcp-builder_skill` for new MCPs (4-phase process)
- Use `@skill-creator` for new skills
- All automation in `.cursor/commands`
- Command descriptions ≤ 5 words
- Rule files end `_rules`, skill dirs end `_skill`
- Document via Graphiti.add_episode

**Common Task Commands:**
```bash
task founder:servers:start    # Start all services
task founder:servers:status   # Check status
task founder:rules:check      # Validate compliance
task qa:smoke:all            # All smoke tests
task ops:env:print           # Print environment
task ops:ports:show          # Port assignments
task --list                  # List all commands
```

**Claude Skills:**
- `mcp-builder` (create high-quality MCP servers)
- `skill-creator` (create new Claude skills)
- `graphiti-mcp-usage` (knowledge management guide)

**Workflow Patterns:**
- **MCP Server Creation:** Load @mcp-builder → Research → Implement → Evaluate → Register → Update vibe
- **Skill Creation:** Load @skill-creator → Define scope → Create → Add to skills.json → Test
- **Automation:** Define workflow → Create Task command → Add to skills.json → Test → Document

---

### 🟣 QA Vibe

**File:** `qa_vibe.json`

**Domain:** Testing, QA, smoke tests, E2E flows, mobile automation

**MCP Tools:**
- **playwright**: Web E2E testing, browser automation
- **encore-mcp**: Backend API testing, request tracing
- **github**: CI/CD pipeline management

**Key Rules:**
- Follow `webapp-testing_skill` for Playwright-first strategy
- Always run smoke tests before major changes
- Test complete workflows, not petty edge cases
- Focus on flow reliability and creative consistency
- Deterministic and repeatable tests only
- Document patterns in Graphiti

**Common Task Commands:**
```bash
task qa:smoke:all            # All smoke tests
task qa:smoke:backend        # Backend smoke
task qa:smoke:frontend       # Frontend smoke
task qa:appium:start         # Start Appium
task qa:appium:stop          # Stop Appium
task backend:test            # Backend unit tests
task frontend:test           # Frontend unit tests
```

**Claude Skills:**
- `webapp-testing` (Playwright-first testing playbook)
- `backend-testing` (backend testing strategies)
- `backend-debugging` (debug backend test failures)
- `frontend-debugging` (debug frontend test failures)

**Test Categories:**
- **Smoke Tests**: Quick validation, critical paths only, every commit
- **Unit Tests**: Individual functions, during development
- **Integration Tests**: Service interactions, before releases
- **E2E Tests**: Complete workflows, critical paths in CI

**Workflow Patterns:**
- **Smoke Testing:** Check services → Run smoke tests → Debug failures → Fix → Re-run
- **E2E Creation:** Load @webapp-testing → Identify journey → Write test → Debug via playwright → Verify deterministic
- **API Testing:** Test via encore-mcp → Write test in backend → Run tests → Document
- **Debugging:** Reproduce → Screenshot → Check traces → Systematic analysis → Document

---

### 🎛️ Vibe Manager Vibe (Meta Infrastructure)

**File:** `vibe_manager_vibe.json`

**Purpose:** Manages the organizational layer - vibes, skills, MCP tools, root documentation, and coding agent infrastructure.

**Core Responsibilities:**
- **Vibes:** All vibe definitions in `vibes/` directory
- **Skills:** All skill definitions in `.claude-skills/`
- **MCP Registry:** `.cursor/mcp.json` and `.cursor/mcp.local.json`
- **Root Docs:** `CLAUDE.md`, `README.md`, `WHAT_WE_ARE_MAKING.md`, etc.
- **Rules:** `.cursor/rules/founder_rules.mdc`
- **Task Organization:** `.cursor/commands/` structure and naming

**MCP Tools:**
- **graphiti** - Document organizational decisions
- **github** - Manage repository structure

**What Vibe Manager Does NOT Touch:**
- ❌ Service code (`backend/`, `frontend/`)
- ❌ Test implementation (owned by qa_vibe)
- ❌ Deployment configs (owned by infra_vibe)

**Workflow Patterns:**
- **Create Vibe:** Search Graphiti → Identify tools → Create JSON → Assign skills → Document → Test
- **Create Skill:** Use skill-creator → Choose type → Add to skills.json or SKILL.md → Assign to vibes
- **Add MCP:** Config in mcp.json → Assign to vibes → Document → Test
- **Reorganize Tasks:** Identify overlap → Consolidate → Update vibes/skills/docs → Test

**Example Usage:**
```
"Load vibe_manager_vibe and create a new deployment_vibe"
"Load vibe_manager_vibe and reorganize the testing commands"
"Load vibe_manager_vibe and add Stripe MCP to backend_vibe"
```

---

## 🔗 Integration with Automation System

Vibes integrate deeply with the entire ScreenGraph automation ecosystem:

### Documentation Hierarchy

```
1. founder_rules.mdc        → Non-negotiable standards
2. CLAUDE.md                → Project quick reference
3. .cursor/commands         → Task automation
4. .claude-skills           → AI playbooks
5. vibes/                   → Engineering personas ⭐
```

### MCP Tools Registry

**Location:** `.cursor/mcp.json` (template) and `.cursor/mcp.local.json` (your secrets)

All vibes reference tools from the MCP registry. To add a new tool:
1. Add to `.cursor/mcp.json` (template)
2. Add secrets to `.cursor/mcp.local.json` (gitignored)
3. Update relevant vibe(s) with tool info
4. Document in Graphiti

### Task Commands

**Location:** `.cursor/commands/Taskfile.yml`

All vibes reference Task commands for automation. Commands are:
- Deterministic and repeatable
- Documented with natural language (≤5 words)
- Categorized (development, testing, quality, workflows)
- Discoverable via `task --list`

### Claude Skills

**Location:** `.claude-skills/`

Vibes reference both types of skills:
- **Task-based** (30 skills in `skills.json`): Call Task commands
- **Knowledge-based** (5 skills in `*/SKILL.md`): Multi-phase playbooks

---

## 🛠️ Extending Vibes

### Adding a New MCP Tool to a Vibe

1. Build the MCP server (use `@mcp-builder_skill`)
2. Add to `.cursor/mcp.json`:
   ```json
   "my-service": {
     "command": "node",
     "args": ["path/to/dist/index.js"]
   }
   ```
3. Update vibe file (e.g., `backend_vibe.json`):
   ```json
   {
     "name": "my-service",
     "purpose": "What it does",
     "when_to_use": ["Scenario 1", "Scenario 2"],
     "key_operations": ["operation1", "operation2"]
   }
   ```
4. Document via `graphiti.add_episode`

### Creating a New Vibe

If you need a new domain (e.g., `design_vibe`, `data_vibe`):

1. Copy `base_vibe.json` as template
2. Set `"extends": "base_vibe"`
3. Define domain-specific MCP tools
4. Add domain-specific rules and documentation
5. List Task commands and Claude skills
6. Define workflow patterns
7. Update this README with the new vibe

---

## 💡 Best Practices

### DO:
✅ **Load the appropriate vibe at start of work**  
✅ **Search Graphiti before implementing new patterns**  
✅ **Use vibe-specific MCP tools instead of manual work**  
✅ **Follow vibe-specific rules and documentation**  
✅ **Document discoveries via Graphiti after solving issues**  
✅ **Run quality checks before completing work**

### DON'T:
❌ **Mix vibes** (pick one primary vibe per task)  
❌ **Ignore vibe rules** (they exist for consistency)  
❌ **Skip Graphiti searches** (avoid reinventing)  
❌ **Forget to document** (future you will thank you)  
❌ **Work without loading a vibe** (you'll miss tools/context)

---

## 🎓 Examples

### Backend Example

```
User: "Load backend_vibe and add a new API endpoint for user profiles"

Agent:
1. ✅ Load backend_vibe.json
2. ✅ Search Graphiti for existing user-related patterns
3. ✅ Follow backend_coding_rules.mdc
4. ✅ Use encore-mcp to inspect current endpoints
5. ✅ Implement with typed request/response (no 'any')
6. ✅ Add structured logging via encore.dev/log
7. ✅ Test via encore-mcp.call_endpoint
8. ✅ Run: task founder:workflows:regen-client
9. ✅ Document new pattern in Graphiti
```

### Frontend Example

```
User: "Load frontend_vibe and build a navigation component"

Agent:
1. ✅ Load frontend_vibe.json
2. ✅ Use svelte.list-sections to find navigation patterns
3. ✅ Use svelte.get-documentation for routing docs
4. ✅ Implement with Svelte 5 runes ($state, $derived)
5. ✅ Use Tailwind v4 + Skeleton UI v4
6. ✅ Test via playwright.navigate + playwright.snapshot
7. ✅ Validate with svelte.autofixer
8. ✅ OPTIONAL: Create svelte.playground-link for user
9. ✅ Document component patterns in Graphiti
```

### QA Example

```
User: "Load qa_vibe and write E2E tests for the run flow"

Agent:
1. ✅ Load qa_vibe.json
2. ✅ Load @webapp-testing skill for guidance
3. ✅ Use playwright to map out user journey
4. ✅ Write test in frontend/tests/e2e/
5. ✅ Debug locally with playwright MCP tools
6. ✅ Verify deterministic (run 3x)
7. ✅ Run: task qa:smoke:all to validate
8. ✅ Document test coverage in Graphiti
```

### Infra Example

```
User: "Load infra_vibe and create a Stripe MCP server"

Agent:
1. ✅ Load infra_vibe.json
2. ✅ Load @mcp-builder_skill/SKILL.md
3. ✅ Phase 1: Research Stripe API comprehensively
4. ✅ Phase 2: Implement in TypeScript with proper tools
5. ✅ Phase 3: Review code quality
6. ✅ Phase 4: Create evaluations
7. ✅ Add to .cursor/mcp.json
8. ✅ Update backend_vibe with new Stripe tool
9. ✅ Document in Graphiti.add_episode
```

---

## 📚 Related Documentation

- **`.cursor/rules/founder_rules.mdc`** - Non-negotiable standards
- **`CLAUDE.md`** - Project quick reference
- **`.cursor/commands/README.md`** - All Task commands
- **`.claude-skills/README.md`** - Skills documentation
- **`.cursor/mcp.json`** - MCP server registry
- **`automation/README.md`** - Automation library

---

**Last Updated:** 2025-11-09  
**Version:** 1.0  
**Maintained By:** Founder (via surgical edits only)

