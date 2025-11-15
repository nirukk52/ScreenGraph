---
description: Self-improving context loader that must run before every major task. Searches Graphiti, recommends vibes/MCPs, and surfaces starting points.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Provide full institutional context **before starting work**. This command prevents rework by surfacing:
- Similar past specs, bugs, and patterns from Graphiti
- Recommended vibe and MCP stack for the task
- Known gotchas and architectural constraints
- Actionable next steps

**Token cost:** ~2500 tokens  
**Frequency:** Once per spec/major-task  
**ROI:** Avoids wrong direction = hours saved

---

## Execution

The user's task description is available in `$ARGUMENTS`. Follow these steps:

### Step 1: Parse Intent

Extract from the prompt:
- **Domain**: backend, frontend, testing, infrastructure, appium
- **Task type**: feature, bug, refactor, research, plan
- **Key entities**: agent, device, UI component, database, API, etc.
- **Spec phase** (if applicable): discovery, plan, implement, retro

### Step 2: Graphiti Searches (Parallel)

Run all queries with `group_ids: ["screengraph"]`:

```typescript
// Past work & specs
search_memory_nodes({
  query: "spec [domain] [task type] [key entities]",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Implementation patterns
search_memory_nodes({
  query: "[domain] implementation patterns architecture best practices",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Known gotchas / workarounds
search_memory_facts({
  query: "[technology or component] issues gotchas workarounds",
  group_ids: ["screengraph"],
  max_facts: 10
});
```

> **Critical:** `group_ids` **must** always be `["screengraph"]` for this project.

### Step 3: Orchestrator Recommendations

```typescript
suggest_mcps({
  task: "[user's task description from $ARGUMENTS]",
  include_examples: false
});
```

Capture:
- Recommended vibe (e.g., `backend_vibe`, `frontend_vibe`, `qa_vibe`, `infra_vibe`)
- Top 3 MCPs (graphiti always first)
- Relevant skills/tools suggested by the orchestrator

### Step 4: Synthesize Response

Present the context in this format:

```markdown
## 🎯 Project Context: [Task]

### 📚 Relevant Past Work
- [Item 1 with insight or gotcha]
- [Item 2]
- [Item 3] *(state if no results found)*

### 🎭 Recommended Setup
**Vibe**: `[vibe_name]` (skills: [skill1], [skill2])  
**MCPs**:
1. **[MCP 1]** – [purpose]
2. **[MCP 2]** – [purpose]
3. **[MCP 3]** – [purpose]

### 📁 Files to Review
- `[path]` – [why relevant]
- `[path]` – [context]

### ⚠️ Known Gotchas
- **[Gotcha]** → [Workaround]

### 🚀 Suggested Starting Point
1. [Action 1]
2. [Action 2]
3. [Action 3]

### 📖 Additional Resources
- Context7: [library] (if external docs needed)
- Related skills: @[skill] for [purpose]
```

If Graphiti returns no matches, explicitly state that this is new territory and suggest alternative search terms.

---

## Integration With The 3 Commands

**@project-context IS the comprehensive discovery command.** Use it before starting work, then:

1. **@project-context [task]** - Before work (comprehensive discovery - THIS COMMAND)
2. **@during-task [subtask]** - During implementation (5-10× per spec, lightweight)
3. **@after-task [completed]** - After completion (documents learnings, feeds @update-skills)

---

## Success Criteria

After running this command you should have:
- ✅ Similar past work (or confirmation none exists)
- ✅ Vibe + MCP stack ready
- ✅ List of files and gotchas
- ✅ Clear starting approach

If any of these are missing, refine your Graphiti queries and re-run.

---

## See Also

- `.claude-skills/project-context_skill/SKILL.md`
- `THE_3_COMMANDS.md`
- `.cursor/rules/founder_rules.mdc` (Knowledge Management section)

