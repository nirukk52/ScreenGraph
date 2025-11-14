# Testing the 3-Command System

**Quick validation that everything works.**

---

## 🧪 Test Plan (15 Minutes)

### Prerequisites

✅ **Setup orchestrator** (one-time):
```bash
cd .mcp-servers/screengraph-orchestrator
pip install -r requirements.txt
```

✅ **Add to Cursor MCP settings** (one-time):
- Open Cursor Settings → MCP Servers
- Add new server:
  - Name: `screengraph-orchestrator`
  - Command: `python`
  - Args: `/Users/priyankalalge/ScreenGraph/Code/ScreenGraph/.mcp-servers/screengraph-orchestrator/server.py`

✅ **Restart Cursor**

---

## Test 1: @before-task (5 minutes)

### Goal
Verify Graphiti search + orchestrator suggestions work.

### Execute

In Cursor chat:
```
@before-task Research pagination improvements for run list page
```

### Expected Output

```markdown
## 🎯 Before-Task Context: Research pagination improvements for run list page

### 📚 Similar Past Work
[Either past solutions OR "No similar work found"]

### 🎭 Recommended Setup
Vibe: frontend_vibe (skills: frontend-development, e2e-testing)
MCPs:
1. graphiti - Search for past solutions
2. svelte - Svelte 5 & SvelteKit docs
3. browser - Frontend testing

### 📁 Files to Review
- frontend/src/routes/runs/+page.svelte
- [other relevant files]

### ⚠️ Known Gotchas
[Any gotchas found OR "No known gotchas documented yet"]

### 🚀 Suggested Approach
1. [Steps based on past patterns]
```

### ✅ Pass Criteria

- [ ] Graphiti search executed (you see results or "no results")
- [ ] Orchestrator suggested vibe (frontend_vibe for this task)
- [ ] Got 3 MCPs recommended (graphiti, svelte, browser)
- [ ] Skills listed (frontend-development, e2e-testing)
- [ ] Response is comprehensive (~2500 tokens worth of context)

### ❌ Fail Indicators

- Command not found → Cursor commands not set up correctly
- Graphiti error → Graphiti MCP not configured
- No vibe suggestion → Orchestrator not working
- Empty response → Skills not loading

### Actual:
MCPs for: Research pagination improvements for run list page
Vibe: frontend_vibe (skills: frontend-debugging, frontend-development)
graphiti - Knowledge graph for institutional memory and past decisions
svelte - Svelte 5 and SvelteKit documentation (195 resources!)
browser - Frontend testing, inspection, and interaction

Context Summary: No existing Graphiti episodes cover pagination for the run list page, so this is likely greenfield work. We’ll rely on fresh research into current UI behavior and SvelteKit/Svelte 5 patterns.
Recommended Vibe/MCPs: Use frontend_vibe with graphiti, svelte, and browser MCPs for knowledge capture, framework references, and UI validation.
Skills to Engage: frontend-development_skill and frontend-debugging_skill (load before diving in, update afterward).
Suggested Starting Points: Inspect the current run list UI (likely under frontend/src/routes/...) to confirm pagination needs, review SvelteKit data loading + Svelte 5 runes for list pagination, and check if Encore client already exposes paged run endpoints.
Open Questions: Which backend endpoint powers the run list, and does it already support pagination parameters? What page size and loading UX do we want (infinite scroll vs numbered pages vs “Load more”)?

---

## Test 2: @during-task (3 minutes)

### Goal
Verify lightweight MCP suggestions without heavy search.

**Note:** This test should ideally be run in the SAME chat window as Test 1 (so orchestrator has domain context). However, testing in a FRESH window validates edge-case behavior.

### Execute

In Cursor chat (can be fresh window OR same window as Test 1):
```
@during-task Add infinite scroll to run list
```

### Expected Output (After Keyword Fix)

```markdown
**Task**: Add infinite scroll to run list
**Vibe**: frontend_vibe
**MCPs**: svelte, browser, graphiti

Quick workflow:
1. Use Svelte $state for scroll tracking
2. Implement intersection observer
3. Test with browser MCP
```

**Note:** Before keyword fix, this returned `backend_vibe` because "list" triggered backend and "scroll" wasn't in frontend keywords. Now fixed!

### ✅ Pass Criteria

- [ ] Response is BRIEF (under 10 lines for brief mode)
- [ ] Got correct vibe (frontend_vibe for UI tasks, backend_vibe for API tasks)
- [ ] Got 3 MCPs appropriate for the task
- [ ] Got quick workflow (2-4 steps)
- [ ] Token cost is low (~300 tokens, much lighter than @before-task)

### ❌ Fail Indicators

- Response too long → Skill not in brief mode
- Wrong vibe for obvious task → Orchestrator keyword matching needs tuning
- Full Graphiti search → Wrong skill loaded
- Same output as @before-task → Commands not differentiated

### 🔍 Known Issue (FIXED)

**Original test result:** Got `backend_vibe` instead of `frontend_vibe`  
**Root cause:** "list" triggered backend, "scroll" not in frontend keywords  
**Fix applied:** Added frontend keywords: scroll, infinite, pagination, navigation, click, hover, animation, etc.  
**Re-test:** Should now return `frontend_vibe` ✅

### Actual:
MCPs for: Add infinite scroll to run list
Vibe: backend_vibe (skills: backend-debugging, backend-development)
graphiti - Knowledge graph for institutional memory and past decisions
encore-mcp - Encore.ts backend introspection and debugging
sequential-thinking - Multi-step reasoning and problem decomposition

Loaded frontend-development_skill (UI patterns + runes) and frontend-debugging_skill (Svelte 5 troubleshooting) to steer the work.
Key next steps:
Review the current run list component in frontend/ to confirm how it requests data and renders items; note existing pagination or filters.
Inspect the Encore client endpoint the list uses; verify it supports cursor/offset pagination or add a backend update if it’s limited to fixed pages.
Sketch the infinite scroll flow: track a loading cursor/state, guard against duplicate requests, and handle empty results to stop fetching.
Implement viewport detection (e.g., IntersectionObserver) rather than scroll events for smoother performance in Svelte 5.
Add UX polish: loading skeletons/spinners between batches and error recovery if a fetch fails.
Manually test the UI using the browser to ensure the list continues loading, respects end-of-data, and doesn’t refetch repeatedly.
Let me know when you’re ready to dive in or if you want help locating the relevant files.

---

## Test 3: @after-task (3 minutes)

### Goal
Verify documentation template generation.

### Execute

In Cursor chat:
```
@after-task Completed pagination improvements for run list
```

### Expected Output

```markdown
## 📝 Document Your Work (MANDATORY)

Here's your add_memory() template ready to execute:

add_memory({
  name: "Feature: Pagination Improvements for Run List",
  episode_body: `
    [Tags: frontend, svelte, pagination]
    
    **Problem**: [What we were solving]
    
    **Solution**: [High-level approach]
    
    **Key Learnings**:
    - [Learning 1]
    - [Learning 2]
    
    **Gotchas**:
    - [Gotcha with workaround]
    
    **Files Modified**:
    - [file 1]
    - [file 2]
    
    **Tests Added**:
    - [test file]
    
    **Related**: [Related specs/bugs]
    
    **Date**: 2025-11-13
  `,
  group_id: "screengraph",
  source: "text"
})
```

### ✅ Pass Criteria

- [ ] Got add_memory() template
- [ ] Template has proper structure (Problem, Solution, Gotchas, Files)
- [ ] group_id is "screengraph" (not something else!)
- [ ] Tags are appropriate ([Tags: frontend, svelte, pagination])
- [ ] Includes guidance on filling in template

### ❌ Fail Indicators

- No template → Skill not loading
- Wrong group_id → Skill not reading founder_rules
- No structure → Wrong skill executed

---

## Test 4: Full Spec-Kit Integration (4 minutes)

### Goal
Verify the 3 commands work with spec-kit workflow.

### Execute

```bash
# Test the integration
@before-task Research adding user preferences storage

# Review output

# Then proceed with spec-kit
/speckit.specify "Add user preferences storage for UI customization"

# Review generated spec

# Then test during-task
@during-task Create preferences table schema

# Review output
```

### ✅ Pass Criteria

- [ ] @before-task ran before /speckit.specify (proper order)
- [ ] @before-task found relevant context (or stated "no past work")
- [ ] /speckit.specify created spec successfully
- [ ] @during-task gave brief MCP guidance for specific subtask
- [ ] Flow felt natural and helpful

### ❌ Fail Indicators

- Can't run commands in sequence → Integration broken
- Duplicate information → Commands overlapping
- Confusion about when to use which → Documentation unclear

---

## Test 5: Orchestrator Direct Call (2 minutes)

### Goal
Verify orchestrator MCP works independently.

### Execute

In Cursor chat (as a tool call):
```typescript
suggest_mcps({
  task: "Deploy frontend to Vercel production",
  include_examples: false
})
```

### Expected Output

```markdown
**MCPs for: Deploy frontend to Vercel production**

**Vibe**: infra_vibe (skills: mcp-builder, skill-creator)

1. graphiti - Institutional memory
2. vercel - Deployment management
3. aws-api-mcp - AWS operations
```

### ✅ Pass Criteria

- [ ] Got vibe suggestion (infra_vibe for deployment)
- [ ] Got 3 MCPs (graphiti always first, then vercel)
- [ ] Skills listed from that vibe
- [ ] Response is brief (not verbose)

### ❌ Fail Indicators

- Orchestrator not found → MCP not configured
- Wrong vibe → VIBE_MAPPING incorrect
- Wrong MCPs → TASK_PATTERNS need tuning

---

## Test 6: Graphiti Integration (2 minutes)

### Goal
Verify Graphiti is actually being searched and written to.

### Execute

```typescript
// Test search
search_memory_nodes({
  query: "agent stalling timeout",
  group_ids: ["screengraph"],
  max_nodes: 5
})

// Test write
add_memory({
  name: "Test: System Validation",
  episode_body: "[Tags: test]\n\nTesting the 3-command system. If you find this, it works!",
  group_id: "screengraph",
  source: "text"
})

// Search again
search_memory_nodes({
  query: "system validation test",
  group_ids: ["screengraph"],
  max_nodes: 5
})
```

### ✅ Pass Criteria

- [ ] First search returns results (or empty if no past work)
- [ ] add_memory() succeeds (gets queued message)
- [ ] Second search finds the test memory you just added
- [ ] group_id is always "screengraph"

### ❌ Fail Indicators

- Graphiti not found → MCP not configured
- Different group_id → Founder rules not being followed
- Can't write → Graphiti permissions issue

---

## 🎯 Complete Test Run

**Do all 6 tests in sequence (15 minutes total):**

```bash
# 1. Test @before-task
@before-task Research pagination improvements

# 2. Test @during-task  
@during-task Add infinite scroll

# 3. Test @after-task
@after-task Completed pagination test

# 4. Test spec-kit integration
@before-task Research user preferences
/speckit.specify "User preferences storage"
@during-task Create preferences table

# 5. Test orchestrator directly
suggest_mcps(task: "Deploy to Vercel")

# 6. Test Graphiti
search_memory_nodes({query: "test", group_ids: ["screengraph"]})
add_memory({name: "Test", episode_body: "[Tags: test]\n\nTest", group_id: "screengraph", source: "text"})
```

---

## ✅ Success Criteria (All Tests Pass)

- [ ] All 3 commands (@before/during/after-task) work
- [ ] Orchestrator suggests correct vibe + MCPs
- [ ] Graphiti searches and writes successfully
- [ ] Spec-kit integration works smoothly
- [ ] Token costs match expectations (~2500/300/600)
- [ ] Responses are formatted correctly

---

## 🐛 Troubleshooting

### "Command not found"
→ Check: `.cursor/commands/before-task.md` exists  
→ Restart Cursor completely

### "Graphiti error"
→ Check: `~/.cursor/mcp.json` has graphiti configured  
→ Verify: Graphiti MCP is running (check Cursor MCP panel)

### "Orchestrator not working"
→ Check: orchestrator added to `~/.cursor/mcp.json`  
→ Verify: `pip list | grep mcp` shows mcp installed  
→ Test: Run `python .mcp-servers/screengraph-orchestrator/server.py` in separate terminal (should hang waiting for input - that's correct!)

### "Wrong vibe suggested"
→ Expected: VIBE_MAPPING in orchestrator might need tuning  
→ Fix: Edit `server.py` → VIBE_MAPPING → Add keywords

### "@before-task too slow"
→ Expected: First call might be slow (Graphiti warming up)  
→ Normal: ~2500 tokens = ~3-5 seconds processing

---

## 📊 Expected Token Usage Per Test

| Test | Command | Expected Tokens |
|------|---------|-----------------|
| 1 | @before-task | ~2500 |
| 2 | @during-task | ~300 |
| 3 | @after-task | ~600 |
| 4 | Integration | ~3000 (before + during) |
| 5 | Direct orchestrator | ~200 |
| 6 | Graphiti | ~400 |
| **TOTAL** | **All tests** | **~7000 tokens** |

**Cost:** ~$0.10 for complete validation  
**Time:** 15 minutes  
**ROI:** Confidence system works = priceless

---

## 🎬 After Testing

If all tests pass:
1. ✅ System is operational
2. ✅ Start using on real work
3. ✅ Run `@before-task` before your next spec
4. ✅ Watch knowledge compound

If any test fails:
1. ❌ Check troubleshooting section
2. ❌ Verify MCP configuration
3. ❌ Review ARCHITECTURE_MAP.md for expected flow
4. ❌ Ask for help with specific error

---

## 🚀 Real-World Test (After Validation)

**Your next actual spec:**

```bash
# Start with the system
@before-task Research [your actual next feature]

# See what Graphiti found
# Follow the recommendations
# Use the suggested vibe + MCPs

# Proceed through spec-kit
/speckit.specify "[feature]"
/speckit.plan
/speckit.tasks

# During implementation
@during-task [each task from tasks.md]

# After completion
@after-task [what you completed]
```

**Then compare:**
- Time to implement vs last spec
- Quality of context provided
- Whether past solutions helped
- Token usage vs expectations

**This is the real test.** ✅

---

**Run the 6 tests. Verify everything works. Then ship it.** 🚀

