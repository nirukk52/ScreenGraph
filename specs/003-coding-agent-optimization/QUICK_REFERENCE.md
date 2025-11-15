# Skills vs Commands: Quick Reference

**1-Page Visual Guide for ScreenGraph Development**

---

## 📊 What's What?

| Component | Type | When | Cost |
|-----------|------|------|------|
| `*.md` in `.cursor/commands/` | **EXECUTABLE** command | Run via `@command-name` | Varies |
| `SKILL.md` in `.claude-skills/` | **KNOWLEDGE** guide | AI loads automatically | N/A |
| `skills.json` | Router/Registry | AI discovers skills | N/A |

**Key Insight**: Commands EXECUTE workflows. Skills EXPLAIN procedures.

---

## 🎯 The 3-Command System

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

    ┌─────────────────────┐
    │   @project-context  │  ← BEFORE work (2500 tokens)
    │   [describe task]   │    Searches Graphiti, recommends tools
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │   Implement tasks   │
    │   from tasks.md     │
    └──────────┬──────────┘
               │
               ├──→ @during-task [subtask 1]  (300 tokens)
               │
               ├──→ @during-task [subtask 2]  (300 tokens)
               │
               ├──→ @during-task [subtask 3]  (300 tokens)
               │
               └──→ ... (5-10 times total)
               │
               ▼
    ┌─────────────────────┐
    │    @after-task      │  ← AFTER completion (600 tokens)
    │  [what completed]   │    Documents in Graphiti (MANDATORY)
    └─────────────────────┘

TOTAL PER SPEC: ~5000 tokens (~$0.015) = Saves 20 hours
```

---

## 🌲 Decision Tree

```
Are you starting new work?
│
├─ YES ──→ @project-context [task description]
│          └─ Returns: past work, files, gotchas, MCPs
│
├─ Implementing subtasks? 
│   └─→ @during-task [specific subtask]
│       └─ Call 5-10× (300 tokens each)
│       └─ Auto-switches vibes (backend/frontend/qa)
│
├─ Finished work?
│   └─→ @after-task [what you completed]
│       └─ MANDATORY - documents for future
│       └─ Fills add_memory() template
│
└─ Library upgraded?
    └─→ @update-skills
        └─ Monthly/quarterly only
```

---

## ⚡ Cheat Sheet for .specify Workflow

### Phase 1: Discovery
```bash
# MANDATORY: Load context before starting
@project-context Research [feature idea]
# Reviews past work, recommends approach

# If new → Create spec
/speckit.specify "[feature name]"
```

### Phase 2: Planning
```bash
/speckit.plan
# Generates: plan.md, tasks.md, acceptance.md
```

### Phase 3: Implementation
```bash
# For each task in tasks.md:
@during-task [task 1 description]
# ... code ...

@during-task [task 2 description]
# ... code ...

@during-task [task 3 description]
# ... code ...

# Repeat 5-10 times total
```

### Phase 4: Completion
```bash
# Tests pass, pre-push succeeds
git push origin spec-XXX

@after-task Completed spec-XXX [title]
# Fill in template, execute add_memory()
```

### Phase 5: Retrospective
```bash
/speckit.retro
# Reflect on process
```

---

## 💰 Token Budget

```
Minimal Approach:
  @project-context     2,500 tokens
  @during-task × 6     1,800 tokens
  @after-task            600 tokens
  ─────────────────────────────────
  TOTAL:               4,900 tokens ($0.015)

Comprehensive Approach:
  @project-context     2,500 tokens
  @during-task × 15    4,500 tokens
  @after-task            600 tokens
  ─────────────────────────────────
  TOTAL:               7,600 tokens ($0.023)

ROI: $0.02 prevents 20 hours rework = 133,000× return
```

---

## 🎭 Vibe Auto-Switching

```
@during-task Create database migration     → backend_vibe
@during-task Build UI component           → frontend_vibe
@during-task Write E2E test               → qa_vibe

✅ Automatic - just describe the subtask!
```

---

## ✅ Quick Rules

**DO:**
- ✅ Run `@project-context` before EVERY major task
- ✅ Use `@during-task` frequently (5-10× per spec)
- ✅ ALWAYS run `@after-task` when done (mandatory!)
- ✅ Be specific in subtask descriptions

**DON'T:**
- ❌ Skip `@project-context` (miss critical context)
- ❌ Skip `@after-task` (knowledge lost forever)
- ❌ Use `@during-task` for trivial changes
- ❌ Make subtasks too broad

---

## 📖 Where to Find Full Details

| Need | Location |
|------|----------|
| Command execution details | `.cursor/commands/[command].md` |
| Full procedural guides | `.claude-skills/[skill]_skill/SKILL.md` |
| All available skills | `.claude-skills/skills.json` |
| Vibe system | `vibes/README.md` |
| Complete lifecycle | `specs/003-coding-agent-optimization/COMPLETE_LIFECYCLE.md` |

---

**Last Updated**: 2025-11-14  
**File**: `specs/003-coding-agent-optimization/QUICK_REFERENCE.md`

