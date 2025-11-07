# FR-012: Document Management & Cross-Reference System

**Feature ID**: FR-012  
**Title**: Document Management & Cross-Reference System  
**Priority**: P2 (High - Developer Experience)  
**Status**: 📝 Proposed  
**Owner**: TBD  
**Created**: 2025-11-07

---

## 📋 Summary

Build a lightweight document management system that enables structured communication and cross-referencing between bugs, features, and tech debt. The system should make it easy to:
- Link related work items (e.g., "Bug-003 blocks FR-012")
- Track dependencies and blockers
- Auto-generate status reports
- Maintain project knowledge graph
- Find all work related to a specific component

---

## 🎯 Business Value

### Problem Statement

**Current Pain Points**:
1. **Lost Context**: Hard to find "why we did X" months later
2. **Hidden Dependencies**: Don't know Bug-003 blocks FR-012 until too late
3. **Duplicate Work**: Multiple teams/agents solving same problem
4. **Knowledge Silos**: Information buried in individual ticket files
5. **No Timeline View**: Can't see "what happened when" across all work

**Impact**:
- Wasted time rediscovering context
- Delayed features due to unknown blockers
- Inconsistent documentation
- Difficult onboarding for new developers/agents

### Solution Vision

**A lightweight system that**:
- Lives in Git (no external tools)
- Uses simple markdown files
- Provides CLI commands for common operations
- Auto-generates reports and graphs
- Makes knowledge discoverable

**Success Metrics**:
- Time to find related work: < 30 seconds
- Documentation coverage: > 90% of work items linked
- Knowledge retention: Context survives 6+ months
- Onboarding speed: New dev/agent productive in < 1 hour

---

## 🏗️ Technical Design

### File Structure

```
jira/
├── bugs/
│   ├── BUG-001-issue-name/
│   │   ├── BUG-001-main.md          # Main ticket
│   │   ├── BUG-001-status.md        # Status updates
│   │   ├── BUG-001-retro.md         # Post-fix retrospective
│   │   └── .meta.json               # Metadata for cross-refs
│   └── TEMPLATE-*.md
│
├── feature-requests/
│   ├── FR-001-feature-name/
│   │   ├── FR-001-main.md
│   │   ├── FR-001-status.md
│   │   ├── FR-001-retro.md
│   │   └── .meta.json
│   └── TEMPLATE-*.md
│
├── tech-debt/
│   ├── TD-001-debt-name/
│   │   ├── TD-001-main.md
│   │   ├── TD-001-status.md
│   │   ├── TD-001-retro.md
│   │   └── .meta.json
│   └── TEMPLATE-*.md
│
├── .index/
│   ├── work-items.json              # All work items index
│   ├── dependencies.json            # Dependency graph
│   ├── timeline.json                # Chronological timeline
│   └── components.json              # Component → work items map
│
└── scripts/
    ├── link.mjs                     # Create cross-references
    ├── status.mjs                   # Generate status reports
    ├── timeline.mjs                 # Generate timeline view
    └── graph.mjs                    # Generate dependency graph
```

### Metadata Format (.meta.json)

```json
{
  "id": "FR-012",
  "type": "feature",
  "title": "Document Management System",
  "status": "in_progress",
  "priority": "P2",
  "owner": "agent-xyz",
  "created": "2025-11-07T00:00:00Z",
  "updated": "2025-11-07T12:30:00Z",
  
  "relationships": {
    "blocks": ["FR-013", "FR-014"],
    "blocked_by": ["BUG-003"],
    "relates_to": ["TD-005"],
    "depends_on": [],
    "required_by": []
  },
  
  "components": [
    "jira/",
    "scripts/",
    ".cursor/commands/"
  ],
  
  "tags": [
    "documentation",
    "developer-experience",
    "tooling"
  ],
  
  "timeline": [
    {
      "date": "2025-11-07T00:00:00Z",
      "event": "created",
      "note": "Initial proposal"
    },
    {
      "date": "2025-11-07T12:00:00Z",
      "event": "status_change",
      "from": "proposed",
      "to": "in_progress"
    }
  ]
}
```

---

## 🎨 User Interface (CLI Commands)

### @link-work-items

**Purpose**: Create relationships between work items

```bash
# Link items
@link-work-items BUG-003 blocks FR-012
@link-work-items FR-012 relates-to TD-005
@link-work-items FR-013 depends-on FR-012

# Output
✅ Linked: BUG-003 blocks FR-012
   Updated: jira/bugs/BUG-003-*/. meta.json
   Updated: jira/feature-requests/FR-012-*/.meta.json
   Updated: jira/.index/dependencies.json
```

### @work-status

**Purpose**: Get status of work item or generate reports

```bash
# Single item status
@work-status FR-012

# Output
FR-012: Document Management System
Status: In Progress (updated 2 hours ago)
Owner: agent-xyz
Progress: 40% (2/5 tasks completed)

Blocking: FR-013, FR-014
Blocked by: BUG-003 (Critical - port isolation)

Recent updates:
  - 2h ago: Phase 1 complete (file structure)
  - 5h ago: Started implementation

# All work in progress
@work-status --all

# Component-specific
@work-status --component jira/
```

### @work-timeline

**Purpose**: Generate chronological timeline

```bash
@work-timeline --since 7d

# Output
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Work Timeline (Last 7 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2025-11-07 (Today)
  🐛 BUG-003: Escalated to P0 (port isolation violation)
  ✨ FR-012: Created (document management)
  
2025-11-06
  🐛 BUG-003: Created (port coordinator offset)
  🔧 TD-005: Completed (simplify authentication)
  
2025-11-05
  ✨ FR-011: Started (port management worktrees)
  🔧 TD-004: Created (remove unused dependencies)

# Filter by type
@work-timeline --type bug --since 30d

# Filter by component
@work-timeline --component backend/agent/
```

### @work-graph

**Purpose**: Visualize dependencies

```bash
@work-graph FR-012

# Output (ASCII graph)
FR-012 [Document Management]
  ├─ blocks → FR-013 [Timeline UI Integration]
  ├─ blocks → FR-014 [AI Agent Memory]
  ├─ blocked by ← BUG-003 [Port Isolation] ⚠️ CRITICAL
  └─ relates to ~ TD-005 [Simplify Auth]

BUG-003 [Port Isolation]
  ├─ blocks → FR-012
  ├─ blocks → FR-013
  └─ status: IN_PROGRESS (P0)

# Generate DOT graph for visualization
@work-graph --format dot > graph.dot
dot -Tpng graph.dot -o dependencies.png
```

### @find-work

**Purpose**: Search work items

```bash
# By component
@find-work --component backend/agent/

# By tag
@find-work --tag authentication

# By relationship
@find-work --blocked-by BUG-003

# By text
@find-work "port isolation"

# Output
Found 3 work items:

🐛 BUG-003: Port Isolation Violation (P0, In Progress)
   Components: scripts/, frontend/src/lib/
   Tags: port-management, multi-agent
   
✨ FR-011: Port Management Worktrees (P1, Blocked)
   Blocked by: BUG-003
   
✨ FR-012: Document Management (P2, In Progress)
   Blocked by: BUG-003
```

---

## 🔧 Implementation Details

### Phase 1: Core Infrastructure (Week 1)

**Deliverables**:
- [ ] `.meta.json` schema defined
- [ ] Index generation scripts
- [ ] `@link-work-items` command
- [ ] Basic validation (detect broken links)

**Files to Create**:
```
jira/scripts/
├── lib/
│   ├── meta.mjs          # Read/write .meta.json
│   ├── index.mjs         # Generate indexes
│   └── validate.mjs      # Validate relationships
│
├── link.mjs              # @link-work-items
└── rebuild-index.mjs     # Rebuild all indexes
```

**Example: link.mjs**
```javascript
#!/usr/bin/env bun

import { parseArgs } from 'util';
import { readMeta, writeMeta, updateIndex } from './lib/meta.mjs';

// Usage: bun jira/scripts/link.mjs BUG-003 blocks FR-012
const { positional } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true
});

const [sourceId, relationship, targetId] = positional;

// Validate inputs
if (!sourceId || !relationship || !targetId) {
  console.error('Usage: @link-work-items <source> <relationship> <target>');
  console.error('Relationships: blocks, blocked_by, relates_to, depends_on');
  process.exit(1);
}

// Update metadata
const sourceMeta = await readMeta(sourceId);
const targetMeta = await readMeta(targetId);

// Add relationship
sourceMeta.relationships[relationship] ??= [];
sourceMeta.relationships[relationship].push(targetId);

// Add inverse relationship
const inverse = {
  'blocks': 'blocked_by',
  'blocked_by': 'blocks',
  'depends_on': 'required_by',
  'required_by': 'depends_on',
  'relates_to': 'relates_to'
}[relationship];

targetMeta.relationships[inverse] ??= [];
targetMeta.relationships[inverse].push(sourceId);

// Save
await writeMeta(sourceId, sourceMeta);
await writeMeta(targetId, targetMeta);

// Rebuild indexes
await updateIndex();

console.log(`✅ Linked: ${sourceId} ${relationship} ${targetId}`);
```

---

### Phase 2: Status & Reports (Week 2)

**Deliverables**:
- [ ] `@work-status` command
- [ ] `@work-timeline` command
- [ ] Auto-generated status reports
- [ ] Slack/Discord integration (optional)

**Files to Create**:
```
jira/scripts/
├── status.mjs            # @work-status
├── timeline.mjs          # @work-timeline
└── report.mjs            # Generate reports
```

---

### Phase 3: Dependency Graph (Week 3)

**Deliverables**:
- [ ] `@work-graph` command
- [ ] DOT graph generation
- [ ] Critical path analysis
- [ ] Blocker detection

**Files to Create**:
```
jira/scripts/
├── graph.mjs             # @work-graph
├── critical-path.mjs     # Find blockers
└── health-check.mjs      # Detect issues
```

---

### Phase 4: Search & Discovery (Week 4)

**Deliverables**:
- [ ] `@find-work` command
- [ ] Full-text search
- [ ] Component mapping
- [ ] Tag-based discovery

**Files to Create**:
```
jira/scripts/
├── search.mjs            # @find-work
├── tag.mjs               # Manage tags
└── component-map.mjs     # Component → work map
```

---

## 📚 Usage Examples

### Example 1: New Bug Discovery

```bash
# 1. Create bug
@create-bug BUG-004 "Frontend crashes on empty data"

# 2. Link to related work
@link-work-items BUG-004 relates-to FR-008

# 3. Update component mapping (auto-detected from files changed)
# .meta.json updated automatically

# 4. Check what else touches this component
@find-work --component frontend/src/lib/api.ts

# Output: Shows FR-008, BUG-002 also touch this file
```

---

### Example 2: Planning New Feature

```bash
# 1. Create feature
@create-feature FR-015 "Real-time collaboration"

# 2. Check dependencies
@work-graph FR-015

# Output shows: Depends on FR-012 (doc system) for change tracking

# 3. Link dependency
@link-work-items FR-015 depends-on FR-012

# 4. Get critical path
@work-graph --critical-path FR-015

# Output: FR-012 → FR-015 (must finish FR-012 first)
```

---

### Example 3: Sprint Planning

```bash
# Get all unblocked work
@find-work --status planned --not-blocked

# Get work by priority
@find-work --priority P0 --status in_progress

# Generate sprint report
@work-status --report --since 14d > sprint-report.md
```

---

## ✅ Acceptance Criteria

### Core Functionality
- [ ] Can create `.meta.json` for any work item
- [ ] Can link work items with relationships
- [ ] Indexes update automatically on changes
- [ ] Broken links detected and reported

### Commands
- [ ] `@link-work-items` creates bidirectional links
- [ ] `@work-status` shows current state + blockers
- [ ] `@work-timeline` generates chronological view
- [ ] `@work-graph` visualizes dependencies
- [ ] `@find-work` searches by multiple criteria

### Data Integrity
- [ ] No orphaned references (all links valid)
- [ ] No circular dependencies detected
- [ ] Indexes rebuild in < 1 second
- [ ] Git-friendly (merge conflicts rare)

### Documentation
- [ ] All commands documented
- [ ] Examples for common workflows
- [ ] Migration guide from current structure
- [ ] Video walkthrough

---

## 🚧 Technical Challenges

### Challenge 1: Merge Conflicts

**Problem**: Multiple agents editing `.meta.json` simultaneously

**Solution**: 
- Use append-only timeline in metadata
- Rebuild indexes from source of truth (ticket files)
- Provide merge helper command: `@resolve-work-conflicts`

### Challenge 2: Keeping Indexes Fresh

**Problem**: Indexes can get stale if .meta.json updated manually

**Solution**:
- Git post-commit hook runs `@rebuild-index`
- Validation command warns about stale data
- Indexes are cheap to rebuild (< 1s)

### Challenge 3: Discoverability

**Problem**: Developers might not know system exists

**Solution**:
- Auto-add cross-reference hints in templates
- CLI suggests related work when creating items
- Onboarding checklist includes linking first item

---

## 📊 Success Metrics

### Adoption
- **Target**: 90% of new work items have `.meta.json`
- **Measure**: Count files with metadata vs without

### Usage
- **Target**: Average 5+ links per work item
- **Measure**: Parse relationships in metadata

### Value
- **Target**: 50% reduction in "find related work" time
- **Measure**: Developer surveys / agent logs

### Quality
- **Target**: Zero broken links
- **Measure**: `@validate-work-items` reports

---

## 🔗 Related Work

**Blocks**:
- FR-013: Timeline UI (needs doc system for data)
- FR-014: AI Agent Memory (needs knowledge graph)

**Blocked By**:
- BUG-003: Port Isolation (need to fix before testing this feature)

**Relates To**:
- TD-005: Simplify Auth (similar metadata pattern)

**Dependencies**:
- None (standalone feature)

---

## 📝 Notes

### Why Not Use [External Tool]?

**Jira/Linear/GitHub Projects**:
- ❌ Not Git-native (data lives outside repo)
- ❌ Requires API access / authentication
- ❌ Can't work offline
- ✅ Our system: Everything in Git, works offline, no external dependencies

**Obsidian/Notion**:
- ❌ Manual linking (error-prone)
- ❌ Not CLI-friendly (can't automate)
- ✅ Our system: CLI commands, automated, programmable

**Git Commit Messages**:
- ❌ Linear only (no graph structure)
- ❌ Hard to query
- ✅ Our system: Graph-based, queryable, structured

### Design Principles

1. **Git-Native**: Everything lives in Git (version control + backup)
2. **CLI-First**: Commands for automation
3. **Human-Readable**: Markdown for tickets, JSON for metadata
4. **Lightweight**: No databases, no servers
5. **AI-Friendly**: Easy for agents to parse and update

---

## Release Plan (PROC-001)

- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@test-default-run` passes on this worktree
  - [ ] All 4 phases implemented and tested
  - [ ] Migration script for existing work items
- Handoff:
  - After merge to main, run `@update_handoff` and choose the "Production Release Update" workflow
- Notes:
  - This is internal tooling (no frontend version bump)
  - Tag format: `tools-v1.0.0-doc-management`

## Worktree Setup Quicklinks

- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh` (not needed for this feature)
- Start Frontend: `./scripts/dev-frontend.sh` (not needed for this feature)
- Smoke Test: `@test-default-run` (not applicable - tooling only)

