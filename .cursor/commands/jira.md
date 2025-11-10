---
name: Jira Command Palette
description: Quick links for creating or updating Jira artifacts from Cursor chat.
---

# Jira Management Shortcuts

## Create Items
- `@create-feature-doc` → scaffold FR folder (`jira/feature-requests/FR-XXX-title/`)
- `@create-bug-doc` → scaffold BUG folder (`jira/bugs/BUG-XXX-title/`)
- `@create-tech-debt-doc` → scaffold TD folder (`jira/tech-debt/TD-XXX-title/`)
- `@create-chore` → scaffold CHORE folder (`jira/chores/CHORE-XXX-title/`)

## Update Existing Items
- `@update-feature-doc` → append structured handoff entry to selected feature
- `@update-bug-doc` → append structured handoff entry to selected bug
- `@update-tech-debt-doc` → append structured handoff entry to selected tech-debt item

## Need a Refresher?
- Open `.cursor/commands/README-JIRA-COMMANDS.md` for full prompts, naming rules, and examples.
- All templates live inside the `jira/` tree; customize there if formats change.
- After any edits, run `update-handoff [ITEM-ID]` to sync the central summary.

