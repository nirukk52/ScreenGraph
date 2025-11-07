# FR-012: Implementation Example

**Purpose**: Demonstrate how the document management system works with real examples

---

## Example 1: Linking BUG-003 with Current Work

### Step 1: Create Metadata for BUG-003

```bash
# File: jira/bugs/BUG-003-port-coordinator-main-tree-offset/.meta.json
```

```json
{
  "id": "BUG-003",
  "type": "bug",
  "title": "Port Isolation Violation - Frontend Connects to Wrong Backend",
  "status": "in_progress",
  "priority": "P0",
  "owner": "worktree-Px8w6",
  "created": "2025-11-06T20:15:00Z",
  "updated": "2025-11-07T18:30:00Z",
  
  "relationships": {
    "blocks": ["FR-012", "FR-013", "FR-014"],
    "relates_to": ["FR-011"],
    "blocked_by": []
  },
  
  "components": [
    "frontend/src/lib/getEncoreClient.ts",
    "scripts/port-coordinator.mjs",
    "scripts/dev-frontend.sh"
  ],
  
  "tags": [
    "port-management",
    "multi-agent",
    "worktree-isolation",
    "critical"
  ],
  
  "timeline": [
    {
      "date": "2025-11-06T20:15:00Z",
      "event": "created",
      "severity": "P3",
      "note": "Main tree uses offset ports instead of base ports"
    },
    {
      "date": "2025-11-07T00:12:53Z",
      "event": "test_failure",
      "test": "@test-default-run",
      "note": "Discovered frontend connects to wrong backend"
    },
    {
      "date": "2025-11-07T01:00:00Z",
      "event": "escalated",
      "from": "P3",
      "to": "P0",
      "reason": "Breaks multi-agent development completely"
    }
  ]
}
```

### Step 2: Create Metadata for FR-012

```bash
# File: jira/feature-requests/FR-012-document-management/.meta.json
```

```json
{
  "id": "FR-012",
  "type": "feature",
  "title": "Document Management & Cross-Reference System",
  "status": "proposed",
  "priority": "P2",
  "owner": "worktree-Px8w6",
  "created": "2025-11-07T18:00:00Z",
  "updated": "2025-11-07T18:30:00Z",
  
  "relationships": {
    "blocks": [],
    "blocked_by": ["BUG-003"],
    "relates_to": [],
    "depends_on": []
  },
  
  "components": [
    "jira/scripts/",
    ".cursor/commands/"
  ],
  
  "tags": [
    "documentation",
    "developer-experience",
    "tooling",
    "knowledge-management"
  ],
  
  "timeline": [
    {
      "date": "2025-11-07T18:00:00Z",
      "event": "created",
      "note": "Initial proposal after BUG-003 revealed need for cross-referencing"
    }
  ]
}
```

### Step 3: Generate Global Index

```bash
# File: jira/.index/work-items.json
```

```json
{
  "items": {
    "BUG-003": {
      "path": "jira/bugs/BUG-003-port-coordinator-main-tree-offset",
      "type": "bug",
      "title": "Port Isolation Violation",
      "status": "in_progress",
      "priority": "P0",
      "updated": "2025-11-07T18:30:00Z"
    },
    "FR-012": {
      "path": "jira/feature-requests/FR-012-document-management",
      "type": "feature",
      "title": "Document Management System",
      "status": "proposed",
      "priority": "P2",
      "updated": "2025-11-07T18:30:00Z"
    }
  },
  
  "by_priority": {
    "P0": ["BUG-003"],
    "P1": [],
    "P2": ["FR-012"],
    "P3": []
  },
  
  "by_status": {
    "proposed": ["FR-012"],
    "in_progress": ["BUG-003"],
    "completed": [],
    "blocked": []
  },
  
  "by_type": {
    "bug": ["BUG-003"],
    "feature": ["FR-012"],
    "tech_debt": []
  }
}
```

### Step 4: Generate Dependency Graph

```bash
# File: jira/.index/dependencies.json
```

```json
{
  "graph": {
    "BUG-003": {
      "blocks": ["FR-012", "FR-013", "FR-014"],
      "blocked_by": [],
      "impact_score": 3
    },
    "FR-012": {
      "blocks": [],
      "blocked_by": ["BUG-003"],
      "impact_score": 0
    }
  },
  
  "critical_path": [
    {
      "from": "BUG-003",
      "to": "FR-012",
      "blocker": true
    }
  ],
  
  "bottlenecks": [
    {
      "id": "BUG-003",
      "blocking_count": 3,
      "severity": "critical"
    }
  ]
}
```

### Step 5: Generate Timeline

```bash
# File: jira/.index/timeline.json
```

```json
{
  "events": [
    {
      "date": "2025-11-07T18:30:00Z",
      "type": "status_update",
      "item_id": "BUG-003",
      "item_type": "bug",
      "event": "Updated with test failure details"
    },
    {
      "date": "2025-11-07T18:00:00Z",
      "type": "created",
      "item_id": "FR-012",
      "item_type": "feature",
      "event": "Document Management System proposed"
    },
    {
      "date": "2025-11-07T01:00:00Z",
      "type": "escalated",
      "item_id": "BUG-003",
      "item_type": "bug",
      "from_priority": "P3",
      "to_priority": "P0",
      "event": "Escalated to P0 after test failure"
    },
    {
      "date": "2025-11-07T00:12:53Z",
      "type": "test_failure",
      "item_id": "BUG-003",
      "item_type": "bug",
      "test_name": "@test-default-run",
      "event": "Test revealed frontend connects to wrong backend"
    },
    {
      "date": "2025-11-06T20:15:00Z",
      "type": "created",
      "item_id": "BUG-003",
      "item_type": "bug",
      "event": "Port coordinator uses offset for main tree"
    }
  ]
}
```

### Step 6: Generate Component Map

```bash
# File: jira/.index/components.json
```

```json
{
  "components": {
    "frontend/src/lib/getEncoreClient.ts": {
      "work_items": ["BUG-003"],
      "last_modified": "2025-11-07T18:30:00Z",
      "risk": "high"
    },
    "scripts/port-coordinator.mjs": {
      "work_items": ["BUG-003"],
      "last_modified": "2025-11-07T18:30:00Z",
      "risk": "high"
    },
    "jira/scripts/": {
      "work_items": ["FR-012"],
      "last_modified": "2025-11-07T18:30:00Z",
      "risk": "low"
    }
  },
  
  "hot_spots": [
    {
      "component": "frontend/src/lib/getEncoreClient.ts",
      "work_count": 1,
      "priority_sum": 0,
      "status": "Active work (BUG-003)"
    }
  ]
}
```

---

## Example 2: Using CLI Commands

### Linking Work Items

```bash
$ @link-work-items BUG-003 blocks FR-012

✅ Linked: BUG-003 blocks FR-012

Updated files:
  - jira/bugs/BUG-003-port-coordinator-main-tree-offset/.meta.json
  - jira/feature-requests/FR-012-document-management/.meta.json
  - jira/.index/dependencies.json
  - jira/.index/work-items.json

Relationship created:
  BUG-003 (blocks) → FR-012
  FR-012 (blocked_by) ← BUG-003
```

### Checking Work Status

```bash
$ @work-status BUG-003

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 BUG-003: Port Isolation Violation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority: P0 (Critical)
Status: In Progress (updated 2 hours ago)
Owner: worktree-Px8w6

⚠️  BLOCKING 3 WORK ITEMS:
  - FR-012: Document Management System (P2)
  - FR-013: Timeline UI Integration (P1)
  - FR-014: AI Agent Memory (P1)

Components affected:
  - frontend/src/lib/getEncoreClient.ts
  - scripts/port-coordinator.mjs
  - scripts/dev-frontend.sh

Recent timeline:
  - 2h ago: Updated with test failure details
  - 17h ago: Escalated from P3 to P0
  - 18h ago: Test failure revealed (@test-default-run)
  - 1d ago: Created (port coordinator offset issue)

Next steps:
  1. Fix frontend backend discovery
  2. Verify environment variable passing
  3. Re-run @test-default-run
```

### Viewing Timeline

```bash
$ @work-timeline --since 2d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Work Timeline (Last 2 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2025-11-07 (Today)
  18:30 │ 🔄 BUG-003 updated (test failure details added)
  18:00 │ ✨ FR-012 created (Document Management System)
  01:00 │ 📈 BUG-003 escalated (P3 → P0)
  00:12 │ ❌ Test failure: @test-default-run (BUG-003)

2025-11-06
  20:15 │ 🐛 BUG-003 created (Port coordinator offset)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  - 2 items created (1 bug, 1 feature)
  - 1 escalation (P3 → P0)
  - 1 test failure detected
  - 3 features now blocked by BUG-003
```

### Visualizing Dependency Graph

```bash
$ @work-graph BUG-003

BUG-003 [Port Isolation Violation] ⚠️ P0
  ├─ blocks → FR-012 [Document Management] (P2)
  ├─ blocks → FR-013 [Timeline UI] (P1)
  ├─ blocks → FR-014 [AI Memory] (P1)
  └─ relates to ~ FR-011 [Port Management] (Completed)

⚠️  CRITICAL BLOCKER DETECTED
    BUG-003 is blocking 3 features
    Priority: P0 (fix immediately)

Recommended action:
  Focus on BUG-003 to unblock downstream work
```

### Finding Related Work

```bash
$ @find-work --component frontend/src/lib/getEncoreClient.ts

Found 1 work item touching this component:

🐛 BUG-003: Port Isolation Violation (P0, In Progress)
   File: frontend/src/lib/getEncoreClient.ts
   Issue: Frontend scans for ANY backend instead of using assigned port
   Impact: Blocking 3 features
   Fix required: Use VITE_BACKEND_BASE_URL environment variable
   
Recent changes:
   - 2h ago: Test revealed frontend connects to port 4002 instead of 4008
   - 17h ago: Escalated to P0

⚠️  HIGH RISK COMPONENT
    This file is part of a P0 bug fix
    Review carefully before making changes
```

---

## Example 3: Auto-Generated Reports

### Daily Status Report

```bash
$ @work-status --report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Daily Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: 2025-11-07 18:30

🔥 Critical (P0): 1 item
  - BUG-003: Port Isolation (In Progress)
    Blocking: 3 features
    Owner: worktree-Px8w6

⚠️  High Priority (P1): 0 items

📋 Medium Priority (P2): 1 item
  - FR-012: Document Management (Proposed)
    Blocked by: BUG-003
    Status: Awaiting approval

🌳 Active Worktrees: 4
  - Px8w6 (working on: BUG-003, FR-012)
  - LqKPe (idle, last activity: 2d ago)
  - glIGf (idle, last activity: 1d ago)
  - nntwM (idle, last activity: 2d ago)

📈 Progress Last 24h:
  - 1 bug escalated to P0
  - 1 feature proposed
  - 1 test failure identified
  - 0 items completed

⚠️  Action Required:
  1. Fix BUG-003 (unblocks 3 features)
  2. Approve/reject FR-012
  3. Clean up idle worktrees

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Implementation Script Example

### link.mjs (Simplified)

```javascript
#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Find .meta.json for work item
function findMetaPath(workId) {
  const patterns = [
    `jira/bugs/${workId}-*/.meta.json`,
    `jira/feature-requests/${workId}-*/.meta.json`,
    `jira/tech-debt/${workId}-*/.meta.json`
  ];
  
  for (const pattern of patterns) {
    // Simple glob (in real code, use proper glob library)
    const matches = glob.sync(pattern);
    if (matches.length > 0) return matches[0];
  }
  
  throw new Error(`Work item ${workId} not found`);
}

// Read metadata
function readMeta(workId) {
  const path = findMetaPath(workId);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Write metadata
function writeMeta(workId, meta) {
  const path = findMetaPath(workId);
  meta.updated = new Date().toISOString();
  writeFileSync(path, JSON.stringify(meta, null, 2));
}

// Main
const [sourceId, relationship, targetId] = process.argv.slice(2);

const sourceMeta = readMeta(sourceId);
const targetMeta = readMeta(targetId);

// Add relationship
sourceMeta.relationships[relationship] ??= [];
if (!sourceMeta.relationships[relationship].includes(targetId)) {
  sourceMeta.relationships[relationship].push(targetId);
}

// Add inverse
const inverses = {
  'blocks': 'blocked_by',
  'blocked_by': 'blocks',
  'depends_on': 'required_by',
  'required_by': 'depends_on',
  'relates_to': 'relates_to'
};

const inverse = inverses[relationship];
targetMeta.relationships[inverse] ??= [];
if (!targetMeta.relationships[inverse].includes(sourceId)) {
  targetMeta.relationships[inverse].push(sourceId);
}

// Save
writeMeta(sourceId, sourceMeta);
writeMeta(targetId, targetMeta);

console.log(`✅ Linked: ${sourceId} ${relationship} ${targetId}`);
```

---

## Benefits Demonstrated

1. **Visibility**: See what BUG-003 blocks immediately
2. **Priority**: Automatic escalation when blocking high-priority work
3. **Context**: Timeline shows full history
4. **Discovery**: Find all work touching a component
5. **Planning**: Dependency graph shows critical path
6. **Reporting**: Auto-generated status reports

**Time saved**: 
- Finding related work: 30 sec (was 10+ min)
- Understanding impact: instant (was hours)
- Status reporting: automated (was manual)

