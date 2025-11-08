---
name: graphiti-mcp-usage
description: Workflow for using Graphiti MCP tools to capture preferences, procedures, and facts consistently.
---

# Graphiti MCP Usage Skill

This skill explains how to use the Graphiti knowledge graph effectively. Follow it whenever you need to look up or store ScreenGraph preferences, procedures, or factual relationships.

## Before You Start

1. **Search for existing knowledge.**
   - Use `search_nodes` to look for Preferences or Procedures tied to your task.
   - Use `search_facts` to explore relationships and factual context.
   - Filter by entity type (`"Preference"`, `"Procedure"`) to narrow the results.
   - Review every match before making new assumptions.
2. **Capture requirements immediately.**
   - When a user states a requirement or preference, call `add_episode` right away.
   - Split long requirements into logical chunks.
   - Explicitly mark when you are updating existing knowledge instead of creating new entries.
3. **Document procedures and facts.**
   - Confirmed workflows become Procedures.
   - Relationships between entities become Facts.
   - Tag each entry with specific categories for easier retrieval later.

## During Your Work

- **Respect preferences.** Align your work with every preference you discover.
- **Follow procedures exactly.** Execute the stored steps without deviation.
- **Apply factual context.** Use recorded facts to inform implementation details and recommendations.
- **Stay consistent.** Ensure your narrative and actions match the graph’s established knowledge.

## Best Practices

| Core Principle | Quick Action |
| --- | --- |
| Know Your Context | Run `search_nodes` for Preferences & Procedures before starting. |
| Know the Relationships | Use `search_facts` to surface supporting data. |
| Be Efficient | Filter nodes immediately by specifying `"Preference"` or `"Procedure"`. |
| Be Thorough | Review all matches to avoid redundant knowledge. |
| Don’t Lose Context | Use `add_episode` immediately for new or updated requirements. |
| Define the “How” | Record workflows as Procedures. |
| Define the “What” | Record entity relationships as Facts. |
| Tag Everything | Use clear categories for every Preference and Procedure. |

## Summary Checklist

- [ ] Search nodes for Preferences/Procedures.
- [ ] Search facts for supporting relationships.
- [ ] Capture new requirements or updates with `add_episode`.
- [ ] Store workflows as Procedures and relationships as Facts.
- [ ] Tag entries with clear categories for future retrieval.

Remember: **the Graphiti knowledge graph *is* your memory.** Use it consistently to deliver personalized, context-aware assistance.
