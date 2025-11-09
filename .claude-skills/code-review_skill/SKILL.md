---
name: code-review
description: This skill should be used when conducting focused code reviews that emphasize clarity, data flow understanding, and minimal assumptions. Trigger when reviewing pull requests, code changes, or when explicitly asked to review code. Produces structured reviews with priority-based feedback.
---

# Code Review

## Overview

Conduct focused, structured code reviews that emphasize understanding over criticism. Reviews prioritize questions about ambiguity and code/data flow rather than nitpicking style. Each review produces a consistent format with summary, assumptions, and priority-based comments.

## When to Use This Skill

Trigger this skill when:
- Reviewing pull requests or code changes
- User explicitly requests "review this code" or "conduct a code review"
- Analyzing a diff or set of file changes
- Evaluating code before merge or deployment
- JIRA tickets reference code changes that need review

## Review Format

All code reviews follow this structure:

### 1. What These Changes Do
3-5 concise bullet points summarizing the intent and scope of changes.

**Example:**
- Adds GraphQL endpoint for querying user preferences
- Refactors authentication middleware to support JWT tokens
- Introduces caching layer for frequently accessed data

### 2. Assumptions
Brief bullet points documenting assumptions made during the review.

**Example:**
- Assuming PostgreSQL is the target database (not explicitly stated)
- Type definitions suggest this is part of a larger refactor
- Error handling strategy follows existing patterns in the codebase

### 3. Priority Comments

Comments organized into three priority levels. Each comment is 50-150 words maximum.

#### High Priority
Issues that must be addressed before merge:
- Security vulnerabilities
- Data loss risks
- Breaking changes without migration path
- Critical logic errors
- Major performance regressions

#### Medium Priority
Issues that should be addressed soon:
- Unclear code/data flow requiring clarification
- Missing error handling
- Ambiguous function behavior
- Type safety concerns
- Potential edge cases

#### Low Priority
Suggestions for future improvement:
- Code organization opportunities
- Documentation enhancements
- Minor performance optimizations
- Consistency improvements

## Review Process

### Step 1: Identify Changes Scope
Read through all modified files to understand:
- What functionality is being added/modified/removed
- Which systems/services are affected
- Whether this is a feature, bug fix, refactor, or chore

### Step 2: Check for JIRA Reference
Scan commit messages, PR descriptions, and file paths for JIRA ticket references:
- Pattern: `FR-###`, `BUG-###`, `TD-###`, `CHORE-###`
- If found, prepare to save review document in the JIRA folder: `jira/{category}/{ticket-id}/code-review-{date}.md`

**JIRA Folder Structure:**
```
jira/
├── feature-requests/
│   └── FR-XXX/
│       ├── code-review-2025-11-09.md
│       └── DESCRIPTION.md
├── bugs/
│   └── BUG-XXX/
├── tech-debt/
│   └── TD-XXX/
└── chores/
    └── CHORE-XXX/
```

### Step 3: Analyze Code Flow
Focus on understanding:
- **Data flow**: How data moves through functions/components
- **Control flow**: Branching logic, error paths, edge cases
- **Dependencies**: What this code relies on and what relies on it
- **Assumptions**: What must be true for this code to work correctly

### Step 4: Formulate Questions
Instead of prescriptive feedback, ask questions about:
- Ambiguous behavior: "What happens when userId is null here?"
- Flow clarity: "How does error propagate from this async call?"
- Missing context: "Is there a reason we're not validating input X?"
- Edge cases: "Have we considered the case where the array is empty?"

### Step 5: Prioritize Feedback
Categorize each comment:
- **High**: Must fix before merge (security, correctness, data integrity)
- **Medium**: Should address (clarity, robustness, maintainability)
- **Low**: Nice to have (style, organization, minor optimizations)

### Step 6: Write Review
Use the review template from `assets/review-template.md` and populate all sections:
1. **What These Changes Do** (3-5 bullets)
2. **Assumptions** (as many bullets as needed, keep short)
3. **High Priority** (only critical issues)
4. **Medium Priority** (questions and concerns)
5. **Low Priority** (suggestions for future)

### Step 7: Save Review Document
If JIRA ticket found:
- Save to `jira/{category}/{ticket-id}/code-review-{YYYY-MM-DD}.md`
- Use today's date for the filename

If no JIRA ticket:
- Present review inline in the conversation

## Review Principles

### DO Focus On
✅ Understanding code intent and flow  
✅ Asking questions about ambiguity  
✅ Identifying security and correctness issues  
✅ Flagging unclear data flow  
✅ Noting missing error handling  
✅ Highlighting assumptions that need validation  

### DON'T Focus On
❌ Nitpicking style preferences  
❌ Subjective code organization debates  
❌ Minor naming suggestions  
❌ Formatting (linters handle this)  
❌ Personal preference for syntax  
❌ Extensive refactoring suggestions (unless critical)  

### Question Framing
Always frame feedback as questions or observations, not commands:

**Good:**
- "What happens if the API returns null here?"
- "Should we validate userId before passing to the database?"
- "Is there a reason we're not handling the rejected promise?"

**Avoid:**
- "You need to add validation here."
- "This should use async/await instead."
- "Change this to use map() instead of forEach()."

## Word Count Guidelines

Keep reviews concise:
- **What These Changes Do**: 1-2 sentences per bullet
- **Assumptions**: 1 sentence per bullet
- **Comments**: 50-150 words each (strictly enforced)

Short, focused reviews are more actionable than lengthy critiques.

## Resources

### assets/review-template.md
Pre-formatted template for consistent review structure. Copy and populate all sections.

### references/review-guidelines.md
Expanded guidance on identifying different priority levels and framing effective review questions.

## Example Review

**What These Changes Do:**
- Adds real-time WebSocket connection management for live screen updates
- Introduces connection pooling to handle up to 1000 concurrent sessions
- Implements automatic reconnection logic with exponential backoff

**Assumptions:**
- Redis is available and configured for session storage
- Frontend implements WebSocket protocol correctly
- Network latency is acceptable for real-time requirements

**High Priority:**
- Memory leak risk: WebSocket connections appear to be held indefinitely without cleanup when clients disconnect unexpectedly. Should we implement a timeout or heartbeat mechanism?

**Medium Priority:**
- Error handling: What happens when Redis connection fails mid-session? The code doesn't appear to handle this case, which could leave clients in an inconsistent state.
- Type safety: The `message` parameter in `handleIncomingMessage()` is typed as `any`. Can we define a discriminated union for the expected message types?

**Low Priority:**
- Consider extracting the reconnection logic into a separate utility function for reusability across other real-time features.
