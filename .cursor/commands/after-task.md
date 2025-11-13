---
description: Mandatory knowledge capture after completing work. Documents solution in Graphiti for future reference.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Capture institutional knowledge after completing work. This ensures future specs/tasks benefit from what was just learned.

**MANDATORY** - This command must be run after completing any non-trivial work.

**Token cost:** ~600 tokens  
**Frequency:** Once per spec/major-task  
**ROI:** Future specs benefit = exponential improvement

---

## Execution

The user provided a description of what was completed in `$ARGUMENTS`.

### Step 1: Parse Completion Context

Extract from the description:
- **What was completed**: Spec number, bug fix, refactoring, feature
- **Domain**: backend, frontend, testing, infrastructure
- **Type**: spec, bug-fix, refactor, feature, architecture

### Step 2: Generate Documentation Template

Based on what was completed, create an appropriate `add_memory()` template:

#### For Completed Spec:

```typescript
add_memory({
  name: "Spec-[NUMBER]: [Short Title]",
  episode_body: `
    [Tags: spec, [domain], [feature-type], [technologies]]
    
    **Problem**: [What problem this spec solved]
    
    **Solution**: [High-level approach - NO code details, just strategy]
    
    **Key Learnings**:
    - [Learning 1 - what worked well]
    - [Learning 2 - what to do differently next time]
    - [Learning 3 - pattern discovered]
    
    **Gotchas**:
    - [Gotcha 1 with workaround - be specific!]
    - [Gotcha 2 with workaround]
    
    **Files Modified**:
    - [file 1 with brief note on what changed]
    - [file 2]
    - [file 3]
    
    **Tests Added**:
    - [test file 1 with coverage note]
    - [test file 2]
    
    **Related**: [Spec-XXX, BUG-YYY, FR-ZZZ]
    
    **Date**: [YYYY-MM-DD]
  `,
  group_id: "screengraph",
  source: "text"
})
```

#### For Bug Fixed:

```typescript
add_memory({
  name: "BUG-[NUMBER]: [Bug Title]",
  episode_body: `
    [Tags: bug, [domain], [component], [root-cause]]
    
    **Problem**: [Bug symptoms - what users experienced]
    
    **Root Cause**: [What actually caused it - be specific]
    
    **Solution**: [Fix approach - strategy, not code]
    
    **Key Learnings**:
    - [Learning about why this happened]
    - [How to prevent similar bugs]
    
    **Gotchas**:
    - [Gotcha with workaround]
    
    **Files Modified**:
    - [file 1]
    
    **Related**: [BUG-XXX, Spec-YYY]
    
    **Date**: [YYYY-MM-DD]
  `,
  group_id: "screengraph",
  source: "text"
})
```

#### For Refactoring:

```typescript
add_memory({
  name: "Refactor: [What Was Refactored]",
  episode_body: `
    [Tags: refactor, [domain], [component], architecture]
    
    **Problem**: [What needed refactoring and why]
    
    **Solution**: [Refactoring approach]
    
    **Key Learnings**:
    - [Architectural insight]
    - [Pattern discovered]
    
    **Gotchas**:
    - [Migration gotchas]
    - [Breaking changes]
    
    **Files Modified**:
    - [file 1]
    
    **Related**: [Related architecture decisions]
    
    **Date**: [YYYY-MM-DD]
  `,
  group_id: "screengraph",
  source: "text"
})
```

### Step 3: Optional MCP Effectiveness Tracking

If the user wants to track which MCPs were helpful, also generate:

```typescript
track_effectiveness({
  task: "[original task description]",
  mcps_used: ["[mcp1]", "[mcp2]", "[mcp3]"],
  outcome: "helpful",  // Ask user: helpful/partially_helpful/not_helpful
  feedback: "[Optional: what worked well or what was missing]"
});
```

**Note:** Ask user if they want to track effectiveness. Don't assume.

### Step 4: Present and Guide

Present the template and guide the user:

```markdown
## 📝 Document Your Work (MANDATORY)

Here's your `add_memory()` template ready to execute:

[Show the generated template above]

---

**Review this template and:**
1. Fill in any [bracketed placeholders] with specifics
2. Ensure gotchas are actionable (include workarounds)
3. List ALL files modified (helps future searches)
4. Add proper tags for categorization
5. Execute the add_memory() call

**Critical:**
- ✅ MUST use `group_id: "screengraph"` (never different)
- ✅ Include specific gotchas with workarounds
- ✅ List all modified files
- ✅ Use tags: [domain], [type], [technologies]

[If tracking effectiveness:]

**Optional: Track MCP Effectiveness**

[Show track_effectiveness() template]

This helps the orchestrator improve future recommendations!

---

**Why this matters:** Future specs will find this documentation and benefit from your learnings. **Document well = help future you.**
```

---

## Quality Standards

**Good documentation includes:**
- ✅ Clear problem statement (what was being solved)
- ✅ High-level solution (strategy, not code)
- ✅ Specific gotchas with workarounds
- ✅ ALL files modified (complete list)
- ✅ Related specs/bugs linked
- ✅ Proper tags for categorization

**Bad documentation:**
- ❌ Just code snippets (too detailed)
- ❌ No gotchas mentioned (lost knowledge)
- ❌ Vague problem statement (not searchable)
- ❌ Missing file references (hard to find)
- ❌ No tags (poor categorization)

---

## Integration

### After Pre-Push
```bash
# Pre-push hook succeeded
git push origin spec-002-user-auth

# Now document (BEFORE creating PR)
@after-task Completed spec-002 user authentication

# Review template, fill in details, execute add_memory()
```

### After Complex Bug Fix
```bash
# Bug fixed and tested
@after-task Fixed BUG-015 privacy consent dialog stall

# Document root cause, solution, gotchas
```

---

## Enforcement

From `founder_rules.mdc`:

> **After Completing Task:**
> 1. ✅ Document solution via Graphiti
> 2. ✅ Include: problem, solution, gotchas, files
> 3. ✅ Use group_id="screengraph"

**This is not optional. It's how the system improves.**

---

## See Also

- **Full documentation**: `.claude-skills/after-task_skill/SKILL.md`
- **Quick reference**: `THE_3_COMMANDS.md`
- **Template examples**: `.claude-skills/after-task_skill/SKILL.md` (has multiple examples)

