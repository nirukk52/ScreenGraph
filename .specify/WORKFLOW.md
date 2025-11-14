# Spec-Kit + @project-context Workflow

**Unified workflow for spec-driven development with full context loading.**

> **Visual Guide**: See `INTEGRATION_MAP.md` for complete flow diagram

---

## 🎯 The Complete Flow

### Phase 1: Discovery (Before Creating Spec)

**ALWAYS start here:**

```
@project-context Research [feature/bug description] - check if solved before
```

**What you get:**
- ✅ Similar past specs from Graphiti
- ✅ Related solutions or patterns
- ✅ Known gotchas in this area
- ✅ Files to review
- ✅ Vibe recommendation

**Decision:**
- If solved before → Reuse/adapt solution
- If new → Proceed to Phase 2

---

### Phase 2: Specify (Create Spec)

```bash
# Load context for creating spec
@project-context Create spec for [feature description]

# Then create the spec
/speckit.specify "[feature description]"
```

**This creates:** `specs/[number]-[name]/spec.md`

**Search Graphiti during spec writing:**
- Similar requirements
- Domain constraints
- User stories from past specs

---

### Phase 3: Plan (Create Implementation Plan)

```bash
# Load context for planning
@project-context Plan implementation for [spec-name]

# Then create the plan
/speckit.plan
```

**This creates:** `specs/[number]-[name]/plan.md`

**Get from @project-context:**
- Architecture patterns
- Similar implementations
- Technical constraints
- Integration points

---

### Phase 4: Break Down Tasks

```bash
# Load context for task breakdown
@project-context Break down tasks for [spec-name]

# Then create tasks
/speckit.tasks
```

**This creates:** `specs/[number]-[name]/tasks.md`

**Get from @project-context:**
- Task sequencing patterns
- Dependencies to check
- Testing approach

---

### Phase 5: Implement Each Task

**For EACH task in tasks.md:**

```bash
# Load context before implementing
@project-context Implement [specific task from tasks.md]

# Get vibe + MCPs recommendation
# Review Graphiti search results
# Implement the task
```

**Workflow per task:**
1. Create branch: `git checkout -b spec-[number]-task-[n]`
2. Run @project-context with task description
3. Use recommended vibe + MCPs
4. Implement
5. Test
6. Commit (when founder approves)

---

### Phase 6: Validate

```bash
/speckit.checklist
```

**Run validation:**
- ✅ All tasks complete
- ✅ Tests passing
- ✅ Requirements met
- ✅ Documentation updated

---

### Phase 7: Retro & Document

**After spec completion:**

```bash
# Create retro
/speckit.retro

# Then document in Graphiti
@project-context Document completed spec [spec-name] - [what was learned]
```

**Manually add to Graphiti:**
```typescript
add_memory({
  name: "Spec [number]: [name] - Completed",
  episode_body: `
    [Tags: spec, [domain], [feature-type]]
    
    **Spec**: [number]-[name]
    **Problem**: [what we solved]
    **Solution**: [high-level approach]
    **Key Learnings**: 
    - [learning 1]
    - [learning 2]
    
    **Gotchas**:
    - [gotcha 1 with workaround]
    
    **Files Modified**:
    - [file 1]
    - [file 2]
    
    **Tests Added**:
    - [test file 1]
    
    **Related**: [other specs or bugs]
  `,
  group_id: "screengraph",
  source: "text"
})
```

---

## 📋 Quick Reference

### Starting New Spec
```
1. @project-context Research [idea]
2. /speckit.specify "[idea]"
3. @project-context Plan implementation
4. /speckit.plan
5. @project-context Break down tasks
6. /speckit.tasks
```

### Implementing Spec
```
For each task:
1. @project-context Implement [task]
2. git checkout -b spec-XXX-task-N
3. Code using recommended vibe + MCPs
4. Test
5. Commit (founder approval)
```

### Completing Spec
```
1. /speckit.checklist
2. /speckit.retro
3. add_memory() to document in Graphiti
```

---

## 🔄 The Integration

```
┌─────────────────────────────────────────┐
│   Spec-Kit Flow                        │
└───────────┬─────────────────────────────┘
            │
            │ At each phase:
            │ @project-context [phase-specific query]
            │
            v
┌─────────────────────────────────────────┐
│   @project-context                     │
│   • Searches Graphiti                  │
│   • Suggests vibe + MCPs               │
│   • Surfaces past solutions            │
└───────────┬─────────────────────────────┘
            │
            v
┌─────────────────────────────────────────┐
│   Execute Phase                        │
│   • Use recommended tools              │
│   • Reference past patterns            │
│   • Avoid known gotchas                │
└───────────┬─────────────────────────────┘
            │
            │ After completion:
            │ Document in Graphiti
            │
            v
┌─────────────────────────────────────────┐
│   Knowledge Base Grows                 │
│   • Next spec benefits from this one   │
└─────────────────────────────────────────┘
```

---

## 🎯 Key Touchpoints

| Spec-Kit Phase | @project-context Usage | Why |
|----------------|------------------------|-----|
| **Discovery** | Search for similar past work | Avoid duplicating effort |
| **Specify** | Get domain context and constraints | Write better specs |
| **Plan** | Find implementation patterns | Design better solutions |
| **Tasks** | Learn from past task breakdowns | Better sequencing |
| **Implement** | Get tactical guidance per task | Faster, better code |
| **Retro** | Document learnings | Feed future specs |

---

## 💡 Examples

### Example 1: New Feature Spec

```bash
# 1. Discovery
@project-context Research real-time updates for run status page

# Returns: Past work on SSE, real-time patterns, gotchas
# Decision: No similar spec, proceed

# 2. Create spec
/speckit.specify "Real-time run status updates via SSE"

# 3. Plan with context
@project-context Plan SSE implementation for run status

# Returns: Vibe: frontend_vibe, MCPs: graphiti, svelte, browser
# Includes: Existing SSE patterns in codebase

# 4. Continue through phases...
```

### Example 2: Bug Fix Spec

```bash
# 1. Discovery
@project-context Research agent hanging on privacy consent dialogs

# Returns: Found BUG-015 with similar symptoms!
# Decision: Adapt existing solution

# 2. Create spec (quick)
/speckit.specify "Prevent agent stalls on consent dialogs"

# 3. Plan uses past solution
@project-context Plan fix based on BUG-015 solution

# Returns: Exact approach, files to modify, tests to add
```

---

## 📚 Integration with Other Systems

### Vibes Layer
```
@project-context → Suggests vibe
Spec tasks → Use that vibe's MCPs and skills
```

### Graphiti
```
@project-context → Searches Graphiti (group_id="screengraph")
Spec completion → add_memory() to Graphiti
```

### Task Commands
```
During implementation → Use .cursor/commands/ for automation
Testing → task qa:smoke:all
```

---

## 🔧 Configuration

### Spec Tags for Graphiti

Tag your specs in Graphiti:
- `[Tags: spec, backend, api]` - Backend API specs
- `[Tags: spec, frontend, component]` - Frontend component specs
- `[Tags: spec, testing, e2e]` - Testing infrastructure specs
- `[Tags: spec, infra, deployment]` - Infrastructure specs
- `[Tags: spec, bug-fix, agent]` - Bug fix specs

This makes future searches more precise.

---

## ✅ Checklist Per Spec

- [ ] Ran @project-context during discovery
- [ ] Checked Graphiti for similar past specs
- [ ] Used @project-context for each phase (specify, plan, tasks)
- [ ] Implemented with recommended vibe + MCPs
- [ ] Tests passing
- [ ] Documented completion in Graphiti with add_memory()
- [ ] Tagged appropriately for future discovery

---

## 🎬 Your First Integrated Spec

Try this next spec:

```bash
# Phase 1: Discovery
@project-context Research [your next feature idea]

# Review results, then:
/speckit.specify "[feature]"

# Continue with @project-context at each phase
# Use recommended vibe + MCPs
# Document in Graphiti when done
```

**The system gets smarter with each spec you complete.** 📈

---

**Last Updated**: 2025-11-13  
**Integration Status**: Production Ready ✅

