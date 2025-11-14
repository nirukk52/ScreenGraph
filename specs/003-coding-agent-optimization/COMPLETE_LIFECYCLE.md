# The Complete Self-Improvement Lifecycle

**How the 4-command system creates a virtuous improvement cycle.**

---

## 🔄 **The 4 Commands**

```
Daily (Per Spec):
  @before-task  [task]      → Use current skills
  @during-task  [subtask]   → Use current skills  
  @after-task   [completed] → Document evidence

Quarterly (Every 10-20 specs):
  @update-skills            → Refine skills based on evidence
```

---

## 📈 **The Complete Cycle**

```
┌─────────────────────────────────────────────────────────────────┐
│  MONTH 1: USE SKILLS (Specs 1-10)                              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Per spec:
                        │
                        v
              ┌─────────────────┐
              │  @before-task   │  Uses: Current skills + empty Graphiti
              └────────┬────────┘
                       │
                       v
              ┌─────────────────┐
              │  @during-task   │  Uses: Current skills
              └────────┬────────┘
                       │
                       v
              ┌─────────────────┐
              │  @after-task    │  Documents: "backend-debugging worked well
              └────────┬────────┘           encore-mcp was helpful
                       │                    Struggled with async issues"
                       │
                       v
          ┌────────────────────────┐
          │  Graphiti Grows        │
          │  • 10 specs documented │
          │  • Patterns emerging   │
          │  • Gotchas captured    │
          │  • Skill usage tracked │
          └────────────────────────┘
                       │
                       │ After 10-20 specs...
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│  MONTH 3: REFINE SKILLS (Quarterly Review)                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        v
              ┌─────────────────┐
              │ @update-skills  │
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          v                         v
┌──────────────────┐    ┌──────────────────────┐
│ Search Graphiti  │    │ Fetch Context7 Docs  │
│ For Evidence     │    │ For Updates          │
│                  │    │                      │
│ Finds:           │    │ Gets:                │
│ • backend-debug  │    │ • Latest Encore docs │
│   used 15×       │    │ • New Svelte patterns│
│ • 12 success     │    │ • Updated Playwright │
│ • 3 struggles    │    │   APIs               │
│   (async issues) │    │                      │
└────────┬─────────┘    └──────────┬───────────┘
         │                         │
         └────────────┬────────────┘
                      │
                      v
         ┌────────────────────────┐
         │ Update SKILL.md Files  │
         │                        │
         │ backend-debugging:     │
         │ + Add async patterns   │
         │ + Update MCP combos    │
         │                        │
         │ frontend-development:  │
         │ + New Svelte 5 runes   │
         │ + Updated best practices│
         └────────────┬───────────┘
                      │
                      v
         ┌────────────────────────┐
         │ Document in Graphiti   │
         │                        │
         │ "Updated skills based  │
         │  on 15 spec evidence"  │
         └────────────┬───────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────────┐
│  MONTH 4: USE BETTER SKILLS (Specs 11-20)                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        v
              ┌─────────────────┐
              │  @before-task   │  NOW uses: IMPROVED skills + 10-spec Graphiti
              └────────┬────────┘           Better patterns, proven workflows
                       │
                       v
              ┌─────────────────┐
              │  @during-task   │  NOW uses: Enhanced guidance
              └────────┬────────┘           More accurate MCP suggestions
                       │
                       v
              ┌─────────────────┐
              │  @after-task    │  Documents: Even more patterns
              └────────┬────────┘           Builds on previous learnings
                       │
                       v
          ┌────────────────────────┐
          │  Graphiti Richer      │
          │  • 20 specs now       │
          │  • Deep patterns      │
          │  • Skill improvements │
          │    validated          │
          └───────────────────────┘

        [Cycle repeats, gets better each quarter]
```

---

## 📊 **Evidence-Based Skill Updates**

### What @after-task Captures (Per Spec):

```typescript
add_memory({
  name: "Spec-005: User Authentication",
  episode_body: `
    [Tags: spec, backend, auth]
    
    Skills Used: backend-debugging, backend-development
    MCP Tools: encore-mcp, context7, sequential-thinking
    
    Effectiveness:
    - backend-debugging: HELPFUL (checkpoint logging worked perfectly)
    - encore-mcp: VERY HELPFUL (inspected database state easily)
    - sequential-thinking: HELPFUL (analyzed auth flow systematically)
    
    Struggles:
    - backend-debugging missing: async error handling patterns
    - Needed to reference external docs for JWT validation
    
    Suggested Improvements:
    - Add async debugging section to backend-debugging skill
    - Add JWT/auth patterns to backend-development skill
  `,
  group_id: "screengraph"
})
```

### What @update-skills Finds (After 10 specs):

```
Search Graphiti: "backend-debugging skill"

Finds:
- Used in: Spec-001, Spec-005, Spec-007, Spec-009, Spec-012 (5 times)
- Success rate: 4/5 (80%)
- Common pattern: Checkpoint logging → encore-mcp inspection → sequential-thinking analysis
- Struggles: Async issues (mentioned 3 times), race conditions (mentioned 2 times)
- MCP pairing: encore-mcp + sequential-thinking (100% of uses)

CONCLUSION: 
- Skill is effective (80% success)
- NEEDS: Async debugging section
- CONFIRM: MCP pairing in skill docs
- UPDATE: Add proven checkpoint → inspect → reason pattern
```

### What @update-skills DOES:

```
1. Update backend-debugging_skill/SKILL.md:
   
   Add new section:
   """
   ## Phase 3.5: Async Debugging (NEW)
   
   For timeout or hanging issues involving async code:
   1. Add checkpoint logs BEFORE and AFTER await calls
   2. Use encore-mcp to inspect state at each checkpoint
   3. Use sequential-thinking to analyze async flow
   4. Common pattern: Promise chain breaks silently
   
   Proven MCP combo: encore-mcp + sequential-thinking (5/5 specs)
   """

2. Document update in Graphiti:
   add_memory({
     name: "Skill Update: backend-debugging - Added Async Patterns",
     episode_body: "Based on evidence from Specs 1, 5, 7, 9, 12...",
     group_id: "screengraph"
   })
```

---

## 🎯 **The 4-Command Lifecycle (Complete)**

| Command | When | What It Does | Improves |
|---------|------|--------------|----------|
| **@before-task** | Before starting (1× per spec) | Uses current skills + Graphiti | Context quality ⬆️ |
| **@during-task** | During work (5-10× per spec) | Uses current skills | Alignment ⬆️ |
| **@after-task** | After completion (1× per spec) | Documents evidence | Graphiti ⬆️ |
| **@update-skills** | Quarterly (every 10-20 specs) | Refines skills with evidence | Skills ⬆️ |

---

## 💡 **How @after-task Feeds @update-skills**

### Template for @after-task (Include This!):

```typescript
add_memory({
  name: "Spec-XXX: [Name]",
  episode_body: `
    [Tags: spec, domain, type]
    
    **Problem**: ...
    **Solution**: ...
    
    // 👇 THIS SECTION FEEDS @update-skills
    **Skills Used**:
    - [skill-name]: [HELPFUL | PARTIALLY HELPFUL | NOT HELPFUL]
    - [skill-name]: [effectiveness rating]
    
    **MCP Tools Used**:
    - [mcp-name]: [HELPFUL | NOT HELPFUL]
    - Common pairing: [mcp1] + [mcp2] worked well
    
    **Skill Struggles**:
    - [skill-name] missing: [what was missing]
    - [skill-name] unclear: [what was confusing]
    
    **Suggested Skill Improvements**:
    - Add [pattern/section] to [skill-name]
    - Update [workflow] in [skill-name]
    // 👆 THIS BECOMES UPDATE PRIORITY
    
    **Key Learnings**: ...
    **Gotchas**: ...
    **Files Modified**: ...
  `,
  group_id: "screengraph"
})
```

---

## 📈 **Expected Evolution**

### Month 1 (Specs 1-10):
```
Skills: Base version (as-is)
Graphiti: Growing (10 entries)
Effectiveness: Learning phase

@after-task captures:
- Which skills used
- What worked
- What struggled
```

### Month 3 (After @update-skills):
```
Skills: Enhanced with:
  - Async debugging (from evidence)
  - Proven MCP pairings (from usage)
  - New patterns (from Specs 1-10)

Graphiti: Rich (10+ specs)
Effectiveness: Improved

@before-task now surfaces:
- "Use backend-debugging, it works"
- "Pair with encore-mcp + sequential-thinking"
- "Watch for async gotchas"
```

### Month 6 (Specs 21-40):
```
Skills: Refined again with:
  - Edge case handling
  - Domain-specific patterns
  - Validated workflows

Graphiti: Expert level (40+ specs)
Effectiveness: High

@before-task gives:
- Deep pattern matching
- Proven solution paths
- Comprehensive gotcha list
```

**Skills get BETTER over time because updates are EVIDENCE-BASED.** ✅

---

## ✅ **Final Answer**

### **Following 3 Commands Per Spec:**

**Automatically improves:**
- ✅ Graphiti knowledge base (every @after-task)
- ✅ Context quality (@before-task gets richer results)
- ✅ Usage patterns (you learn what works)

**Creates evidence for:**
- ✅ @update-skills to analyze
- ✅ Data-driven skill improvements
- ✅ Proven workflow updates

**Quarterly @update-skills:**
- ✅ Reads evidence from Graphiti
- ✅ Updates SKILL.md files
- ✅ Validates with Context7 docs
- ✅ Documents improvements

---

## 🔄 **The Virtuous Cycle**

```
Use Skills (3 commands)
    ↓
Document Evidence (@after-task)
    ↓
Accumulate Data (Graphiti)
    ↓
Analyze Evidence (@update-skills, quarterly)
    ↓
Update Skills (SKILL.md changes)
    ↓
Use Better Skills (next specs)
    ↓
[Repeat - gets better each cycle]
```

**Automatic data collection + Manual evidence-based refinement = Continuous improvement** ✅

---

## 📋 **Updated Workflow**

```
Daily:
  @before-task → @during-task → @after-task

After 10 specs:
  @update-skills (analyze evidence, update skills)

After 20 specs:
  @update-skills (refine based on more evidence)

After 40 specs:
  @update-skills (expert-level refinement)
```

**The 3 commands FEED the 4th command. Complete self-improvement loop.** 🔄

---

**You already had the pieces! Just needed to connect @after-task evidence to @update-skills analysis.** ✅
