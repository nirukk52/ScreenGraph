# THE 3 COMMANDS - Quick Reference Card

Print this. Pin it to your monitor. Use it every day.

---

## 📋 WHEN TO CALL

```
┌────────────────────────────────────────────────────────┐
│  Starting work?        →  @before-task [what]          │
│  Implementing subtask? →  @during-task [subtask]       │
│  Work completed?       →  @after-task [completed]      │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ THE COMMANDS

### @before-task [task]
**When:** Before /speckit.specify OR starting major work  
**Tokens:** ~2500  
**Frequency:** 1× per spec  
**Returns:** Past work + vibe + MCPs + gotchas + files + approach

### @during-task [subtask]  
**When:** Before implementing each task from tasks.md  
**Tokens:** ~300  
**Frequency:** 5-10× per spec  
**Returns:** MCPs + brief workflow

### @after-task [completed]
**When:** After pre-push, before PR creation  
**Tokens:** ~600  
**Frequency:** 1× per spec  
**Returns:** Template for add_memory()

---

## 📊 SAVINGS

**Old way:** 30,000 tokens/spec (random @project-context calls)  
**New way:** 5,500 tokens/spec (structured 3 commands)  
**Savings:** 82% = ~$0.37/spec = $37/100 specs

---

## ✅ SPEC-KIT INTEGRATION

```
1. @before-task Research [idea]        ← Before /speckit.specify
2. /speckit.specify, /speckit.plan, /speckit.tasks
3. @during-task [task 1]               ← Before coding
4. Code task 1
5. @during-task [task 2]               ← Before coding
6. Code task 2
7. ... repeat ...
8. Pre-push succeeds
9. @after-task [completed]             ← Before PR
```

---

## 🎯 EXAMPLES

### Backend Bug
```
@before-task Fix agent hanging on device
  → Past solutions, vibe: backend_vibe, MCPs: graphiti/encore/thinking

@during-task Add timeout to WebDriver session
  → MCPs: encore-mcp, context7

@during-task Add recovery logic
  → MCPs: encore-mcp, sequential-thinking

@after-task Fixed agent timeout handling
  → Document in Graphiti
```

### Frontend Feature
```
@before-task Build navigation component
  → Past patterns, vibe: frontend_vibe, MCPs: graphiti/svelte/browser

@during-task Create nav component structure
  → MCPs: svelte, browser

@during-task Add active state tracking
  → MCPs: svelte

@during-task Write E2E test
  → MCPs: browser, encore-mcp

@after-task Completed navigation component
  → Document in Graphiti
```

---

## ⚠️ RULES

1. **NEVER skip @before-task** - You'll regret it
2. **CALL @during-task freely** - It's cheap (300 tokens)
3. **@after-task is MANDATORY** - System improves here
4. **Don't use @before-task during work** - Use @during-task

---

## 💡 REMEMBER

**Each spec you document makes the next one easier.**

Spec 1: No context → 3 days  
Spec 2: Some context → 2 days  
Spec 3: Rich context → 1 day  
Spec 10: **Expert context → 4 hours**

**The compound interest of knowledge.**

---

**Keep this card handy. Use it daily. Watch productivity soar.** 🚀

