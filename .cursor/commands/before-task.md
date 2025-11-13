---
description: Comprehensive discovery before starting any spec or major task. Searches Graphiti, recommends vibe/MCPs, surfaces patterns.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Load comprehensive context BEFORE starting any major work. This command prevents you from going in the wrong direction by surfacing:
- Similar past specs and solutions from Graphiti
- Recommended vibe and MCPs for this task
- Architecture patterns and constraints
- Known gotchas to avoid
- Actionable starting points

**Token cost:** ~2500 tokens  
**Frequency:** Once per spec/major-task  
**ROI:** Prevents wrong direction = saves hours

---

## Execution

The user provided a task description in `$ARGUMENTS`. Follow these steps:

### Step 1: Parse Intent

Extract from the task description:
- **Domain**: backend, frontend, testing, infrastructure, appium
- **Task type**: feature, bug, refactor, spec, research, plan
- **Key entities**: agent, device, UI component, database, API, etc.
- **Spec phase** (if applicable): discovery, planning, implementation

### Step 2: Search Graphiti (Parallel Queries)

Run these searches in parallel using `group_ids: ["screengraph"]`:

```typescript
// Query 1: Past specs in this domain
search_memory_nodes({
  query: "spec [domain] [feature-type] [key-entities]",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Query 2: Implementation patterns
search_memory_nodes({
  query: "[domain] implementation patterns best practices architecture",
  group_ids: ["screengraph"],
  max_nodes: 10
});

// Query 3: Known gotchas
search_memory_facts({
  query: "[technology/component] gotchas workarounds issues problems",
  group_ids: ["screengraph"],
  max_facts: 10
});
```

**CRITICAL**: Always use `group_ids: ["screengraph"]` - this is the ScreenGraph project identifier.

### Step 3: Get MCP Recommendations

Call the orchestrator:

```typescript
suggest_mcps({
  task: "[user's task description from $ARGUMENTS]",
  include_examples: false  // Brief mode
});
```

This returns:
- Recommended vibe (backend_vibe, frontend_vibe, qa_vibe, infra_vibe)
- Top 3 MCPs prioritized
- Skills available in that vibe

### Step 4: Synthesize and Present

Present the results in this format:

```markdown
## 🎯 Before-Task Context: [Task Description]

### 📚 Similar Past Work

[If Graphiti found results:]
- **[Spec/Bug Number]**: [Title] - [Key learning or gotcha]
- **[Pattern]**: [What was learned]
- **[Related work]**: [Relevant insights]

[If Graphiti found nothing:]
- No similar past work found in Graphiti (this is new territory!)
- Suggested searches for related topics: [list 2-3 related search terms]

### 🎭 Recommended Setup

**Vibe**: `[vibe_name]` (skills: [skill1], [skill2])

**MCPs to use:**
1. **[MCP 1]** - [Brief purpose]
2. **[MCP 2]** - [Brief purpose]
3. **[MCP 3]** - [Brief purpose]

### 📁 Files to Review

[Based on Graphiti results and domain:]
- `[file path]` - [Why relevant based on past work]
- `[file path]` - [Why relevant]

[If no specific files found:]
- Suggested starting points: [common files for this domain]

### ⚠️ Known Gotchas

[From Graphiti search_memory_facts:]
- **[Gotcha 1]**: [Issue] → [Workaround]
- **[Gotcha 2]**: [Issue] → [Workaround]

[If none found:]
- No known gotchas documented yet (you're pioneering!)

### 🚀 Suggested Approach

Based on past patterns and domain best practices:
1. [Step 1 from past solutions or standard pattern]
2. [Step 2]
3. [Step 3]

### 📖 Additional Resources

[If external library docs needed:]
- Context7: [library-name] - [topic]

[List relevant skills:]
- Use `@[skill-name]` for: [purpose]

---

**Next steps:**
- Review similar past work above
- If adaptable → Reuse patterns
- If new → Proceed with /speckit.specify or implementation
- Document learnings with @after-task when complete
```

---

## Important Notes

1. **This is the heavy command** - It does comprehensive Graphiti searches. Don't call this multiple times during implementation (use @during-task for that).

2. **Always check Graphiti first** - Even if you think the problem is new, search anyway. Past solutions might exist.

3. **group_id must always be "screengraph"** - Never use a different group_id.

4. **Be specific in searches** - Better to search for "agent timeout recovery" than just "agent".

---

## Success Criteria

After running this command, you should have:
- ✅ Clear understanding if similar work exists
- ✅ Know which vibe + MCPs to use
- ✅ List of files to review
- ✅ Awareness of gotchas
- ✅ Actionable starting point

**If you don't have these, the search queries need refinement.**

---

## Integration with Spec-Kit

```bash
# User workflow:
@before-task Research real-time updates for run status

# This command runs (searches Graphiti, gets MCPs)
# Returns comprehensive context

# Then user proceeds:
/speckit.specify "Real-time run status updates via SSE"
```

---

## See Also

- **Full documentation**: `.claude-skills/before-task_skill/SKILL.md`
- **Quick reference**: `THE_3_COMMANDS.md`
- **Workflow guide**: `.specify/WORKFLOW.md`


