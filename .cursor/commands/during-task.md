---
description: Lightweight tactical guidance during implementation. Just MCP suggestions and quick lookups.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Provide lightweight, tactical guidance during implementation. This command is designed to be called MULTIPLE TIMES (5-10× per spec) without burning tokens.

**Token cost:** ~300 tokens  
**Frequency:** 5-10 times per spec  
**ROI:** Stays on track = prevents rework

---

## Execution

The user provided a specific subtask in `$ARGUMENTS`. This should be a FOCUSED subtask, not a broad feature.

### Step 1: Validate Scope

Check if the task is appropriately scoped:

**Good examples** (specific):
- "Add password validation logic"
- "Create login form component"
- "Write unit test for auth endpoint"
- "Update UI to show connection status"

**Bad examples** (too broad):
- "Implement entire authentication feature" ← Use @before-task instead!
- "Build the whole frontend" ← Too broad!

If too broad, suggest using @before-task instead.

### Step 2: Get MCP Suggestions

Call the orchestrator:

```typescript
suggest_mcps({
  task: "[user's subtask from $ARGUMENTS]",
  include_examples: false  // MUST be false for brevity
});
```

### Step 3: Optional Quick Lookup (ONLY if user seems stuck)

If the user's subtask mentions a specific issue or technology where they might be stuck:

```typescript
search_memory_facts({
  query: "[specific technology/component] [specific issue from subtask]",
  group_ids: ["screengraph"],
  max_facts: 3  // Just top 3, not 10!
});
```

**Skip this** if user just needs MCP routing (most cases).

### Step 4: Present Brief Response

Format the response BRIEFLY:

```markdown
**Task**: [subtask description]

**Vibe**: `[vibe_name]`  
**MCPs**: [mcp1], [mcp2], [mcp3]

**Quick workflow:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

[If gotcha lookup was performed:]
**Known gotcha**: [gotcha with workaround]
```

**Keep it under 10 lines. This is tactical, not strategic.**

---

## Important Notes

1. **This is the lightweight command** - No heavy Graphiti searches. User already has context from @before-task.

2. **Can be called many times** - It's designed for frequent use during implementation.

3. **Be brief** - 300 tokens max. No fluff, no detailed examples.

4. **Domain switching is OK** - Vibe might change if user switches from backend to frontend subtask.

---

## Examples

### Backend Subtask
```
User: @during-task Add timeout to WebDriver session

Response:
**Task**: Add timeout to WebDriver session
**Vibe**: backend_vibe
**MCPs**: encore-mcp, context7

Quick workflow:
1. Check WebDriver timeout config in device-check.ts
2. Add explicit timeout parameter
3. Test with device connection
```

### Frontend Subtask
```
User: @during-task Create login form component

Response:
**Task**: Create login form component
**Vibe**: frontend_vibe
**MCPs**: svelte, browser

Quick workflow:
1. Create component with $state for form data
2. Use form actions for submission
3. Test with browser MCP
```

### Testing Subtask
```
User: @during-task Write E2E test for login flow

Response:
**Task**: Write E2E test for login flow
**Vibe**: qa_vibe
**MCPs**: browser, encore-mcp

Quick workflow:
1. Review existing E2E patterns
2. Use browser.navigate + browser.snapshot
3. Verify backend state with encore-mcp
```

---

## Success Criteria

After running this command, user should know:
- ✅ Which MCPs to use for this subtask
- ✅ Quick 3-step workflow
- ✅ Any immediate gotchas (if looked up)

**If user needs more context, they should use @before-task (once) or check the skill docs, not call @during-task repeatedly.**

---

## Integration with Spec-Kit

```bash
# User already ran @before-task at spec creation
# Now implementing tasks from tasks.md

@during-task Create user table schema
# Returns: backend_vibe, MCPs: encore-mcp
# User implements

@during-task Add user registration endpoint
# Returns: backend_vibe, MCPs: encore-mcp, context7
# User implements

@during-task Build user registration form
# Returns: frontend_vibe, MCPs: svelte, browser
# User implements
```

---

## See Also

- **Full documentation**: `.claude-skills/during-task_skill/SKILL.md`
- **Quick reference**: `THE_3_COMMANDS.md`
- **Workflow guide**: `.specify/WORKFLOW.md`

