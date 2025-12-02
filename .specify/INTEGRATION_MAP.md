# Spec-Kit + @project-context Integration Map

**Visual guide showing how spec-kit and @project-context work together.**

---

## 🗺️ Complete Flow Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW FEATURE/BUG IDEA                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: DISCOVERY                                             │
│                                                                 │
│  @project-context Research [idea]                              │
│    ↓                                                            │
│  Graphiti searches:                                             │
│    • Similar past specs                                         │
│    • Related solutions                                          │
│    • Known gotchas                                              │
│                                                                 │
│  MCP Orchestrator suggests:                                     │
│    • Which vibe to use                                          │
│    • Top 3 MCPs                                                 │
│    • Relevant skills                                            │
│                                                                 │
│  DECISION:                                                      │
│    ✓ Already solved? → Reuse/adapt                            │
│    ✓ New problem? → Proceed to Phase 2                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: SPECIFY                                               │
│                                                                 │
│  /speckit.specify "[feature description]"                      │
│    ↓                                                            │
│  Creates: specs/[number]-[name]/spec.md                        │
│                                                                 │
│  Optional context:                                              │
│  @project-context Create spec for [description]                │
│    → Domain constraints                                         │
│    → User story patterns                                        │
│    → Requirements templates                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: PLAN                                                  │
│                                                                 │
│  @project-context Plan implementation for [spec-name]          │
│    ↓                                                            │
│  Get from Graphiti:                                             │
│    • Architecture patterns                                      │
│    • Similar implementations                                    │
│    • Integration points                                         │
│    • Technical constraints                                      │
│                                                                 │
│  Get from Orchestrator:                                         │
│    • Vibe: [domain]_vibe                                       │
│    • MCPs: [top 3]                                             │
│    • Skills: [available in vibe]                               │
│                                                                 │
│  /speckit.plan                                                  │
│    ↓                                                            │
│  Creates: specs/[number]-[name]/plan.md                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: TASKS                                                 │
│                                                                 │
│  @project-context Break down tasks for [spec-name]             │
│    ↓                                                            │
│  Get from Graphiti:                                             │
│    • Task sequencing patterns                                   │
│    • Dependencies to check                                      │
│    • Testing approach                                           │
│                                                                 │
│  /speckit.tasks                                                 │
│    ↓                                                            │
│  Creates: specs/[number]-[name]/tasks.md                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: IMPLEMENT (Per Task)                                 │
│                                                                 │
│  For each task in tasks.md:                                     │
│                                                                 │
│  git checkout -b spec-[number]-task-[n]                        │
│    ↓                                                            │
│  @project-context Implement [specific task]                    │
│    ↓                                                            │
│  Get from Graphiti:                                             │
│    • Past solutions for similar tasks                           │
│    • Files that were modified                                   │
│    • Gotchas to avoid                                           │
│                                                                 │
│  Get from Orchestrator:                                         │
│    • Vibe-specific skills to use                               │
│    • MCPs for implementation                                    │
│    • Workflow guidance                                          │
│                                                                 │
│  Implement → Test → Commit (founder approval)                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: VALIDATE                                              │
│                                                                 │
│  /speckit.checklist                                             │
│    • All tasks complete?                                        │
│    • Tests passing?                                             │
│    • Requirements met?                                          │
│    • Documentation updated?                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 7: RETRO & DOCUMENT                                      │
│                                                                 │
│  /speckit.retro                                                 │
│    ↓                                                            │
│  Creates: specs/[number]-[name]/retro.md                       │
│                                                                 │
│  add_memory({                                                   │
│    name: "Spec [number]: [name] - Completed",                  │
│    episode_body: "[Tags: spec, domain]\n\n                     │
│                   Problem: ...\n                                │
│                   Solution: ...\n                               │
│                   Key Learnings: ...\n                          │
│                   Gotchas: ...\n                                │
│                   Files Modified: ...",                         │
│    group_id: "screengraph",                                     │
│    source: "text"                                               │
│  })                                                             │
│    ↓                                                            │
│  KNOWLEDGE BASE GROWS                                           │
│    • Next spec benefits from this one                           │
│    • Patterns compound over time                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 The Self-Improvement Cycle

```
Spec N → Document in Graphiti → Knowledge grows
                                       ↓
Spec N+1 → @project-context → Finds patterns from Spec N
                                       ↓
                                Faster, better solution
                                       ↓
                         Document → Knowledge grows more
                                       ↓
Spec N+2 → Even richer context → Even faster
```

**Each spec makes the next one easier.**

---

## 📊 Comparison: With vs Without Integration

### Without @project-context

```
Spec 1: Implement feature X
  • No past context
  • Manual research
  • Hit known gotchas
  • 3 days implementation
  ✓ Works eventually

Spec 2: Implement similar feature Y
  • No memory of Spec 1
  • Repeat same research
  • Hit SAME gotchas
  • 3 days again
  ✓ Works eventually

Spec 3: ...
  • Still no institutional memory
  • Still 3 days
```

**No learning curve. Every spec starts from zero.**

### With @project-context

```
Spec 1: Implement feature X
  @project-context Research [X]
    → No past context (first time)
  • Implement from scratch
  • 3 days
  add_memory() → Document solution
  ✓ Works + knowledge captured

Spec 2: Implement similar feature Y
  @project-context Research [Y]
    → Finds Spec 1 solution!
    → Gotchas already documented
    → Files to modify listed
  • Adapt existing pattern
  • 1 day implementation
  add_memory() → Document adaptations
  ✓ Works faster

Spec 3: Implement related feature Z
  @project-context Research [Z]
    → Finds Spec 1 AND Spec 2
    → Multiple patterns available
    → Rich context
  • Choose best pattern
  • 4 hours implementation
  ✓ Works even faster
```

**Learning curve accelerates. Knowledge compounds.**

---

## 🎯 Key Touchpoints (Quick Reference)

| Spec Phase | Command | @project-context Query | Graphiti Benefit |
|------------|---------|------------------------|------------------|
| **Discovery** | - | `Research [idea]` | Find if already solved |
| **Specify** | `/speckit.specify` | `Create spec for [X]` | Domain patterns |
| **Plan** | `/speckit.plan` | `Plan implementation` | Architecture patterns |
| **Tasks** | `/speckit.tasks` | `Break down tasks` | Sequencing patterns |
| **Implement** | Code | `Implement [task]` | Tactical solutions |
| **Retro** | `/speckit.retro` | - | - |
| **Document** | `add_memory()` | - | **KB grows** |

---

## 💡 Pro Tips

### 1. **Tag Specs Consistently**
```typescript
add_memory({
  episode_body: "[Tags: spec, backend, appium, lifecycle]\n\n..."
})
```

Tags make future searches precise.

### 2. **Document Gotchas Explicitly**
```
Gotchas:
- Appium sessions timeout silently (set explicit timeouts)
- First-run consent dialogs block automation (pre-flight check)
```

Future specs avoid these immediately.

### 3. **Link Related Specs**
```
Related: Spec-001, BUG-015, FR-020
```

Builds knowledge graph of connections.

### 4. **Search Before Every Phase**
Don't skip @project-context. Even if you think you know the answer.

**Why?** You might have documented a gotcha last month that you forgot about.

---

## 📈 Expected Evolution

### Month 1 (0-10 specs)
- Basic patterns documented
- @project-context finds simple matches
- Moderate time savings

### Month 3 (10-30 specs)
- Rich pattern library
- @project-context finds nuanced solutions
- Significant time savings

### Month 6 (30+ specs)
- Institutional knowledge mature
- @project-context is your senior engineer
- New specs often have 80% reusable patterns

**The system gets exponentially smarter.**

---

## 🎬 Next Spec: Use Full Integration

Try this on your next spec:

```bash
# Start with context
@project-context Research [your next idea]

# Review what Graphiti found
# Decide: adapt existing or create new?

# If new, proceed through phases with @project-context
/speckit.specify "[idea]"
@project-context Plan implementation
/speckit.plan
# ... etc

# At the end, document
add_memory() with full learnings
```

**Your second spec will be faster than the first. Your tenth will be faster than the second.** 📈

---

**Last Updated**: 2025-11-13  
**Integration Status**: Complete ✅  
**Next Spec**: Will be smarter than the last ✅




