# ScreenGraph Vibe Layering Architecture

**Purpose:** Explain the 5-layer architecture for organizing coding agent infrastructure and what each vibe owns.

---

## 🏗️ The 5 Layers

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: Base Infrastructure (base_vibe)               │
│  Universal tools, core patterns, foundation rules       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: Domain Vibes                                  │
│  backend_vibe, frontend_vibe, qa_vibe, infra_vibe       │
│  Domain-specific tools, commands, skills                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: Meta Vibe (vibe_manager_vibe)                 │
│  Manages vibes, skills, MCP tools, root docs            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: Task Automation                               │
│  .cursor/commands/*, automation/scripts/                │
│  Deterministic shell automation                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: Skills System                                 │
│  .claude-skills/skills.json, .claude-skills/*_skill/    │
│  Natural language → automation workflows                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 What Each Vibe Owns

### 🔵 Base Vibe (Foundation)

**File:** `vibes/base_vibe.json`

**Owns:**
- Universal MCP tools for ALL vibes
- Core workflow patterns
- Foundation rules

**Provides to All Vibes:**
- `graphiti` - Knowledge graph for decisions
- `context7` - Documentation retrieval
- `sequential-thinking` - Complex reasoning

**Responsibilities:**
- Define universal workflow (before/during/after work)
- Establish core rules (search Graphiti first, document after)
- Provide baseline tooling for all coding agents

**Does NOT Own:**
- Domain-specific tools
- Service code
- Task commands

---

### 🟢 Backend Vibe

**File:** `vibes/backend_vibe.json`

**Owns:**
- `backend/` directory (all services, tests, migrations)
- Backend-specific MCP tools
- Backend Task commands
- Backend Claude skills

**Specific Ownership:**
```
backend/
├── agent/          ✓ Backend vibe
├── appinfo/        ✓ Backend vibe
├── artifacts/      ✓ Backend vibe
├── graph/          ✓ Backend vibe
├── run/            ✓ Backend vibe
├── db/             ✓ Backend vibe
└── *.test.ts       ✓ Backend vibe (unit/integration tests)
```

**MCP Tools:**
- `encore-mcp` - Backend introspection, API testing, trace analysis
- `github` - Repository management

**Task Commands:**
- `backend:dev` - Start backend
- `backend:test` - Run backend tests
- `backend:db:*` - Database operations
- `backend:health`, `backend:logs`

**Claude Skills:**
- `backend-debugging` - 10-phase Encore.ts debugging
- `backend-testing` - Backend testing strategies

**Does NOT Own:**
- Frontend code
- Root organizational files
- Vibe definitions

---

### 🟣 Frontend Vibe

**File:** `vibes/frontend_vibe.json`

**Owns:**
- `frontend/` directory (routes, components, stores)
- Frontend-specific MCP tools
- Frontend Task commands
- Frontend Claude skills

**Specific Ownership:**
```
frontend/
├── src/
│   ├── routes/     ✓ Frontend vibe
│   ├── lib/        ✓ Frontend vibe
│   └── app.css     ✓ Frontend vibe
├── tests/e2e/      ✗ QA vibe (but frontend vibe can use playwright)
└── *.svelte        ✓ Frontend vibe
```

**MCP Tools:**
- `playwright` - Browser automation, UI testing
- `svelte` - Svelte 5 documentation
- `figma` - Design integration
- `vercel` - Deployment

**Task Commands:**
- `frontend:dev` - Start frontend
- `frontend:build` - Production build
- `frontend:typecheck`, `frontend:lint`
- `frontend:gen` - Regenerate Encore client

**Claude Skills:**
- `frontend-debugging` - 10-phase SvelteKit debugging
- `frontend-development` - UI development patterns
- `webapp-testing` (shared with qa_vibe)

**Does NOT Own:**
- Backend code
- Test execution (qa_vibe runs tests)
- Root organizational files

---

### 🟡 QA Vibe

**File:** `vibes/qa_vibe.json`

**Owns:**
- Test infrastructure and execution
- QA Task commands
- Testing MCP tools
- Testing Claude skills

**Specific Ownership:**
```
backend/**/*.test.ts       ✗ Backend vibe writes, QA vibe runs
frontend/tests/e2e/        ✓ QA vibe (Playwright tests)
.cursor/commands/qa/       ✓ QA vibe (Task commands)
automation/TEST_*.md       ✓ QA vibe (test documentation)
```

**MCP Tools:**
- `playwright` - E2E browser testing
- `encore-mcp` - API testing, trace analysis
- `github` - CI/CD test pipelines

**Task Commands:**
- `qa:smoke` - Health checks
- `qa:lint`, `qa:typecheck` - Static analysis
- `qa:unit`, `qa:unit:backend`, `qa:unit:frontend` - Unit tests
- `qa:e2e`, `qa:e2e:headed`, `qa:e2e:ui` - E2E tests
- `qa:all` - Complete suite
- `qa:appium:start/stop` - Mobile testing

**Claude Skills:**
- `webapp-testing` - Playwright-first testing playbook
- `backend-testing` - Backend testing strategies
- `backend-debugging` (for test failures)
- `frontend-debugging` (for test failures)

**Does NOT Own:**
- Test implementation code (backend/frontend vibes write tests)
- Service code
- Vibe definitions

---

### 🔴 Infra Vibe

**File:** `vibes/infra_vibe.json`

**Owns:**
- CI/CD pipelines
- Deployment configurations
- MCP server creation
- Skill creation
- DevOps automation

**Specific Ownership:**
```
.github/workflows/         ✓ Infra vibe
.husky/                    ✓ Infra vibe
automation/scripts/        ✓ Infra vibe (if DevOps-related)
.cursor/mcp.json          ✗ Vibe Manager vibe
```

**MCP Tools:**
- `github` - Actions, workflows, releases
- `vercel` - Deployment management

**Task Commands:**
- Uses founder:*, ops:* commands
- Manages CI/CD workflows

**Claude Skills:**
- `mcp-builder` - Create MCP servers (4-phase process)
- `skill-creator` - Create new Claude skills
- `graphiti-mcp-usage` - Document infra decisions

**Does NOT Own:**
- Service code
- Vibe/skill definitions (vibe_manager owns)
- Test implementation

---

### 🟠 Vibe Manager Vibe (Meta Infrastructure) ⭐ NEW

**File:** `vibes/vibe_manager_vibe.json`

**Owns:**
- **All vibe definitions** (`vibes/`)
- **All skill definitions** (`.claude-skills/`)
- **MCP registry** (`.cursor/mcp.json`, `.cursor/mcp.local.json`)
- **Root documentation** (all `.md` files at root)
- **Founder rules** (`.cursor/rules/founder_rules.mdc`)
- **Task organization** (`.cursor/commands/` structure)
- **Organizational infrastructure**

**Specific Ownership:**
```
Root Level:
├── CLAUDE.md                  ✓ Vibe Manager
├── README.md                  ✓ Vibe Manager
├── WHAT_WE_ARE_MAKING.md      ✓ Vibe Manager
├── ARCHITECTURE_*.md          ✓ Vibe Manager
├── TESTING_*.md               ✓ Vibe Manager
├── *_HANDOFF.md               ✓ Vibe Manager

vibes/
├── base_vibe.json             ✓ Vibe Manager
├── backend_vibe.json          ✓ Vibe Manager
├── frontend_vibe.json         ✓ Vibe Manager
├── qa_vibe.json               ✓ Vibe Manager
├── infra_vibe.json            ✓ Vibe Manager
├── vibe_manager_vibe.json     ✓ Vibe Manager
└── README.md                  ✓ Vibe Manager

.claude-skills/
├── skills.json                ✓ Vibe Manager
├── README.md                  ✓ Vibe Manager
└── *_skill/                   ✓ Vibe Manager

.cursor/
├── mcp.json                   ✓ Vibe Manager
├── mcp.local.json             ✓ Vibe Manager
├── Taskfile.yml               ✓ Vibe Manager (root orchestration)
├── commands/                  ✓ Vibe Manager (structure/naming)
│   ├── qa/Taskfile.yml        ✓ Vibe Manager (organization)
│   ├── backend/Taskfile.yml   ✓ Vibe Manager (organization)
│   └── ...
└── rules/
    └── founder_rules.mdc      ✓ Vibe Manager

Does NOT Own:
├── backend/                   ✗ Backend vibe
├── frontend/                  ✗ Frontend vibe
├── .github/workflows/         ✗ Infra vibe
└── .husky/                    ✗ Infra vibe
```

**MCP Tools:**
- `graphiti` - Document vibe/skill/MCP organizational decisions
- `github` - Manage repository structure

**Task Commands:**
- `task --list-all` - See all commands
- `task founder:rules:check` - Validate standards
- `task help` - Common commands

**Claude Skills:**
- `skill-creator` - Create new skills
- `mcp-builder` - Create MCP servers
- `graphiti-mcp-usage` - Document decisions

**Workflow Patterns:**
1. **Create New Vibe** - Design → Create JSON → Assign tools/skills → Document → Test
2. **Create New Skill** - Use skill-creator → Add to skills.json or SKILL.md → Assign to vibes
3. **Add MCP Tool** - Configure in mcp.json → Assign to vibes → Document
4. **Reorganize Tasks** - Identify overlap → Consolidate → Update all references → Test

**Example Usage:**
```
"Load vibe_manager_vibe and create a security_vibe for auth work"
"Load vibe_manager_vibe and consolidate the testing commands"
"Load vibe_manager_vibe and add the Stripe MCP to backend_vibe"
"Load vibe_manager_vibe and update the vibe decision tree"
```

**Does NOT Touch:**
- Service implementation code
- Test implementation code
- Deployment scripts (infra_vibe owns)

---

## 📋 Vibe Ownership Matrix

| What | Owned By | Example Files |
|------|----------|---------------|
| **Universal MCP tools** | base_vibe | graphiti, context7, sequential-thinking |
| **Backend code** | backend_vibe | backend/agent/, backend/run/, *.test.ts |
| **Frontend code** | frontend_vibe | frontend/src/routes/, *.svelte |
| **Test execution** | qa_vibe | qa:* commands, Playwright tests |
| **CI/CD pipelines** | infra_vibe | .github/workflows/, .husky/ |
| **Vibe definitions** | vibe_manager_vibe | vibes/*.json, vibes/README.md |
| **Skill definitions** | vibe_manager_vibe | .claude-skills/*, skills.json |
| **MCP registry** | vibe_manager_vibe | .cursor/mcp.json |
| **Root docs** | vibe_manager_vibe | CLAUDE.md, README.md |
| **Founder rules** | vibe_manager_vibe | .cursor/rules/founder_rules.mdc |
| **Task organization** | vibe_manager_vibe | .cursor/commands/ structure |

---

## 🔄 How Layers Interact

### Layer 1 → Layer 2: Base Provides Foundation
```
base_vibe.json
    ↓ (inherited by)
backend_vibe.json, frontend_vibe.json, qa_vibe.json, infra_vibe.json
    ↓ (all get)
graphiti, context7, sequential-thinking, core workflow patterns
```

### Layer 2 → Layer 4: Vibes Use Task Commands
```
backend_vibe
    ↓ (references)
task_commands: ["backend:dev", "backend:test", "backend:db:migrate"]
    ↓ (executes)
.cursor/commands/backend/Taskfile.yml
    ↓ (runs)
cd ../../backend && encore run
```

### Layer 2 → Layer 5: Vibes Use Skills
```
qa_vibe
    ↓ (references)
claude_skills: ["webapp-testing", "backend-testing"]
    ↓ (loads)
.claude-skills/webapp-testing_skill/SKILL.md
    ↓ (follows)
10-phase Playwright testing procedure
```

### Layer 3 → All Layers: Vibe Manager Orchestrates
```
vibe_manager_vibe
    ↓ (creates/updates)
vibes/*.json (Layer 2)
    ↓ (assigns)
MCP tools from .cursor/mcp.json
    ↓ (assigns)
Task commands from .cursor/commands/ (Layer 4)
    ↓ (assigns)
Claude skills from .claude-skills/ (Layer 5)
```

---

## 🎯 Vibe Manager Responsibilities

### What Vibe Manager Manages

#### 1. Vibe Definitions (`vibes/`)
```
vibes/
├── base_vibe.json          ← Foundation (Layer 1)
├── backend_vibe.json       ← Domain vibes (Layer 2)
├── frontend_vibe.json      ← Domain vibes (Layer 2)
├── qa_vibe.json            ← Domain vibes (Layer 2)
├── infra_vibe.json         ← Domain vibes (Layer 2)
├── vibe_manager_vibe.json  ← Meta vibe (Layer 3)
└── README.md               ← Vibe documentation
```

**Ensures:**
- All vibes extend base_vibe
- MCP tools assigned based on domain
- Task commands match actual availability
- Skills correctly categorized
- Decision tree is accurate

#### 2. Skills Definitions (`.claude-skills/`)
```
.claude-skills/
├── skills.json                      ← Task-based skills (30+)
├── README.md                        ← Skills documentation
├── backend-debugging_skill/         ← Knowledge-based skill
│   └── SKILL.md
├── frontend-debugging_skill/
│   └── SKILL.md
├── webapp-testing_skill/
│   └── SKILL.md
├── skill-creator_skill/             ← Meta skill
│   └── SKILL.md
└── ...
```

**Ensures:**
- Task-based skills map to real Task commands
- Knowledge-based skills follow naming convention
- Skills assigned to correct vibes
- Documentation stays synchronized

#### 3. MCP Registry (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "graphiti": { "command": "...", "args": [...] },
    "encore-mcp": { "command": "...", "args": [...] },
    "playwright": { "command": "...", "args": [...] },
    ...
  }
}
```

**Ensures:**
- All MCP servers properly configured
- Tools assigned to vibes that need them
- Secrets in mcp.local.json (gitignored)
- Documentation reflects actual tools

#### 4. Root Documentation
```
Root:
├── CLAUDE.md                    ← Quick reference
├── README.md                    ← Project overview
├── WHAT_WE_ARE_MAKING.md        ← Product vision
├── ARCHITECTURE_*.md            ← Architecture docs
├── TESTING_*.md                 ← Testing docs
├── BACKEND_HANDOFF.md           ← Backend summary
├── FRONTEND_HANDOFF.md          ← Frontend summary
└── VIBE_LAYERING_ARCHITECTURE.md ← This file
```

**Ensures:**
- Quick references stay accurate
- Documentation hierarchy clear
- No duplication with .cursor/rules/
- Surgical updates only

#### 5. Founder Rules (`.cursor/rules/`)
```
.cursor/rules/
├── founder_rules.mdc          ← Non-negotiable standards
├── backend_coding_rules.mdc   ← Backend detailed reference
├── frontend_engineer.mdc      ← Frontend detailed reference
└── frontend_llm_instruction.mdc ← Svelte 5 complete docs
```

**Ensures:**
- Standards remain enforced
- Rules don't conflict
- Git operations require approval
- American English spelling
- No `any` types, no console.log

#### 6. Task Command Organization (`.cursor/commands/`)
```
.cursor/commands/
├── Taskfile.yml               ← Root orchestration
├── founder/Taskfile.yml       ← High-level workflows
├── backend/Taskfile.yml       ← Backend operations
├── frontend/Taskfile.yml      ← Frontend operations
├── qa/Taskfile.yml            ← Testing commands
├── ops/Taskfile.yml           ← Environment management
└── shared/Taskfile.yml        ← Shared utilities
```

**Ensures:**
- No overlapping commands (like we just fixed!)
- Consistent naming (qa:*, backend:*, etc.)
- Clear hierarchy
- Commands referenced by vibes actually exist

---

## 🔀 Skill Ownership vs Vibe Ownership

### Task-Based Skills (`.claude-skills/skills.json`)

**Owned by:** Vibe Manager  
**Used by:** All vibes (referenced in task_commands field)

```json
{
  "name": "run-smoke-tests",
  "description": "Run all smoke tests",
  "instructions": "Execute: cd .cursor && task qa:smoke"
}
```

**Vibe Manager ensures:**
- Task command referenced actually exists
- Multiple vibes can reference same skill
- Skills.json stays synchronized with Task commands

### Knowledge-Based Skills (`.claude-skills/*_skill/SKILL.md`)

**Owned by:** Vibe Manager (directory structure, naming)  
**Used by:** Specific vibes (referenced in claude_skills field)

```
backend-debugging_skill/
├── SKILL.md         ← 10-phase debugging procedure
└── assets/          ← Supporting files
```

**Vibe Manager ensures:**
- Directory naming convention (_skill suffix)
- Skills assigned to vibes that use them
- README.md documents all knowledge skills

**Domain vibes ensure:**
- Skill content is accurate for their domain
- Procedures follow domain best practices

---

## 📐 Layering Principles

### Separation of Concerns

| Layer | Concern | Example |
|-------|---------|---------|
| **Layer 1 (base)** | Universal foundation | graphiti, sequential-thinking |
| **Layer 2 (domain)** | Domain-specific work | backend code, frontend UI |
| **Layer 3 (meta)** | Organization & structure | vibe definitions, skill organization |
| **Layer 4 (automation)** | Deterministic execution | Task commands, shell scripts |
| **Layer 5 (skills)** | Natural language workflows | Task skills, knowledge skills |

### Inheritance Hierarchy

```
base_vibe (universal)
    ↓ extends
┌───┴───┬───────┬────────┬────────────────┐
│       │       │        │                │
backend frontend qa    infra    vibe_manager
  ↓       ↓       ↓        ↓                ↓
Encore  Svelte  Tests  CI/CD    Vibes/Skills
```

### Tool Assignment Strategy

**Universal tools** (Layer 1):
- graphiti, context7, sequential-thinking
- Available to ALL vibes

**Domain tools** (Layer 2):
- encore-mcp → backend_vibe, qa_vibe
- playwright → frontend_vibe, qa_vibe
- svelte → frontend_vibe only
- github → backend_vibe, infra_vibe, qa_vibe, vibe_manager_vibe
- vercel → frontend_vibe, infra_vibe

**Meta tools** (Layer 3):
- graphiti (for org decisions)
- github (for repo structure)

---

## 🚀 Using Vibe Manager Vibe

### When to Load

Load `vibe_manager_vibe` when working on:
- Creating or updating vibe definitions
- Creating or organizing Claude skills
- Adding/configuring MCP tools
- Reorganizing Task commands
- Updating root documentation
- Managing founder rules
- Ensuring vibes/skills/MCPs are correctly organized

### Example Workflows

#### 1. Create New Vibe
```
"Load vibe_manager_vibe and create a security_vibe for auth/encryption work"

→ Searches Graphiti for vibe patterns
→ Creates vibes/security_vibe.json
→ Assigns relevant MCP tools (maybe auth0, vault)
→ Assigns Task commands (security:*)
→ Assigns skills (auth-debugging, encryption-helpers)
→ Updates vibes/README.md
→ Documents decision in Graphiti
```

#### 2. Consolidate Commands (What We Just Did!)
```
"Load vibe_manager_vibe and consolidate testing commands"

→ Analyzes all testing commands across entry points
→ Creates consolidated qa:* namespace
→ Updates .cursor/commands/qa/Taskfile.yml
→ Removes redundant founder:testing:* tasks
→ Updates all vibes' task_commands fields
→ Updates root package.json scripts
→ Updates CLAUDE.md documentation
→ Tests all commands
→ Documents consolidation in Graphiti
```

#### 3. Add MCP Tool
```
"Load vibe_manager_vibe and add Stripe MCP to backend_vibe"

→ Adds Stripe config to .cursor/mcp.json
→ Updates backend_vibe.json mcp_tools field
→ Documents tool purpose, when_to_use, key_operations
→ Updates vibes/README.md
→ Tests tool in backend_vibe context
→ Documents MCP assignment in Graphiti
```

#### 4. Create New Skill
```
"Load vibe_manager_vibe and create a database-migration skill"

→ Uses skill-creator skill for guidance
→ Decides: task-based or knowledge-based?
→ Creates skill in appropriate location
→ Assigns to backend_vibe and qa_vibe
→ Updates .claude-skills/README.md
→ Tests skill invocation
→ Documents in Graphiti
```

---

## 💡 Key Insights

### 1. **Vibe Manager is Meta-Layer**
- It manages the vibes themselves, not the domains they represent
- It organizes skills, not creates skill content
- It assigns MCP tools, not builds MCP servers (that's infra_vibe with mcp-builder)

### 2. **Clear Ownership Boundaries**
- **Code:** Domain vibes (backend_vibe, frontend_vibe)
- **Tests:** QA vibe executes, domain vibes implement
- **CI/CD:** Infra vibe
- **Organization:** Vibe Manager vibe

### 3. **Skills Have Dual Nature**
- **Task-based:** Simple mappings (natural language → Task command)
- **Knowledge-based:** Complex procedures (multi-phase debugging)

### 4. **MCP Tools Are Shared Resources**
- Registered once in mcp.json
- Assigned to multiple vibes based on need
- Example: playwright used by both frontend_vibe and qa_vibe

### 5. **Task Commands Are Deterministic**
- Vibes reference them, don't define them
- Task layer (Layer 4) is the single source of truth
- Skills wrap them in natural language

---

## 🎓 Learning Path

### For New Agents

1. **Start with base_vibe** - Understand universal tools and patterns
2. **Load domain vibe** - Get domain-specific context
3. **Use vibe_manager_vibe** - When organizing or creating infrastructure

### For This Session

We just used vibe_manager_vibe to:
- Consolidate 17+ testing commands → 8 core commands
- Remove redundant founder:testing:* tasks
- Update qa_vibe.json with new commands
- Update CLAUDE.md documentation
- Add Git Operations rule to founder_rules.mdc

This is a **perfect example** of vibe_manager_vibe's role: organizing the automation layer without touching service code.

---

**Last Updated:** 2025-11-09  
**Status:** Vibe Manager Vibe created and documented

