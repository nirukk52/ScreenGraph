# Claude Skills for ScreenGraph Backend

This directory contains Claude Skills that provide specialized knowledge and procedures for working with the ScreenGraph backend.

## What are Skills?

Skills are folders of instructions, scripts, and resources that Claude loads dynamically to improve performance on specialized tasks. Each skill is defined by a `SKILL.md` file containing YAML frontmatter and instructions.

For more information, see:
- [What are skills?](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Skills Blog Post](https://claude.com/blog/skills)

## Available Skills

### backend-debugging-encore
A systematic 10-phase procedure for investigating and debugging backend issues in Encore.ts applications.

**When to use:**
- Backend service not responding or endpoints returning 404
- Database tables not populating despite events being generated
- Background workers or projectors not processing data
- Schema mismatch errors or migration issues
- Event-driven flows not completing
- Performance issues or projection lag

**Key features:**
- Prioritizes Encore MCP tools for live inspection
- Provides SQL query library for common diagnostics
- Includes real-world debugging example (BUG-002)
- Covers all phases from environment setup to documentation

## Using Skills in This Project

### In Cursor
Skills in this directory are automatically available when working in this workspace.

To use a skill:
1. Mention it by name in your chat: "Use the backend-debugging-encore skill to investigate why graph tables are empty"
2. Or simply describe the problem and Claude will use the appropriate skill

### In Claude Code
Register this repository as a plugin:
```bash
/plugin marketplace add anthropics/skills
/plugin install backend-debugging-encore
```

### In Claude.ai
Skills can be uploaded through the Skills management interface for paid plans.

## Creating New Skills

To create a new skill for this project:

1. Create a new directory: `backend/.claude-skills/your-skill-name/`
2. Create a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: A clear description of what this skill does and when to use it
---

# Your Skill Name

[Add your instructions here that Claude will follow when this skill is active]

## When to Use This Skill
- Use case 1
- Use case 2

## Guidelines
- Guideline 1
- Guideline 2

## Examples
- Example usage 1
- Example usage 2
```

3. Test the skill by mentioning it in Cursor or Claude.ai

## Skill Development Guidelines

### Frontmatter Requirements
- `name`: Unique identifier (lowercase, hyphens for spaces)
- `description`: Complete description of what the skill does and when to use it

### Content Guidelines
- Be specific and actionable
- Include real-world examples
- Provide complete code snippets, not pseudocode
- Reference actual project files and patterns
- Include troubleshooting for common issues
- Keep instructions clear and sequential

### Best Practices
- Start with "When to Use This Skill" section
- Include "Key Principles" for high-level guidance
- Provide "Examples" with actual scenarios
- Add "Guidelines" for general rules
- Reference external resources when helpful

## Contributing

When adding new skills to this project:

1. Focus on project-specific procedures and patterns
2. Include real examples from the ScreenGraph codebase
3. Update this README with the new skill description
4. Test the skill thoroughly before committing
5. Document any dependencies or prerequisites

## Project-Specific Context

Skills in this directory are tailored for:
- **Backend**: Encore.ts with TypeScript
- **Database**: PostgreSQL via Encore SQLDatabase
- **Architecture**: Event-sourced projections, Pub/Sub, background workers
- **Key Services**: run, agent, graph, artifacts
- **Patterns**: ID-first state, deterministic execution, outbox pattern

Skills leverage:
- Encore MCP tools for live inspection
- Structured logging with module/actor context
- Diagnostic endpoints for observability
- SQL queries for database verification

## Resources

- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Skills Documentation](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Encore.ts Documentation](https://encore.dev/docs)
- [ScreenGraph Backend README](../BACKEND_README.md)

