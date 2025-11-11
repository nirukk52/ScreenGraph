# Example Folder Structure

This is a demonstration of the folder-based JIRA pattern.

## Structure

```
FR-DEMO-example-feature/
├── FR-DEMO-main.md      ← Main ticket (start here)
├── FR-DEMO-status.md    ← Update during development
└── FR-DEMO-retro.md     ← Complete after shipping
```

## Purpose

This folder shows how each feature/bug/tech-debt item gets its own dedicated space with:
1. **Main ticket** - Core requirements and planning
2. **Status report** - Live progress tracking
3. **Retrospective** - Post-completion learning

## To Use This Pattern

Delete this example and create your own:

```bash
# For features
@create-feature-doc

# For bugs
@create-bug-doc

# For tech debt
@create-tech-debt-doc
```

See `jira/README.md` for complete documentation.










