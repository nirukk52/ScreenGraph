## Execution Plan
- **Phase 1 – Discovery & Alignment**
  - Inventory existing rule docs (historic `backend_engineer.mdc`, `backend_llm_instructions.mdc`, now consolidated into `backend_coding_rules.mdc`) and map overlapping sections. Use Context7 MCP to cross-check Encore.ts best-practice structure.
  - Capture current naming references (skills, commands) using `rg` and log into Graphiti for traceability.
  - Identify documentation mismatches and log clarifying questions (see below).
- **Phase 2 – Naming Convention Rollout**
  - Once answers arrive, rename rule docs to the final `_rules` schema (e.g., candidate `backend_coding_rules.mdc`) and update all references.
  - Convert skill directories to `_skill` suffix while preserving interior `SKILL.md` files; update `skills.json` and doc references.
  - Translate `.cursor/commands` entries into ≤5-word natural phrases and adjust Taskfiles/skills referencing them.
- **Phase 3 – Backend MCP Packaging**
  - Create the requested backend engineer MCP artifact (structure TBD pending clarification), linking to the consolidated rules.
  - Use Graphiti MCP to document the new workflow and archive obsolete guidance.
- **Phase 4 – Graphiti Skill Conversion**
  - Migrate `graphiti_mcp_usage_guide` content into a `_skill` directory, wiring it into `skills.json`.
  - Validate consistency with existing skill taxonomy and automation hooks.
- **Phase 5 – Validation & Knowledge Capture**
  - Re-run reference scans, `task founder:rules:check`, and any impacted tests.
  - Update Graphiti with final architecture of docs/skills and retire superseded artifacts.

## TODOs (Awaiting Answers)
- Confirm target name/structure for merged backend rules document.
- Clarify deliverable for backend engineer MCP artifact.
- Align on revised skill naming rule (directories vs. files) and update founder rules accordingly.
- Define desired naming for the new Graphiti usage skill directory.

## TODOs (Ready to Stage Once Unblocked)
- Prepare `rg` scripts to rewrite references after rename decisions.
- Draft `skills.json` updates for `_skill` suffix adoption.
- Outline command rename matrix for `.cursor/commands/` entries.
- Queue Graphiti memory updates describing the new documentation hierarchy.

## Decisions / Clarifications
1. **Backend rules naming**: ✅ Use `backend_coding_rules.mdc` (ending with `_rules`) to replace both legacy documents.
2. **Backend MCP artifact**: ✅ Add a root `.mcp/` folder containing `as_a_backend_engineer.json`, `as_a_frontend_engineer.json`, and `as_an_infra_engineer.json`.
3. **Skill naming requirement**: ✅ Apply the `_skill` rule to directories only; retain `SKILL.md` filenames.
4. **Graphiti skill naming**: ✅ Convert to `graphiti-mcp-usage_skill/` and categorize it under a new `graphiti` bucket in `skills.json`.

1. Consolidate backend rules
Merge backend_engineer.mdc + backend_llm_instructions.mdc into backend_coding_rules.mdc.
Reorganize content (ensure _rules suffix) and update every reference (CLAUDE.md, skills, etc.).
2. Update founder rules
Edit founder_rules.mdc so the _skill requirement applies only to directories.
Document the new .mcp folder expectation if needed.
3. Create MCP artifacts
Add a root .mcp/ folder containing:
as_a_backend_engineer.json
as_a_frontend_engineer.json
as_an_infra_engineer.json
Capture intent in plan.md / docs for future contributors.
4. Convert Graphiti guide to skill
Rename directories to _skill, create graphiti-mcp-usage_skill/.
Add a “graphiti” category entry in skills.json.
5. Apply naming rollout to remaining skills & commands
Rename all other skill directories to _skill.
Rewrite .cursor/commands names to ≤5-word natural phrases and adjust Taskfiles/skills referencing them.
6. Verification
Run rg/fd scans to catch lingering references.
Execute task founder:rules:check and other impacted automations.
Update Graphiti with the new doc/skill relationships.
Option B — “Structure First” (Skills/Commands → MCP → Docs)

TODOs (right now: common to both orders)
- [x] Snapshot references with rg/fd before any renames.
- [x] Draft skills.json diff for _skill directories plus new graphiti category.
- [x] Design the schema/content for each MCP JSON file.
- [x] Outline backend_coding_rules.mdc structure so the merge is lossless.
- [x] Prepare founder rules edit reflecting directory-only _skill.

Some founder research (Only take what you feel like):
Phase 1 – Discovery & Alignment
ripgrep (rg) for fast repo-wide inventory and overlap scans. 
GitHub
fd to find candidate files/dirs quickly (e.g., *_rules.mdc, *_skill). 
GitHub
Comby for language-agnostic structural search to map and preview renames/refs. 
comby.dev
+1

Phase 2 – Naming Convention Rollout
rename-cli or mmv/renameutils for safe bulk file renames with dry-run. 
GitHub
+1
ast-grep where pattern safety matters (e.g., JSON/TS configs, skills.json). 
Ast Grep
+1
jscodeshift if you must refactor JS/TS imports after path changes. 
GitHub

Phase 3 – Backend MCP Packaging
Model Context Protocol (MCP) spec + official org for building/packaging your “backend engineer MCP” server. 
Model Context Protocol
+1
Overview/background on MCP adoption to guide ecosystem choices. 
The Verge
+1