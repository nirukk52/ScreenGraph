# Update Skills and Vibes

**Purpose:** Keep `.claude-skills/` and `vibes/` current with latest documentation, patterns, and best practices using MCP tools.

**When to Use:**
- After major library upgrades (Encore.ts, SvelteKit, Svelte 5, etc.)
- When discovering outdated patterns in skills
- Monthly maintenance cycle
- After adding new MCP tools or capabilities

---

## Overview

This command orchestrates skill and vibe maintenance using three MCP tool categories:

1. **context7** - Fetch up-to-date library documentation
2. **graphiti** - Search for existing organizational patterns
3. **skill-creator** - Follow best practices for skill updates

---

## Update Process

### Phase 1: Assess Current State

**Goal:** Understand what needs updating and why.

1. **Search Graphiti for recent skill/vibe decisions:**
   ```
   Use graphiti.search to find:
   - "skill organization" 
   - "vibe updates"
   - "MCP tool changes"
   - "library upgrade"
   ```

2. **Review skill inventory:**
   - `.claude-skills/README.md` - Task-based and knowledge-based skills
   - `vibes/README.md` - Current vibe definitions and MCP assignments

3. **Identify outdated content:**
   - Skills referencing old library versions
   - Vibes missing newly added MCP tools
   - Documentation with deprecated patterns
   - Skills that struggle in practice (see skill-creator SKILL.md lines 206-208)

---

### Phase 2: Fetch Updated Documentation

**Goal:** Get latest library docs and patterns using context7 MCP.

#### Backend Skills & Vibes

**Encore.ts (backend_vibe, backend-debugging, backend-testing):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "encore"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "testing" (for backend-testing skill)
  topic: "services" (for backend-debugging skill)
  topic: "databases" (for backend services)
  tokens: 5000 (adjust based on need)
```

**Key areas to update:**
- Testing patterns (`encore test` vs `encore run`)
- Service structure and endpoints
- Database query patterns
- Logging best practices
- PubSub/subscriptions

#### Frontend Skills & Vibes

**SvelteKit (frontend_vibe, frontend-debugging, frontend-development):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "@sveltejs/kit"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "routing" (for frontend-development)
  topic: "load functions" (for data fetching patterns)
  topic: "form actions" (for server-side forms)
  tokens: 5000
```

**Svelte 5 (all frontend skills):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "svelte"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "runes" (for $state, $derived, $effect, $props)
  topic: "snippets" (for component composition)
  tokens: 5000
```

**Playwright (qa_vibe, webapp-testing skill):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "playwright"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "testing" (for E2E patterns)
  topic: "assertions" (for test expectations)
  tokens: 5000
```

#### Infrastructure Skills & Vibes

**Tailwind CSS v4 (frontend_vibe):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "tailwindcss"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "configuration" (for Tailwind v4 updates)
  tokens: 3000
```

**Skeleton UI v4 (frontend_vibe):**
```
Use mcp_context7_resolve-library-id:
  libraryName: "@skeletonlabs/skeleton"

Then use mcp_context7_get-library-docs:
  context7CompatibleLibraryID: [result from resolve]
  topic: "components" (for UI patterns)
  tokens: 3000
```

---

### Phase 3: Update Skills Using Skill-Creator Patterns

**Goal:** Apply best practices from skill-creator SKILL.md when updating skills.

#### Refer to Skill-Creator SKILL.md

Before updating any skill, review `.claude-skills/skill-creator_skill/SKILL.md`:

- **Lines 13-16:** Remember skills are "onboarding guides" for specialized domains
- **Lines 206-208:** Update based on real usage struggles and inefficiencies
- **Step 4 (Lines 155-174):** Follow editing guidelines for SKILL.md updates
- **Progressive Disclosure (Lines 78-85):** Keep SKILL.md lean, use references/ for detailed docs

#### For Task-Based Skills (skills.json)

**Update Pattern:**
1. Review skill description for clarity
2. Verify Task command still exists and works
3. Update description with new capabilities or patterns
4. Test skill triggers with natural language

**Example Update:**
```json
// Before
{
  "name": "regenerate-encore-client",
  "description": "Regenerate frontend client after backend changes",
  "command": "task founder:workflows:regen-client"
}

// After (with context7 insights)
{
  "name": "regenerate-encore-client",
  "description": "Regenerate type-safe frontend client after backend API changes (supports Encore endpoints, subscriptions, and remote functions)",
  "command": "task founder:workflows:regen-client"
}
```

#### For Knowledge-Based Skills (SKILL.md files)

**Update Pattern:**
1. Load skill's SKILL.md into context
2. Identify sections with outdated patterns (compare with context7 docs)
3. Update using imperative/infinitive form (per skill-creator lines 167-168)
4. Add new patterns to `references/` if detailed (keep SKILL.md lean)
5. Test skill on real task to verify improvements

**Example Update Areas:**

**backend-debugging_skill/SKILL.md:**
- Phase 2: Service Introspection → Update with latest `encore-mcp` tool patterns
- Phase 3: Database Inspection → Update with new query patterns from context7
- Phase 5: Testing → Clarify `encore test` vs `encore run` (from context7 docs)

**frontend-development_skill/SKILL.md:**
- Svelte 5 runes patterns → Update with latest `$state`/`$derived`/`$effect` usage
- SvelteKit routing → Update with new route patterns from context7
- Load functions → Update with latest data fetching patterns

**webapp-testing_skill/SKILL.md:**
- Playwright patterns → Update with latest assertion methods
- Browser automation → Update with new Playwright APIs
- Test organization → Update with modern best practices

---

### Phase 4: Update Vibes with New Capabilities

**Goal:** Ensure vibes reflect current MCP tools and documentation.

#### For Each Vibe File

1. **Review `mcp_tools` field:**
   - Are all listed tools still accurate?
   - Are there new MCP tools that should be added?
   - Do `when_to_use` and `key_operations` reflect current capabilities?

2. **Review `documentation` field:**
   - Are file paths still correct?
   - Are referenced docs up-to-date?

3. **Review `claude_skills` field:**
   - Are skill names correct (check against `.claude-skills/`)?
   - Are new skills missing?

4. **Review `task_commands` field:**
   - Do commands match `.cursor/commands/` Taskfiles?
   - Are descriptions accurate (5 words or fewer)?

**Example Vibe Update:**

```json
// backend_vibe.json - Add context7 documentation field
{
  "mcp_tools": [
    {
      "name": "encore-mcp",
      "purpose": "Introspect Encore services, databases, traces",
      "when_to_use": [
        "Debug service behavior",
        "Inspect database schemas",
        "Analyze request traces"
      ],
      "key_operations": [
        "mcp_encore-mcp_get_services",
        "mcp_encore-mcp_get_databases", 
        "mcp_encore-mcp_get_traces",
        "mcp_encore-mcp_query_database"
      ]
    },
    {
      "name": "context7",
      "purpose": "Fetch up-to-date Encore.ts documentation",
      "when_to_use": [
        "Verify current API patterns",
        "Check latest testing practices",
        "Update skill documentation"
      ],
      "key_operations": [
        "mcp_context7_resolve-library-id (libraryName: 'encore')",
        "mcp_context7_get-library-docs (topic: 'services'|'testing'|'databases')"
      ]
    }
  ]
}
```

---

### Phase 5: Update Root Documentation

**Goal:** Keep root docs synchronized with vibe/skill capabilities.

#### Files to Update

1. **vibes/README.md:**
   - Update vibe descriptions if MCP tools changed
   - Update decision tree if new vibes added
   - Update tool assignment matrix

2. **.claude-skills/README.md:**
   - Update skill inventory
   - Update skill descriptions if capabilities changed
   - Update examples with new patterns

3. **CLAUDE.md:**
   - Update Quick Start if commands changed
   - Update Common Commands if new workflows added
   - Keep surgical (per founder rules)

4. **vibe_manager_vibe.json:**
   - Update `mcp_tool_assignment_strategy` if tools reassigned
   - Update `skill_organization_strategy` if new skill types added
   - Update `workflow_patterns` if procedures changed

---

### Phase 6: Validate and Document Changes

**Goal:** Ensure updates work and capture decisions.

#### Validation Steps

1. **Test updated skills:**
   ```
   For task-based: Say the natural language trigger
   For knowledge-based: Load skill and run representative task
   ```

2. **Test updated vibes:**
   ```
   "Load [vibe_name] and [representative task]"
   Verify MCP tools are accessible
   Verify documentation loads correctly
   ```

3. **Run quality checks:**
   ```
   task founder:rules:check   # Founder rules compliance
   ```

#### Document in Graphiti

**Capture update decisions:**
```
Use graphiti.add_episode to record:
- Which skills/vibes were updated and why
- What library versions prompted the update
- What patterns changed (old vs new)
- Any struggles encountered during update
- Lessons learned for next update cycle
```

**Example episode:**
```
Title: "Updated backend skills for Encore 1.x testing patterns"
Content: "Updated backend-testing_skill and backend-debugging_skill to reflect
Encore 1.x distinction between 'encore test' (isolated runtime, no subscriptions
unless imported) and 'encore run' (full environment with live services). Added
references to encore-mcp tools for debugging test isolation issues. Key insight:
skills were showing 'encore run' patterns when 'encore test' was correct."

Entities: [backend-testing_skill, backend-debugging_skill, encore-mcp, context7]
```

---

## Common Update Scenarios

### Scenario 1: Library Major Version Upgrade

**Example:** Svelte 4 → Svelte 5

1. Fetch Svelte 5 docs via context7
2. Identify breaking changes (Class API → Runes)
3. Update frontend-development skill with new rune patterns
4. Update frontend-debugging skill with new debugging approaches
5. Update frontend_vibe documentation field with Svelte 5 references
6. Test skills on real Svelte 5 code
7. Document migration patterns in Graphiti

### Scenario 2: New MCP Tool Added

**Example:** Adding Stripe MCP

1. Add tool config to `.cursor/mcp.json` (or `mcp.local.json`)
2. Determine which vibe should own it (likely backend_vibe or infra_vibe)
3. Add to vibe's `mcp_tools` field with purpose/when_to_use/key_operations
4. Consider if new skill needed (e.g., `stripe-integration_skill`)
5. Update vibes/README.md with tool assignment
6. Document assignment decision in Graphiti

### Scenario 3: Skill Struggles in Practice

**Example:** webapp-testing skill missing Playwright codegen patterns

1. Notice struggle: "I keep having to explain Playwright codegen"
2. Fetch latest Playwright docs via context7 (topic: "codegen")
3. Add codegen workflow to webapp-testing_skill/SKILL.md
4. Consider adding codegen script to `scripts/` if repeatedly used
5. Test updated skill on real testing task
6. Document improvement in Graphiti

### Scenario 4: Task Command Refactor

**Example:** QA commands consolidated (qa:smoke:backend, qa:smoke:frontend, qa:smoke:all)

1. Update task-based skills in `.claude-skills/skills.json`
2. Update vibe `task_commands` fields
3. Update `.claude-skills/README.md` examples
4. Update CLAUDE.md common commands
5. Test natural language triggers still work
6. Document consolidation rationale in Graphiti

---

## Quality Checklist

After completing updates:

### Skills
- ✓ Task-based skills map to actual Task commands
- ✓ Knowledge-based skills tested on real tasks
- ✓ SKILL.md uses imperative/infinitive form
- ✓ References/ used for detailed docs (SKILL.md stays lean)
- ✓ Skill naming conventions followed (_skill suffix)

### Vibes
- ✓ All vibes extend base_vibe
- ✓ MCP tools assigned based on domain relevance
- ✓ Tool descriptions include when_to_use and key_operations
- ✓ Documentation field references are valid
- ✓ Task commands match Taskfile reality

### Documentation
- ✓ vibes/README.md reflects current state
- ✓ .claude-skills/README.md reflects current state
- ✓ CLAUDE.md stays surgical (quick reference only)
- ✓ No duplication with .cursor/rules/ files

### Graphiti
- ✓ Update decisions documented as episodes
- ✓ Library version changes captured
- ✓ Pattern changes (old vs new) recorded
- ✓ Related entities linked

---

## MCP Tool Reference

### context7 (Library Documentation)

**Resolve Library ID:**
```
mcp_context7_resolve-library-id
  libraryName: "encore" | "@sveltejs/kit" | "svelte" | "playwright" | etc.
```

**Fetch Documentation:**
```
mcp_context7_get-library-docs
  context7CompatibleLibraryID: [from resolve-library-id]
  topic: "routing" | "testing" | "services" | "runes" | etc.
  tokens: 3000-5000 (higher = more context)
```

### graphiti (Knowledge Management)

**Search Patterns:**
```
graphiti.search
  query: "skill organization" | "vibe updates" | "library upgrade" | etc.
```

**Document Decisions:**
```
graphiti.add_episode
  title: "Brief episode title"
  content: "What changed, why, key insights"
  entities: [relevant skill/vibe/tool names]
```

### skill-creator (Best Practices)

**Reference for skill updates:**
- Located: `.claude-skills/skill-creator_skill/SKILL.md`
- Key sections: Lines 13-16 (philosophy), 155-174 (editing), 206-208 (iteration)

---

## Maintenance Schedule

### Monthly (Routine)
- Scan for new library versions via context7
- Review Graphiti for skill/vibe improvement opportunities
- Quick validation of all task-based skill commands

### Quarterly (Deep)
- Full library documentation refresh via context7
- Review all knowledge-based skills for accuracy
- Vibe MCP tool audit (remove unused, add missing)
- Root documentation synchronization

### Ad-Hoc (As Needed)
- After major library upgrades
- When new MCP tools added
- When skills struggle in practice
- Before onboarding new team members

---

## Related Documentation

- `.claude-skills/skill-creator_skill/SKILL.md` - Skill creation best practices
- `.claude-skills/README.md` - Current skill inventory
- `vibes/README.md` - Vibe system architecture
- `vibes/vibe_manager_vibe.json` - This vibe's capabilities
- `.cursor/rules/founder_rules.mdc` - Non-negotiable standards
- `CLAUDE.md` - Project quick reference

---

**Last Updated:** 2025-11-12  
**Owner:** vibe_manager_vibe  
**Prerequisites:** Load vibe_manager_vibe before running this command

