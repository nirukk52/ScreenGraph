# Code Review Skill

**Category:** Quality  
**Type:** Knowledge-based skill  
**Status:** Active

## Purpose

Conduct focused, structured code reviews that emphasize understanding over criticism. Reviews prioritize questions about ambiguity and code/data flow rather than nitpicking style.

## When to Use

- Reviewing pull requests or code changes
- Analyzing diffs before merge
- Evaluating code quality
- When explicitly asked to "review this code"
- When JIRA tickets reference code changes

## Key Features

✅ **Structured Format:** Consistent review structure with summary, assumptions, and priority-based feedback  
✅ **Question-Focused:** Frames feedback as questions rather than commands  
✅ **Priority-Based:** Organizes feedback into High/Medium/Low priority  
✅ **Concise:** Enforces 50-150 word limit per comment  
✅ **JIRA Integration:** Automatically saves reviews to ticket folders when references detected  
✅ **No Nitpicking:** Focuses on correctness, clarity, and data flow—not style

## Usage

### Trigger the Skill

Say to Claude:
```
"Review this code"
"Conduct a code review for these changes"
"Use the code-review skill to analyze this PR"
```

Or explicitly mention when analyzing code:
```
"I need a focused code review following our guidelines"
```

### Review Format

Every review produces:

1. **What These Changes Do** (3-5 bullet points)
2. **Assumptions** (brief bullets)
3. **High Priority Comments** (critical issues, 50-150 words each)
4. **Medium Priority Comments** (concerns/questions, 50-150 words each)
5. **Low Priority Comments** (suggestions, 50-150 words each)

### JIRA Integration

If the code references a JIRA ticket (e.g., `FR-123`, `BUG-456`), the review is automatically saved to:

```
jira/{category}/{ticket-id}/code-review-{YYYY-MM-DD}.md
```

Examples:
- `jira/feature-requests/FR-123/code-review-2025-11-09.md`
- `jira/bugs/BUG-456/code-review-2025-11-09.md`
- `jira/tech-debt/TD-789/code-review-2025-11-09.md`

## Review Principles

### DO Focus On
✅ Understanding code intent and flow  
✅ Asking questions about ambiguity  
✅ Identifying security and correctness issues  
✅ Flagging unclear data flow  
✅ Noting missing error handling  

### DON'T Focus On
❌ Nitpicking style preferences  
❌ Subjective organization debates  
❌ Minor naming suggestions  
❌ Formatting (linters handle this)  
❌ Personal syntax preferences  

## Resources

### SKILL.md
Main skill documentation with:
- Complete review process (7 steps)
- Priority classification guidelines
- Question framing patterns
- JIRA integration workflow
- Anti-patterns to avoid

### assets/review-template.md
Pre-formatted template for consistent reviews. Copy and populate all sections.

### references/review-guidelines.md
Expanded guidance including:
- Priority classification indicators
- Effective question framing patterns
- Word count management tips
- JIRA integration details
- Common review scenarios
- Anti-patterns and best practices

## Examples

### High Priority Comment (Security)
> **SQL Injection Risk in User Query**
>
> The `getUserData()` function at line 42 concatenates user input directly into the SQL query without sanitization. This creates an SQL injection vulnerability where malicious input could execute arbitrary database commands.
>
> Should we use parameterized queries here instead? Our security guidelines in `.cursor/rules/founder_rules.mdc` require all user input to be validated before database operations.

### Medium Priority Comment (Clarity)
> **Unclear Error Flow in Async Handler**
>
> What happens when the API call at line 78 rejects? The promise doesn't have a `.catch()` handler, and I don't see error handling in the calling function. This could result in unhandled promise rejections that crash the app.
>
> Should we add error handling here, or is there an error boundary higher in the call stack that we're relying on?

### Low Priority Comment (Organization)
> **Consider Extracting Validation Logic**
>
> The validation logic in `processUserInput()` (lines 112-145) could be extracted into a separate utility function for reusability. Several other endpoints perform similar validation, and extracting this would reduce duplication and make updates easier in the future.

## Integration with Workflow

### Before Code Review
1. Ensure changes are ready for review
2. Check if JIRA ticket exists
3. Have commit messages/PR descriptions available

### During Code Review
1. Claude reads through changes
2. Identifies scope and impact
3. Checks for JIRA references
4. Analyzes code flow and logic
5. Formulates priority-based questions
6. Generates structured review

### After Code Review
1. Review saved to JIRA folder (if applicable) or presented inline
2. Developer addresses High priority items
3. Discussion on Medium priority questions
4. Low priority items tracked for future

## Skill Maintenance

Update this skill when:
- New code review patterns emerge
- Team feedback reveals gaps
- Common issues consistently missed
- Coding standards change

## Related Skills

- **check-founder-rules** - Automated founder rules validation
- **typecheck-frontend** - TypeScript type checking
- **lint-frontend** - Linting checks
- **backend-debugging** - Systematic backend debugging
- **frontend-debugging** - Systematic frontend debugging

## Skill Metadata

**Created:** 2025-11-09  
**Last Updated:** 2025-11-09  
**Version:** 1.0  
**Maintainer:** Founder




