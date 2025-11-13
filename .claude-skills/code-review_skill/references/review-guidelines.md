# Code Review Guidelines Reference

This document provides expanded guidance for conducting effective code reviews with the code-review skill.

## Priority Classification Guide

### High Priority Indicators

**Security Issues:**
- Unvalidated user input reaching database queries (SQL injection risk)
- Sensitive data exposed in logs or error messages
- Missing authentication/authorization checks
- Cryptographic operations using weak algorithms
- Credentials or secrets hardcoded in source code

**Data Integrity Issues:**
- Race conditions that could corrupt data
- Missing database transactions for multi-step operations
- Potential for data loss during error scenarios
- Incorrect foreign key relationships
- Missing cascade delete handling

**Breaking Changes:**
- API signature changes without backward compatibility
- Database schema changes without migration path
- Configuration changes that break existing deployments
- Removal of public APIs without deprecation period

**Critical Logic Errors:**
- Off-by-one errors in loops or array access
- Incorrect conditional logic (e.g., using `||` instead of `&&`)
- Missing null/undefined checks before property access
- Incorrect async/await usage leading to race conditions
- Mathematical errors in calculations

### Medium Priority Indicators

**Unclear Code Flow:**
- Functions with multiple return points without clear purpose
- Complex conditional nesting (>3 levels)
- Unclear variable naming that obscures intent
- Missing comments on non-obvious logic
- Functions doing multiple unrelated things

**Missing Error Handling:**
- Unhandled promise rejections
- Missing try-catch around risky operations
- Error swallowing (empty catch blocks)
- No error propagation strategy
- Generic error messages that don't help debugging

**Type Safety Concerns:**
- Use of `any` type without justification
- Type assertions (`as` casts) without validation
- Implicit any from missing type definitions
- Potential runtime type mismatches
- Missing null/undefined handling for optional types

**Edge Cases:**
- Empty array/collection handling
- Boundary conditions (min/max values)
- Null/undefined input scenarios
- Network failure scenarios
- Concurrent access patterns

### Low Priority Indicators

**Code Organization:**
- Long functions that could be split (>50 lines)
- Repeated code patterns that could be extracted
- File organization that doesn't match logical grouping
- Inconsistent naming patterns within same module

**Documentation:**
- Missing JSDoc/docstrings on public APIs
- Outdated comments that don't match implementation
- Missing README updates for new features
- Lack of inline comments for complex logic

**Performance Optimizations:**
- Unnecessary re-renders in React components
- Inefficient database queries (N+1 problems)
- Missing caching opportunities
- Synchronous operations that could be async

## Effective Question Framing

### Pattern 1: Understanding Intent
When code behavior is unclear, ask about the intended outcome:

**Examples:**
- "What's the expected behavior when both `userId` and `sessionId` are null?"
- "Should this function handle the case where the API returns an empty array?"
- "Is there a reason we're processing items sequentially instead of in parallel?"

### Pattern 2: Clarifying Assumptions
When code makes implicit assumptions, surface them:

**Examples:**
- "This assumes the database transaction commits successfully. What happens if it rolls back?"
- "Are we guaranteed that `user.preferences` exists, or should we add a null check?"
- "Does this rely on the events arriving in order, or can they be out of sequence?"

### Pattern 3: Exploring Edge Cases
When edge cases aren't handled, ask about the expected behavior:

**Examples:**
- "Have we considered what happens when the input array is empty?"
- "What should the UI show while this async operation is pending?"
- "How should we handle the case where the user has no permissions?"

### Pattern 4: Data Flow Tracing
When data transformations are complex, trace the flow:

**Examples:**
- "Can you walk me through how `userData` flows from the API response to the component state?"
- "Where does `config.timeout` get initialized, and what's its default value?"
- "How does an error in this middleware propagate to the error boundary?"

### Pattern 5: Security Considerations
When security implications exist, raise awareness:

**Examples:**
- "This endpoint accepts user input. Should we validate or sanitize it before passing to the database?"
- "The error message includes the user's email. Is this okay to log, or should we redact it?"
- "This token is stored in localStorage. Have we considered XSS risks?"

## Word Count Management

### Keeping Comments Concise (50-150 words)

**Structure for efficient comments:**
1. **Opening sentence:** State the concern or question
2. **Context (1-2 sentences):** Why this matters
3. **Specific example:** Point to the code
4. **Question or recommendation:** What should happen

**Example (142 words):**
> **Missing Error Handling in Database Transaction**
>
> The `createOrder()` function performs multiple database writes but doesn't handle the case where one operation succeeds and another fails. This could leave the database in an inconsistent state.
>
> Specifically, at line 45, we insert into `orders` table, then at line 52 we insert into `order_items`. If the second insert fails, we'll have an order record with no items, which violates our data model assumptions.
>
> Should we wrap these operations in a database transaction to ensure atomicity? If a transaction is already started by the caller, should we document that requirement?
>
> Alternative: Consider using a two-phase commit pattern if cross-database writes are involved.

## JIRA Integration

### Detecting JIRA References

**Common patterns in commits/PRs:**
- `FR-123: Add user preferences endpoint`
- `Fixes BUG-456: Null pointer in login flow`
- `[TD-789] Refactor authentication service`
- `Implements feature request FR-321`

**Locations to check:**
- Git commit messages
- PR title and description
- Branch names (e.g., `feature/FR-123-user-prefs`)
- File paths (e.g., modified files in `jira/feature-requests/FR-123/`)

### Saving Review Documents

**Filename format:** `code-review-YYYY-MM-DD.md`

**Path structure:**
```
jira/
├── feature-requests/FR-XXX/code-review-2025-11-09.md
├── bugs/BUG-XXX/code-review-2025-11-09.md
├── tech-debt/TD-XXX/code-review-2025-11-09.md
└── chores/CHORE-XXX/code-review-2025-11-09.md
```

If multiple reviews happen on the same day, append a counter:
- `code-review-2025-11-09-1.md`
- `code-review-2025-11-09-2.md`

## Review Anti-Patterns

### What NOT to Do

**Nitpicking Style:**
❌ "Use single quotes instead of double quotes"  
❌ "Add a space after the if statement"  
❌ "Rename `getData` to `fetchData`" (unless there's a strong naming convention)

**Subjective Preferences:**
❌ "I prefer early returns over else blocks"  
❌ "You should use a ternary here instead of if/else"  
❌ "This could be a one-liner"

**Scope Creep:**
❌ "While you're here, let's refactor the entire authentication system"  
❌ "This file needs comprehensive testing before we can review the changes"  
❌ "Can you also update the documentation for the entire API?"

**Vague Feedback:**
❌ "This looks wrong"  
❌ "Not sure about this approach"  
❌ "Can you make this better?"

### What to Do Instead

**Be Specific:**
✅ "What happens when `userId` is undefined at line 42?"  
✅ "Should we add input validation for the `email` parameter?"  
✅ "This error path doesn't seem to be handled. Is that intentional?"

**Focus on Impact:**
✅ "This could cause a memory leak if the WebSocket never closes"  
✅ "Missing this null check could crash the app for users without preferences"  
✅ "This SQL query is vulnerable to injection if `userInput` isn't sanitized"

**Provide Context:**
✅ "According to our security guidelines, we should sanitize all user input"  
✅ "The existing pattern in auth-service.ts uses JWT tokens. Should we follow that?"  
✅ "Our performance budget is 200ms for this endpoint. This synchronous operation might exceed that."

## Review Quality Checklist

Before submitting a review, verify:

- [ ] **Summary is accurate:** "What These Changes Do" matches the actual code
- [ ] **Assumptions are explicit:** All inferences are documented
- [ ] **Priorities are correct:** High priority items are truly critical
- [ ] **Word counts are within limits:** Each comment is 50-150 words
- [ ] **Questions are clear:** Each question can be answered definitively
- [ ] **Tone is collaborative:** Framed as questions/observations, not commands
- [ ] **JIRA reference checked:** If ticket exists, review is saved to correct folder
- [ ] **No style nitpicks:** Focus is on correctness and clarity, not formatting

## Common Review Scenarios

### Scenario 1: New API Endpoint

**Focus on:**
- Input validation and sanitization
- Authentication and authorization
- Error response format consistency
- Rate limiting considerations
- Documentation (OpenAPI/Swagger)

**Example questions:**
- "Should this endpoint require authentication?"
- "What happens if the request body is malformed?"
- "Is the error response format consistent with our API guidelines?"

### Scenario 2: Database Schema Changes

**Focus on:**
- Migration path from old schema
- Impact on existing queries
- Index performance implications
- Backward compatibility
- Rollback strategy

**Example questions:**
- "Do we need a migration script for existing data?"
- "Will this new column require backfilling?"
- "Have we considered the performance impact of this index?"

### Scenario 3: Frontend Component Changes

**Focus on:**
- State management patterns
- API integration correctness
- Error and loading states
- Accessibility
- Type safety of props

**Example questions:**
- "What should the UI show while the data is loading?"
- "How does this component handle API errors?"
- "Are all interactive elements keyboard accessible?"

### Scenario 4: Bug Fix

**Focus on:**
- Root cause understanding
- Test coverage for the bug
- Potential for regression
- Similar bugs elsewhere
- Error logging for future diagnosis

**Example questions:**
- "Does this fix the root cause or just the symptom?"
- "Should we add a test to prevent regression?"
- "Are there similar patterns elsewhere in the codebase that might have the same bug?"

### Scenario 5: Refactoring

**Focus on:**
- Behavior preservation
- Test coverage
- Breaking changes
- Migration complexity
- Incremental vs. big-bang approach

**Example questions:**
- "Have we verified that behavior is unchanged for all existing callers?"
- "Is this refactor covered by tests, or should we add some?"
- "Can this be done incrementally, or does it require a flag day deployment?"

## Skill Evolution

This skill should evolve based on:
- Team feedback on review quality
- Common issues discovered after merge
- Patterns that consistently get caught/missed
- Changes in coding standards or technology

Update this reference document when new patterns emerge or guidelines change.


