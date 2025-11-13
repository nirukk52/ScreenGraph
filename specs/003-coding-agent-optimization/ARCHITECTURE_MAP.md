# ScreenGraph Architecture Connection Map

**How all the layers connect together.**

---

## 🗺️ The Complete Stack (Bottom to Top)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 7: USER INTERFACE (What You Type)                       │
│  ────────────────────────────────────────────────────────────── │
│  @before-task [task]                                            │
│  @during-task [subtask]                                         │
│  @after-task [completed]                                        │
│  /speckit.specify                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 6: CURSOR COMMANDS (What Gets Executed)                 │
│  ────────────────────────────────────────────────────────────── │
│  .cursor/commands/before-task.md                                │
│  .cursor/commands/during-task.md                                │
│  .cursor/commands/after-task.md                                 │
│  .specify/commands/speckit.*.md                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: CLAUDE SKILLS (Workflow Logic)                       │
│  ────────────────────────────────────────────────────────────── │
│  .claude-skills/before-task_skill/SKILL.md                      │
│  .claude-skills/during-task_skill/SKILL.md                      │
│  .claude-skills/after-task_skill/SKILL.md                       │
│  .claude-skills/graphiti-mcp-usage_skill/SKILL.md               │
│  .claude-skills/backend-debugging_skill/SKILL.md                │
│  .claude-skills/mcp-builder_skill/SKILL.md                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: MCP ORCHESTRATOR (Intelligent Routing)               │
│  ────────────────────────────────────────────────────────────── │
│  .mcp-servers/screengraph-orchestrator/server.py                │
│    ├── VIBE_MAPPING (reads vibes/*.json conceptually)          │
│    ├── MCP_REGISTRY (knows all 11 MCPs)                        │
│    ├── TASK_PATTERNS (keywords → MCPs)                         │
│    └── Tools: suggest_mcps(), get_mcp_details()                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: VIBES (Engineering Personas)                         │
│  ────────────────────────────────────────────────────────────── │
│  vibes/base_vibe.json         (graphiti, context7, sequential) │
│  vibes/backend_vibe.json      (encore-mcp, github)             │
│  vibes/frontend_vibe.json     (svelte, browser, figma)         │
│  vibes/qa_vibe.json           (browser, encore-mcp)            │
│  vibes/infra_vibe.json        (aws-api, vercel)                │
│                                                                 │
│  Each vibe defines:                                             │
│    • Which MCPs to use                                          │
│    • Which skills are available                                 │
│    • Domain-specific rules                                      │
│    • Workflows and patterns                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: MCP SERVERS (Actual Tools)                           │
│  ────────────────────────────────────────────────────────────── │
│  Configured in: ~/.cursor/mcp.json                              │
│                                                                 │
│  1. graphiti              (knowledge graph)                     │
│  2. context7              (library docs)                        │
│  3. sequential-thinking   (reasoning)                           │
│  4. encore-mcp            (backend introspection)               │
│  5. browser/playwright    (frontend testing)                    │
│  6. svelte                (Svelte 5 docs)                       │
│  7. figma                 (design to code)                      │
│  8. aws-knowledge-mcp     (AWS docs)                            │
│  9. aws-api-mcp           (AWS CLI)                             │
│  10. vercel               (deployment)                          │
│  11. better-auth          (auth docs)                           │
│  12. screengraph-orchestrator (meta-router) ← NEW!              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: KNOWLEDGE BASE (Institutional Memory)                │
│  ────────────────────────────────────────────────────────────── │
│  Graphiti Knowledge Graph                                       │
│    • group_id: "screengraph" (project isolation)                │
│    • Stores: specs, bugs, patterns, gotchas, decisions         │
│    • Grows: Every @after-task adds knowledge                    │
│    • Searched: Every @before-task queries it                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 The Connection Flow

### When You Type: `@before-task Fix agent stalling`

```
YOU type in Cursor chat
  ↓
Cursor loads: .cursor/commands/before-task.md
  ↓
Command file instructs Claude to:
  1. Load .claude-skills/before-task_skill/SKILL.md (workflow)
  2. Search Graphiti (Layer 1) with group_id="screengraph"
  3. Call screengraph-orchestrator (Layer 2) → suggest_mcps()
  ↓
Orchestrator reads VIBE_MAPPING:
  - "Fix agent" → backend category
  - Backend → backend_vibe
  - Backend vibe → MCPs: graphiti, encore-mcp, sequential-thinking
  ↓
Orchestrator returns to Claude:
  - Vibe: backend_vibe
  - Skills: backend-debugging, backend-development
  - MCPs: graphiti, encore-mcp, sequential-thinking
  ↓
Claude combines:
  - Graphiti search results (past solutions)
  - Orchestrator recommendations (vibe + MCPs)
  - before-task skill workflow (how to present it)
  ↓
YOU get comprehensive context:
  - Past work from Graphiti
  - Which vibe to use
  - Which MCPs to use
  - Actionable starting points
```

---

## 📚 Layer Responsibilities

### Layer 1: Knowledge Base (Graphiti)
**Purpose:** Store institutional memory  
**Contains:** Past specs, bugs, patterns, gotchas, architectural decisions  
**Accessed by:** @before-task (search), @after-task (write)  
**group_id:** Always `"screengraph"` for project isolation  

### Layer 2: MCP Servers
**Purpose:** Provide actual tools and capabilities  
**Configured in:** `~/.cursor/mcp.json`  
**Examples:** graphiti, encore-mcp, svelte, browser, aws-api-mcp  
**Special:** screengraph-orchestrator is a meta-MCP that routes to other MCPs  

### Layer 3: Vibes (Engineering Personas)
**Purpose:** Define domain-specific tool combinations and workflows  
**Files:** `vibes/*.json`  
**Structure:** Each vibe specifies MCPs, skills, rules, workflows  
**Inheritance:** All extend base_vibe (graphiti, context7, sequential-thinking)  

### Layer 4: MCP Orchestrator
**Purpose:** Intelligently route tasks to right MCPs and vibes  
**File:** `.mcp-servers/screengraph-orchestrator/server.py`  
**Knows:** VIBE_MAPPING (which vibe for which task), MCP_REGISTRY (all 11 MCPs)  
**Returns:** Vibe name + top 3 MCPs + skills available  

### Layer 5: Claude Skills
**Purpose:** Define AI workflows and procedures  
**Files:** `.claude-skills/*_skill/SKILL.md`  
**Examples:** before-task, during-task, after-task, backend-debugging, mcp-builder  
**Referenced by:** Cursor commands and vibes  

### Layer 6: Cursor Commands
**Purpose:** Make skills invocable via @ and / syntax  
**Files:** `.cursor/commands/*.md` and `.specify/commands/speckit.*.md`  
**Examples:** `@before-task`, `/speckit.specify`  
**Loads:** Skills from Layer 5, calls MCPs from Layer 2  

### Layer 7: User Interface
**Purpose:** What you actually type  
**Examples:** `@before-task Fix bug`, `/speckit.specify "Feature"`  
**Convenience:** @ for skills, / for spec-kit commands  

---

## 🎯 Key Connections

### 1. Vibes → Orchestrator
```
vibes/backend_vibe.json DEFINES:
  - MCPs: encore-mcp, github
  - Skills: backend-debugging, backend-development

screengraph-orchestrator/server.py READS:
  VIBE_MAPPING["backend"] = {
    "vibe": "backend_vibe",
    "skills": ["backend-debugging", "backend-development"],
    "primary_mcps": ["graphiti", "encore-mcp", "sequential-thinking"]
  }

When you run @before-task with backend task:
  → Orchestrator suggests: backend_vibe + those MCPs + those skills
```

**Connection makes sense?** ✅ YES - Orchestrator understands vibes layer

### 2. Commands → Skills
```
.cursor/commands/before-task.md (Cursor command) INSTRUCTS:
  "Load .claude-skills/before-task_skill/SKILL.md
   Follow its workflow
   Execute Graphiti searches
   Call orchestrator"

.claude-skills/before-task_skill/SKILL.md (Skill) DEFINES:
  "Search Graphiti with these 3 queries
   Call suggest_mcps()
   Present results in this format"
```

**Connection makes sense?** ✅ YES - Commands invoke skills, skills define workflows

### 3. Orchestrator → mcp.json
```
~/.cursor/mcp.json CONFIGURES:
  - graphiti: SSE transport to Graphiti service
  - encore-mcp: Command to run Encore MCP
  - svelte: URL to Svelte docs MCP
  - ... 11 MCPs total

screengraph-orchestrator KNOWS:
  MCP_REGISTRY = {
    "graphiti": {...},
    "encore-mcp": {...},
    "svelte": {...}
  }

When orchestrator suggests MCPs:
  → It knows they exist in mcp.json
  → It can recommend them confidently
```

**Connection makes sense?** ✅ YES - Orchestrator registry matches available MCPs

### 4. Skills → Best Practices
```
.claude-skills/mcp-builder_skill/SKILL.md SAYS:
  "To build an MCP, follow 4-phase process"

.claude-skills/mcp-builder_skill/reference/mcp_best_practices.md PROVIDES:
  - Server naming conventions
  - Tool design guidelines
  - Response formats
  - Security best practices

When you say "Create new MCP":
  → @mcp-builder_skill loads
  → References best_practices.md as needed
  → Follows structured process
```

**Connection makes sense?** ✅ YES - Skills reference best practices docs

### 5. THE_3_COMMANDS.md → Everything
```
THE_3_COMMANDS.md (Quick ref) DOCUMENTS:
  - When to call @before/during/after-task
  - Token costs
  - Integration with spec-kit
  - Examples

START_HERE.md (Complete guide) EXPLAINS:
  - Full architecture stack
  - How commands connect
  - Token analysis
  - Workflows

.cursor/commands/*.md (Commands) IMPLEMENT:
  - Actual execution logic
  - Calls to Graphiti
  - Calls to orchestrator
```

**Connection makes sense?** ✅ YES - Documentation → Commands → Execution

---

## 🎭 Complete Data Flow Example

### Scenario: "Fix Agent Stalling Bug"

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER TYPES                                                   │
│ @before-task Fix agent stalling on device connection           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        v
┌─────────────────────────────────────────────────────────────────┐
│ 2. CURSOR LOADS COMMAND                                         │
│ .cursor/commands/before-task.md                                 │
│   → Instructions for Claude on what to do                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        v
┌─────────────────────────────────────────────────────────────────┐
│ 3. SKILL LOADED                                                 │
│ .claude-skills/before-task_skill/SKILL.md                       │
│   → Workflow: Search Graphiti + Call orchestrator + Format     │
└───────────┬────────────────────────────┬────────────────────────┘
            │                            │
            v                            v
┌───────────────────────┐    ┌──────────────────────────────────┐
│ 4a. SEARCH GRAPHITI   │    │ 4b. CALL ORCHESTRATOR            │
│ (MCP Layer)           │    │ (MCP Layer)                      │
│                       │    │                                  │
│ Graphiti MCP          │    │ screengraph-orchestrator MCP     │
│ ↓                     │    │ ↓                                │
│ search_memory_nodes({ │    │ suggest_mcps({                   │
│   query: "agent       │    │   task: "Fix agent stalling"     │
│     stalling",        │    │ })                               │
│   group_ids:          │    │ ↓                                │
│     ["screengraph"]   │    │ Reads VIBE_MAPPING:              │
│ })                    │    │   "agent" → backend category     │
│ ↓                     │    │   Backend → backend_vibe         │
│ Returns: BUG-015      │    │ ↓                                │
│   solution, past      │    │ Reads vibes/backend_vibe.json    │
│   gotchas             │    │   (conceptually)                 │
│                       │    │ ↓                                │
│                       │    │ Returns:                         │
│                       │    │   Vibe: backend_vibe             │
│                       │    │   Skills: backend-debugging      │
│                       │    │   MCPs: graphiti, encore-mcp,    │
│                       │    │         sequential-thinking      │
└───────────┬───────────┘    └──────────────┬───────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            v
┌─────────────────────────────────────────────────────────────────┐
│ 5. CLAUDE SYNTHESIZES                                           │
│ Combines:                                                       │
│   • Graphiti results (BUG-015 found similar issue!)            │
│   • Orchestrator recs (backend_vibe, 3 MCPs, skills)           │
│   • Skill workflow (before-task presentation format)           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        v
┌─────────────────────────────────────────────────────────────────┐
│ 6. YOU GET RESPONSE                                             │
│                                                                 │
│ ## 🎯 Before-Task Context: Fix agent stalling                  │
│                                                                 │
│ ### 📚 Similar Past Work                                        │
│ - BUG-015: Agent stalls on privacy consent dialogs             │
│   Solution: Pre-flight dialog detection                        │
│   Gotcha: Must check BEFORE starting policy execution          │
│                                                                 │
│ ### 🎭 Recommended Setup                                        │
│ Vibe: backend_vibe (skills: backend-debugging, backend-dev)    │
│ MCPs:                                                           │
│   1. graphiti - Search for past solutions                      │
│   2. encore-mcp - Inspect backend state                        │
│   3. sequential-thinking - Systematic debugging                │
│                                                                 │
│ ### 📁 Files to Review                                          │
│ - backend/agent/nodes/setup/EnsureDevice/device-check.ts       │
│                                                                 │
│ ### ⚠️ Known Gotchas                                            │
│ - WebDriver sessions timeout silently (set explicit timeouts)  │
│ - Pre-flight checks must run before policy execution           │
│                                                                 │
│ ### 🚀 Suggested Approach                                       │
│ 1. Review BUG-015 solution in device-check.ts                  │
│ 2. Add checkpoint logs to narrow hang location                 │
│ 3. Verify WebDriver session is alive                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Connection Validation

### ✅ Does Each Layer Make Sense?

| Layer | Purpose | Connects To | Makes Sense? |
|-------|---------|-------------|--------------|
| **User Interface** | What you type | Cursor commands | ✅ Simple @ and / syntax |
| **Cursor Commands** | Execution instructions | Claude skills | ✅ Markdown files Cursor understands |
| **Claude Skills** | Workflow logic | MCPs + vibes | ✅ Skills orchestrate tools |
| **MCP Orchestrator** | Intelligent routing | Vibes + MCPs | ✅ Knows what's available |
| **Vibes** | Domain config | MCPs + skills | ✅ Define domain setups |
| **MCP Servers** | Actual tools | External services | ✅ Do the real work |
| **Knowledge Base** | Institutional memory | Graphiti | ✅ Persistent learning |

### ✅ Are There Redundancies?

| What | Where | Redundant? |
|------|-------|------------|
| **MCP list** | mcp.json + orchestrator registry | ✅ **Necessary** - mcp.json configures, orchestrator suggests |
| **Vibes** | vibes/*.json + orchestrator VIBE_MAPPING | ✅ **Necessary** - vibes are source of truth, orchestrator reads conceptually |
| **Skills** | .claude-skills/ + .cursor/commands/ | ✅ **Necessary** - skills are workflows, commands invoke them |
| **Documentation** | THE_3_COMMANDS.md + START_HERE.md + SKILL.md files | ✅ **Necessary** - Quick ref vs complete guide vs execution logic |

**NO unnecessary redundancy. Each piece has a purpose.**

---

## 🎯 Dependency Graph

```
mcp.json (MCP configurations)
    ↓
    ├─→ graphiti, context7, sequential-thinking (used by ALL vibes)
    ├─→ encore-mcp, github (used by backend_vibe)
    ├─→ svelte, browser, figma (used by frontend_vibe)
    └─→ screengraph-orchestrator (uses ALL)
         ↓
         Reads VIBE_MAPPING (based on vibes/*.json)
         ↓
         Returns: vibe name + MCPs + skills
              ↓
              Used by: before-task + during-task skills
                   ↓
                   Invoked via: .cursor/commands/ files
                        ↓
                        YOU type: @before-task / @during-task / @after-task
```

---

## 💡 Why This Architecture?

### Separation of Concerns

| Layer | Concern | Why Separate? |
|-------|---------|---------------|
| **mcp.json** | MCP configuration | Infrastructure setup, credentials, connection details |
| **vibes/** | Domain config | Backend vs frontend have different tool needs |
| **Orchestrator** | Intelligent routing | Don't hard-code "use encore-mcp for backend" everywhere |
| **Skills** | Workflows | Reusable procedures, not tied to specific MCPs |
| **Commands** | User interface | @ syntax for skills, / for spec-kit |
| **Graphiti** | Knowledge storage | Persistent memory across sessions |

### Information Flow

```
Static Config (mcp.json, vibes/*.json)
  ↓
Dynamic Router (orchestrator)
  ↓
Workflow Orchestration (skills)
  ↓
User Commands (@before-task)
  ↓
Knowledge Accumulation (Graphiti)
  ↓
Future Tasks Benefit (self-improvement)
```

---

## ✅ DOES THE CONNECTION MAKE SENSE?

### **YES! Here's Why:**

1. **Clear separation of concerns** - Each layer has one job
2. **No circular dependencies** - Clean top-to-bottom flow
3. **Composable** - Layers build on each other naturally
4. **Self-documenting** - Each layer references the next
5. **Maintainable** - Change one layer without breaking others
6. **Extensible** - Add new MCPs/vibes/skills without restructuring

### **Potential Improvements:**

| What | Current State | Could Improve |
|------|---------------|---------------|
| **Orchestrator ↔ Vibes sync** | Manual (VIBE_MAPPING hardcoded) | Auto-read vibes/*.json files |
| **MCP availability check** | Heuristic (can't ping MCPs) | Actually check ~/.cursor/mcp.json |
| **Effectiveness tracking** | Manual (user calls track_effectiveness) | Auto-track from @after-task |

**But these are optimizations, not fundamental issues.**

---

## 🎬 The Big Picture

```
You built a LAYERED SYSTEM where:

1. Knowledge compounds (Graphiti)
2. Tools are intelligently routed (Orchestrator)
3. Domains have purpose-built setups (Vibes)
4. Workflows are reusable (Skills)
5. Everything is accessible via simple commands (@before-task)

Each layer makes the layer above it more powerful.
The stack is coherent, not accidental.
```

---

## 📖 Reference Map

| If You Want To... | Look Here |
|-------------------|-----------|
| **Use the system** | THE_3_COMMANDS.md (quick ref) |
| **Understand architecture** | This file (ARCHITECTURE_MAP.md) |
| **Learn workflows** | START_HERE.md (complete guide) |
| **Configure MCPs** | ~/.cursor/mcp.json |
| **Create new vibe** | vibes/README.md |
| **Create new skill** | @skill-creator_skill |
| **Create new MCP** | @mcp-builder_skill |
| **Spec-kit integration** | .specify/WORKFLOW.md |
| **See enforcement** | .cursor/rules/founder_rules.mdc |

---

**The connections are intentional, coherent, and production-ready.** ✅

**Last Updated**: 2025-11-13

