# Vibe Ownership Map - Quick Reference

> **TL;DR:** What each vibe owns and is responsible for.

---

## 🎯 Quick Lookup

| Working On... | Load This Vibe |
|---------------|----------------|
| Fixing backend API endpoint | `backend_vibe` |
| Building frontend component | `frontend_vibe` |
| Writing/running tests | `qa_vibe` |
| Setting up CI/CD | `infra_vibe` |
| Creating new vibe/skill | `vibe_manager_vibe` |
| Consolidating Task commands | `vibe_manager_vibe` |
| Adding MCP tool to a vibe | `vibe_manager_vibe` |
| Updating CLAUDE.md | `vibe_manager_vibe` |

---

## 📁 Directory Ownership

```
/ScreenGraph/
│
├── backend/                    → backend_vibe
│   ├── agent/                  → backend_vibe
│   ├── run/                    → backend_vibe
│   ├── graph/                  → backend_vibe
│   └── **/*.test.ts            → backend_vibe writes, qa_vibe runs
│
├── frontend/                   → frontend_vibe
│   ├── src/routes/             → frontend_vibe
│   ├── src/lib/components/     → frontend_vibe
│   └── tests/e2e/              → qa_vibe
│
├── vibes/                      → vibe_manager_vibe
│   ├── *.json                  → vibe_manager_vibe
│   └── README.md               → vibe_manager_vibe
│
├── .claude-skills/             → vibe_manager_vibe
│   ├── skills.json             → vibe_manager_vibe
│   ├── README.md               → vibe_manager_vibe
│   └── *_skill/                → vibe_manager_vibe
│
├── .cursor/
│   ├── mcp.json                → vibe_manager_vibe
│   ├── Taskfile.yml            → vibe_manager_vibe (orchestration)
│   ├── commands/               → vibe_manager_vibe (structure)
│   │   ├── qa/Taskfile.yml     → qa_vibe (content), vibe_manager (org)
│   │   ├── backend/Taskfile.yml → backend_vibe (content), vibe_manager (org)
│   │   └── ...
│   └── rules/
│       └── founder_rules.mdc   → vibe_manager_vibe
│
├── .github/workflows/          → infra_vibe
├── .husky/                     → infra_vibe
│
├── CLAUDE.md                   → vibe_manager_vibe
├── README.md                   → vibe_manager_vibe
├── WHAT_WE_ARE_MAKING.md       → vibe_manager_vibe
├── ARCHITECTURE_*.md           → vibe_manager_vibe
├── TESTING_*.md                → vibe_manager_vibe
└── *_HANDOFF.md                → vibe_manager_vibe
```

---

## 🔧 MCP Tool Ownership

| MCP Tool | Assigned To | Why |
|----------|-------------|-----|
| `graphiti` | ALL (via base_vibe) | Universal knowledge graph |
| `context7` | ALL (via base_vibe) | Universal documentation |
| `sequential-thinking` | ALL (via base_vibe) | Universal reasoning |
| `encore-mcp` | backend_vibe, qa_vibe | Backend API introspection |
| `playwright` | frontend_vibe, qa_vibe | Browser automation |
| `svelte` | frontend_vibe | Svelte 5 docs |
| `figma` | frontend_vibe | Design integration |
| `github` | backend_vibe, infra_vibe, qa_vibe, vibe_manager_vibe | Repo management |
| `vercel` | frontend_vibe, infra_vibe | Deployment |

---

## 📜 Skill Ownership

### Task-Based Skills (skills.json)
**Owned by:** vibe_manager_vibe  
**Used by:** All vibes (via task_commands field)

Examples:
- `start-dev-environment` → Used by all vibes
- `run-smoke-tests` → Used by qa_vibe
- `regenerate-encore-client` → Used by backend_vibe, frontend_vibe

### Knowledge-Based Skills (*_skill/SKILL.md)
**Owned by:** vibe_manager_vibe (organization)  
**Content by:** Domain experts (but vibe_manager ensures structure)

| Skill | Assigned To | Purpose |
|-------|-------------|---------|
| `backend-debugging` | backend_vibe | 10-phase Encore.ts debugging |
| `frontend-debugging` | frontend_vibe | 10-phase SvelteKit debugging |
| `webapp-testing` | qa_vibe, frontend_vibe | Playwright testing playbook |
| `backend-testing` | qa_vibe | Backend test strategies |
| `skill-creator` | vibe_manager_vibe, infra_vibe | Create new skills |
| `mcp-builder` | vibe_manager_vibe, infra_vibe | Create MCP servers |
| `graphiti-mcp-usage` | ALL vibes | Document decisions |

---

## 🎭 Vibe Responsibilities Summary

### base_vibe
- ✅ Provide universal tools to all vibes
- ✅ Define core workflow patterns
- ❌ Never touches domain code

### backend_vibe
- ✅ Own backend/ directory
- ✅ Backend services, APIs, database
- ✅ Write backend tests
- ❌ Never touches frontend code
- ❌ Never touches vibe definitions

### frontend_vibe
- ✅ Own frontend/ directory
- ✅ SvelteKit routes, Svelte components
- ✅ Frontend styling and UX
- ❌ Never touches backend code
- ❌ Never touches vibe definitions

### qa_vibe
- ✅ Run all tests (smoke, unit, E2E)
- ✅ Own QA Task commands (qa:*)
- ✅ Own test infrastructure
- ❌ Doesn't write backend/frontend code
- ❌ Doesn't own test files (just runs them)

### infra_vibe
- ✅ CI/CD pipelines (.github/workflows/)
- ✅ Git hooks (.husky/)
- ✅ Deployment configs
- ✅ Create MCP servers (mcp-builder skill)
- ❌ Doesn't touch service code
- ❌ Doesn't define vibes/skills

### vibe_manager_vibe ⭐
- ✅ All vibe definitions (vibes/)
- ✅ All skill definitions (.claude-skills/)
- ✅ MCP registry (.cursor/mcp.json)
- ✅ Root documentation
- ✅ Founder rules
- ✅ Task command organization
- ❌ NEVER touches service code (backend/frontend/)
- ❌ NEVER writes tests (qa_vibe runs them)
- ❌ NEVER touches CI/CD (infra_vibe owns)

---

## 🔄 Common Workflows by Vibe

### Backend Work → Load backend_vibe
```
"Load backend_vibe and add new agent node"
"Load backend_vibe and optimize graph projector"
"Load backend_vibe and fix database query"
```

### Frontend Work → Load frontend_vibe
```
"Load frontend_vibe and build navigation component"
"Load frontend_vibe and fix run page layout"
"Load frontend_vibe and add dark mode"
```

### Testing Work → Load qa_vibe
```
"Load qa_vibe and write E2E test for run flow"
"Load qa_vibe and debug failing smoke tests"
"Load qa_vibe and run complete test suite"
```

### DevOps Work → Load infra_vibe
```
"Load infra_vibe and set up GitHub Actions"
"Load infra_vibe and configure Vercel deployment"
"Load infra_vibe and create Stripe MCP server"
```

### Meta Work → Load vibe_manager_vibe
```
"Load vibe_manager_vibe and create security_vibe"
"Load vibe_manager_vibe and consolidate testing commands"
"Load vibe_manager_vibe and add Stripe MCP to backend_vibe"
"Load vibe_manager_vibe and reorganize skills by domain"
```

---

## ⚠️ Critical Rules

### What Vibe Manager NEVER Does

1. ❌ **NEVER modify service code** (backend/, frontend/)
   - That's for domain vibes
   
2. ❌ **NEVER write test implementations**
   - QA vibe runs tests, domain vibes write them
   
3. ❌ **NEVER touch CI/CD configs** (.github/workflows/, .husky/)
   - That's infra_vibe territory
   
4. ❌ **NEVER create MCP servers**
   - That's infra_vibe with mcp-builder skill
   - Vibe Manager only assigns tools to vibes

### What Vibe Manager ALWAYS Does

1. ✅ **Maintain vibe consistency**
   - All vibes extend base_vibe
   - MCP tools assigned based on domain
   
2. ✅ **Keep documentation synchronized**
   - Vibes match actual capabilities
   - Skills reference real Task commands
   - Docs reflect current state

3. ✅ **Document organizational decisions**
   - Use Graphiti for vibe design choices
   - Capture skill organization patterns
   - Record MCP assignment rationale

---

## 📚 See Also

- **Complete Architecture:** `VIBE_LAYERING_ARCHITECTURE.md`
- **Vibe System Guide:** `vibes/README.md`
- **Skills Documentation:** `.claude-skills/README.md`
- **Task Commands:** `.cursor/commands/README.md`
- **Project Reference:** `CLAUDE.md`

---

**Last Updated:** 2025-11-09  
**Created:** As part of testing command consolidation effort

