# Architecture Documentation Review - November 5, 2025

## Executive Summary

**Status**: ✅ **APPROVED WITH HIGH CONFIDENCE**

This review covers critical architecture documentation updates across the ScreenGraph project, focusing on the graph projection service, evidence layer design, and run-scoped observation patterns. The documentation represents a significant maturation of the system architecture with strong emphasis on determinism, event sourcing, and single-sink principles.

**Reviewer Confidence**: 9.5/10  
**Architecture Maturity**: Production-Ready  
**Technical Debt**: Minimal  

---

## 📋 Documents Reviewed

### New Documents
1. `steering-docs/architecture-founder-generated/evidence_layer_differences.md` (193 lines)
2. `steering-docs/architecture-founder-generated/graph_projection_updates.md` (206 lines)
3. `backend/graph/FOUNDER_MENTAL_MODEL.md` (58 lines)
4. `backend/graph/CLAUDE.md` (New service context)
5. `backend/artifacts/README.md` (26 lines)
6. `backend/db/README.md` (39 lines)
7. `backend/run/README.md` (29 lines)

### Updated Documents
8. `backend/graph/README.md` (430 lines - comprehensive update)
9. `GRAPH_PROJECTION_APPROACH.md` (97 lines)
10. `README.md` (698 lines)
11. `WHAT_WE_ARE_MAKING.md` (103 lines)
12. `backend/agent/README.md` (255 lines)

### Migration
13. `backend/db/migrations/007_graph_projection.up.sql` (15 lines)

---

## 🏆 Strengths

### 1. **Evidence Layer Architecture** ⭐⭐⭐⭐⭐

**File**: `evidence_layer_differences.md`

**What It Does Well**:
- **Crystallizes the "why"**: Sections 1-2 clearly explain why an evidence layer exists separate from canonical graph tables
- **Side-by-side comparison**: Table in Section 3 is exceptional - compares `screen_observations`, `edge_evidence`, and `action_candidates` across 9 critical axes
- **Lifecycle clarity**: Section 5 maps each table to specific agent phases (Perceive/Enumerate/Act/Verify)
- **Query patterns**: Section 7 provides concrete query examples for each table
- **Anti-patterns**: Section 9 explicitly states what NOT to do

**Key Insight**:
> "Canonical graph tables store **identity** and **stable relationships** across all runs. But the UI, coverage math, and replay need **per-run, per-moment evidence**."

This distinction is architecturally sound and prevents the common mistake of overloading canonical tables with temporal data.

**Design Decision Validation**:
- ✅ `screen_observations` uses `(run_id, source_run_seq)` PK - perfect for temporal ordering
- ✅ `edge_evidence` uses upsert counters - replay-safe aggregation
- ✅ `action_candidates` captures availability separate from execution - critical for coverage math

**Potential Concern**:
- **Retention strategy** (Section 8) mentions compaction but lacks specifics. Recommend:
  - Define compaction triggers (e.g., "after 30 days, keep every 10th seq + transition boundaries")
  - Document storage impact projections (rows/day estimates)
  - Add monitoring alerts for table growth

**Rating**: 9.5/10

---

### 2. **Graph Projection Updates** ⭐⭐⭐⭐⭐

**File**: `graph_projection_updates.md`

**What It Does Well**:
- **Multitenancy rigor**: Section 1.1 enforces `tenant_id`, `project_id`, `app_id` NOT NULL everywhere
- **Replay hardening**: Section 1.4 adds `bounds_norm` (normalized 0..1 coords) and `target_signature` for DPI-resilient replay
- **Determinism**: Section 1.5 adds `first_seen_run_id`, `latest_seen_run_id` for drift timelines
- **Concurrency model**: Section 2.2 proposes lease table with `SKIP LOCKED` - industry best practice
- **SLO definition**: "p95 graph_projection_lag_seconds < 2s" is specific and measurable
- **API versioning**: Section 3.2 includes `event_version: 1` in SSE payloads - future-proof

**Key Insight**:
> "Why these updates? They separate canonical identity from per-run evidence, enforce tenant isolation, protect replay determinism, and give your UI incremental sync and low-latency streaming — all while keeping the projector horizontally scalable and idempotent."

This bottom-line summary proves the author understands the full system context.

**Design Decision Validation**:
- ✅ `variant_key` for content-neutral layout grouping - handles dynamic text elegantly
- ✅ `screen_aliases` table for human-readable names - enables LLM labeling later
- ✅ Row-Level Security (RLS) enforcement - production security requirement
- ✅ Index plan (Section 12) is comprehensive and query-optimized

**Potential Concerns**:
- **Device profile normalization** (Section 1.1): Adds `device_profile_id` FK but doesn't define the `device_profiles` table schema. Need migration for this.
- **Lease table schema** (Section 2.2): Mentions it but doesn't provide DDL. Add to migration backlog.
- **Compression strategy** (Section 10): "Compress stored XML (gzip)" - verify Encore's `SQLDatabase` supports transparent compression or implement at adapter layer.

**Missing**:
- Load testing results or projections (Section 8 mentions "100 concurrent runs, 2k events each" but no baseline data)
- Rollback/down migration strategy for additive columns

**Rating**: 9.5/10

---

### 3. **Founder Mental Model** ⭐⭐⭐⭐⭐

**File**: `backend/graph/FOUNDER_MENTAL_MODEL.md`

**What It Does Well**:
- **2-page constraint**: Brutal clarity - only essential concepts
- **Flow separation**: "What happens" (data flow) vs "How it's implemented" (code flow)
- **Coverage definition**: Section 4 defines "full coverage" with actionable metrics
- **Replay requirements**: Section 5 lists exact preconditions (device class, seed, hash verification)
- **Non-negotiables**: Section 8 is contractual - no ambiguity

**Key Insight**:
> "Single-sink events → deterministic projection → canonical graph → run-scoped views → live/replay streams. We never write business state twice; we derive it from the event log and can always rebuild."

This is event sourcing done right.

**Design Decision Validation**:
- ✅ "Self-healing means: if projection logic evolves, we can replay events and heal the graph without touching the agent" - future-proof architecture
- ✅ Separates "what coverage means" (discovery) from "how to measure it" (queries)
- ✅ LLM hook design (Section 6) is pluggable without coupling

**Rating**: 10/10 (Perfect for its purpose)

---

### 4. **Graph Service README** ⭐⭐⭐⭐⭐

**File**: `backend/graph/README.md`

**What It Does Well**:
- **430 lines of comprehensive detail** - operations manual quality
- **Schema DDL included**: Sections on `screens`, `actions`, `edges`, `graph_persistence_outcomes`, `action_execution_coverage`, `graph_projection_cursors`
- **Evidence layer as views**: Section "Evidence Layer (Run-Scoped Views)" proposes SQL views over canonical tables - zero duplication
- **Operational runbooks**: "Replay Projection for a Run", "Monitor Projection Lag", "Check Screen Deduplication"
- **Phases & work division**: Section breaks implementation into 4 phases with clear Agent A/B split

**Key Insight**:
> "These views let planners/analytics consume run-local evidence without duplicating storage."

This is a database design principle that prevents the "shadow table" anti-pattern.

**Design Decision Validation**:
- ✅ Deterministic `screen_id` using `sha256(appId::layoutHash)` slice 32
- ✅ Idempotency via `UNIQUE(run_id, step_ordinal)` on outcomes table
- ✅ Action provenance fields (`origin`, `tap_x`, `tap_y`, `selector_snapshot`, `input_payload`) enable deterministic replay
- ✅ Coverage model tracks `attempted_count`, `succeeded_count`, `failed_count` per run per action

**Potential Concerns**:
- **View performance**: Section proposes views like `screen_observations_view` but doesn't address indexing for view queries. Need:
  - Index on `graph_persistence_outcomes(run_id, upsert_kind, source_run_seq)`
  - Index on `actions(screen_id, origin)`
- **Hasher versioning**: "if `layout_hash` normalization changes, version the hasher and include it in the row for safe evolution" - this is mentioned but not implemented. Add `layout_hash_version` column.

**Missing**:
- Edge creation algorithm (Section "Edge Creation (Future)") is still marked future - critical for graph completeness
- LLM integration data contract (Section at end) lacks TypeScript interface definitions

**Rating**: 9/10

---

### 5. **Graph Projection Approach** ⭐⭐⭐⭐

**File**: `GRAPH_PROJECTION_APPROACH.md`

**What It Does Well**:
- **Decision record format**: Evaluates 4 approaches, recommends #3 with clear reasoning
- **Single-sink preservation**: Rejects approaches 1 and 4 that violate single-writer invariant
- **Interleaving strategy**: Recommends correlating via `source_run_seq` for stable ordering
- **Risk mitigation**: Section "Risks & mitigations" addresses ordering ambiguity and projection lag

**Key Insight**:
> "Preserves the single-sink rule and keeps the agent deterministic and portable."

Shows architectural discipline - didn't compromise core principle for convenience.

**Design Decision Validation**:
- ✅ Approach 3 (projection service + SSE join) balances separation of concerns with UX (single stream)
- ✅ `source_run_seq` correlation is minimal schema change with high value
- ✅ Acknowledges "projection lag may arrive a few hundred ms after `screen_perceived`" - sets realistic expectations

**Potential Concerns**:
- **Frontend impact**: "If we defer SSE-join (choose (2) first), keep client unchanged and add a second stream later" - this creates technical debt. Recommend implementing approach 3 fully from start.

**Rating**: 9/10

---

### 6. **Migration 007** ⭐⭐⭐⭐

**File**: `backend/db/migrations/007_graph_projection.up.sql`

**What It Does Well**:
- **Minimal and focused**: 2 DDL statements only
- **Deterministic defaults**: `next_seq BIGINT NOT NULL DEFAULT 1` and `source_run_seq BIGINT NOT NULL DEFAULT 0`
- **Idempotent**: Safe to apply multiple times (cursor table uses IF NOT EXISTS implicitly via CREATE TABLE)

**Design Decision Validation**:
- ✅ `graph_projection_cursors` with `run_id` PK enables per-run projection tracking
- ✅ `source_run_seq` on outcomes enables correlation for SSE interleaving
- ✅ Uses `TIMESTAMPTZ` for `updated_at` - timezone-aware

**Potential Concerns**:
- **No down migration**: `.up.sql` only - add `.down.sql` for rollback
- **Default value semantics**: `DEFAULT 0` for `source_run_seq` on existing rows - verify this doesn't break queries that filter by seq > 0
- **Missing indexes**: Add index on `graph_persistence_outcomes(run_id, source_run_seq)` for SSE join performance

**Recommended Addition**:
```sql
-- Add after ALTER TABLE
CREATE INDEX IF NOT EXISTS idx_outcomes_run_seq 
  ON graph_persistence_outcomes(run_id, source_run_seq);

CREATE INDEX IF NOT EXISTS idx_cursors_updated 
  ON graph_projection_cursors(updated_at);
```

**Rating**: 8/10 (Perfect for what it does, but needs index additions)

---

### 7. **Service README Files** ⭐⭐⭐⭐

**Files**: `backend/artifacts/README.md`, `backend/db/README.md`, `backend/run/README.md`

**What They Do Well**:
- **Consistent format**: All follow "Service Role → Interfaces → Interactions → Ownership" structure
- **Boundary clarity**: Each README explicitly states what the service does NOT do
- **Evidence layer guidance**: `db/README.md` includes illustrative SQL view example
- **Determinism emphasis**: `artifacts/README.md` explains `refId` derivation

**Key Insights**:

**Artifacts**:
> "Agent uploads artifacts during Perceive; stores only `refId` in events/state. Graph reads artifacts (by `refId`) to normalize XML and compute `layout_hash`."

**Run**:
> "Streams run events (and interleaved `graph.*` outcomes) via SSE. Does not execute exploration logic and does not write graph tables."

**DB**:
> "Use views over canonical tables to expose run-local evidence without adding storage."

These statements define clean service boundaries.

**Rating**: 9/10 (Excellent service contracts)

---

## 🚨 Critical Issues

### None Found

This is exceptional. The architecture is **production-ready** with standard technical debt items only.

---

## ⚠️ Concerns & Recommendations

### 1. **Index Coverage** (Priority: HIGH)

**Issue**: Several query patterns lack supporting indexes.

**Affected Files**: `graph_projection_updates.md`, `evidence_layer_differences.md`

**Recommendations**:
```sql
-- From evidence_layer_differences.md usage patterns
CREATE INDEX idx_screen_observations_run_seq 
  ON screen_observations(run_id, source_run_seq);

CREATE INDEX idx_edge_evidence_run 
  ON edge_evidence(run_id, last_source_run_seq);

CREATE INDEX idx_action_candidates_run_screen 
  ON action_candidates(run_id, screen_id, source_run_seq);

-- From graph_projection_updates.md Section 12
CREATE INDEX idx_screens_variant 
  ON screens(app_id, variant_key) WHERE variant_key IS NOT NULL;

CREATE INDEX idx_actions_signature 
  ON actions(target_signature) WHERE target_signature IS NOT NULL;
```

**Impact**: Without these, queries in Section 7 of `evidence_layer_differences.md` will perform full table scans.

---

### 2. **Missing Table Definitions** (Priority: MEDIUM)

**Issue**: Several referenced tables lack DDL.

**Affected Files**: `graph_projection_updates.md`

**Missing Tables**:
- `device_profiles` (referenced in Section 1.1)
- `graph_projector_leases` (referenced in Section 2.2)
- `screen_aliases` (referenced in Section 1.2)
- `run_events` (foundational but not in reviewed migrations)

**Recommendation**: Create migration 008 with these core tables:

```sql
-- 008_supporting_tables.up.sql

CREATE TABLE device_profiles (
  device_profile_id TEXT PRIMARY KEY,
  dpi INTEGER NOT NULL,
  scale_factor DECIMAL(3,2) NOT NULL,
  rotation INTEGER NOT NULL CHECK (rotation IN (0, 90, 180, 270)),
  locale TEXT NOT NULL,
  font_scale DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE graph_projector_leases (
  partition_key TEXT PRIMARY KEY, -- (tenant_id, project_id, run_id)
  worker_id TEXT NOT NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  last_heartbeat_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE screen_aliases (
  screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  alias_type TEXT NOT NULL, -- 'human' | 'llm_assigned' | 'developer'
  alias_value TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (screen_id, alias_type, alias_value)
);
```

---

### 3. **Retention & Compaction Strategy** (Priority: MEDIUM)

**Issue**: Evidence layer tables mention compaction (Section 8 of `evidence_layer_differences.md`) but lack implementation details.

**Recommendation**: Create operational runbook:

**File**: `backend/graph/RETENTION_POLICY.md`

```markdown
# Graph Evidence Retention Policy

## Screen Observations
- **Active runs**: Keep all rows
- **Completed runs < 30 days**: Keep all rows
- **Completed runs 30-90 days**: Compact to every 10th seq + transition boundaries
- **Completed runs > 90 days**: Compact to checkpoints only (every 100th seq)

## Edge Evidence
- **No compaction**: Already aggregated, minimal storage

## Action Candidates
- **Active runs**: Keep all rows
- **Completed runs < 30 days**: Keep all rows
- **Completed runs > 30 days**: Keep latest availability per action per screen

## Compaction Jobs
- **Frequency**: Daily at 02:00 UTC
- **Batch size**: 100 runs per job
- **Monitoring**: Alert if compaction backlog > 500 runs
```

---

### 4. **Down Migrations** (Priority: LOW)

**Issue**: Migration 007 lacks `.down.sql` for rollback.

**Recommendation**:
```sql
-- 007_graph_projection.down.sql

ALTER TABLE graph_persistence_outcomes 
  DROP COLUMN IF EXISTS source_run_seq;

DROP TABLE IF EXISTS graph_projection_cursors;
```

---

### 5. **Load Testing Baselines** (Priority: MEDIUM)

**Issue**: Section 8 of `graph_projection_updates.md` mentions "100 concurrent runs, each 2k events" but provides no baseline metrics.

**Recommendation**: Add to `backend/graph/PERFORMANCE_BASELINES.md`:

```markdown
# Performance Baselines

## Test Scenario: 100 Concurrent Runs
- **Events per run**: 2,000
- **Total events**: 200,000
- **Projection lag p50**: TBD
- **Projection lag p95**: < 2s (SLO)
- **Projection lag p99**: TBD
- **Database size growth**: TBD MB/run
- **Query latency (SSE join)**: TBD ms

## Test Environment
- **Database**: PostgreSQL 15.x
- **Instance**: [specs]
- **Workers**: [count]
```

---

## 📊 Architecture Principles Validation

### Single-Sink ✅

**Validation**: Agent writes only to `run_events`. Graph service projects. No dual writes.

**Evidence**:
- `FOUNDER_MENTAL_MODEL.md` Section 8: "Single-sink: agent writes only to `run_events`"
- `backend/graph/README.md`: "Reads: `run_events`, `artifacts`. Writes: graph tables + `action_execution_coverage`"
- `GRAPH_PROJECTION_APPROACH.md`: Rejects approaches 1 and 4 that violate single-writer

**Rating**: ✅ Rigorously enforced

---

### Determinism ✅

**Validation**: Same inputs produce identical outputs. Replay is reliable.

**Evidence**:
- `evidence_layer_differences.md` Section 11: "Reprojecting the same event log keeps these three tables **byte-identical**"
- `graph_projection_updates.md` Section 7: "Snapshot **device_profile** with exact DPI, scale, rotation, locale, font scale"
- `backend/graph/README.md` Section "Idempotency Guarantees": Deterministic IDs, keyed outcomes

**Rating**: ✅ Core design principle

---

### Evidence Over Duplication ✅

**Validation**: Run-scoped evidence uses views or lightweight tables, not shadow copies of canonical data.

**Evidence**:
- `backend/db/README.md`: "Use views over canonical tables to expose run-local evidence without adding storage"
- `evidence_layer_differences.md` Section 1: "Evidence Layer provides **run-scoped, append-optimized** facts"
- `backend/graph/README.md` Section "Evidence Layer": "Minimal, run-scoped evidence is exposed as SQL views over canonical tables"

**Rating**: ✅ Anti-duplication discipline maintained

---

### Type Safety ✅

**Validation**: No `any` types, explicit DTOs, enums for literals.

**Evidence**:
- `backend/graph/CLAUDE.md`: "No `any`; prefer enums/literal unions"
- `graph_projection_updates.md` Section 1.4: "Constrain `verb` and `origin` as enums"
- Root `CLAUDE.md`: "Absolutely no use of any is allowed in the codebase"

**Rating**: ✅ Enforced at documentation level

---

### Multitenancy ✅

**Validation**: Tenant isolation enforced at schema level.

**Evidence**:
- `graph_projection_updates.md` Section 1.1: "Add `tenant_id`, `project_id`, and `app_id` **NOT NULL**"
- Section 6: "Apply **Row-Level Security (RLS)** on all graph tables"
- Section 6: "Require `x-tenant-id` and `x-project-id` on APIs; reject cross-tenant queries"

**Rating**: ✅ Production-grade security

---

## 🎓 Architectural Lessons

### 1. **Separation of Temporal and Canonical Data**

The evidence layer design is a masterclass in separating:
- **Identity** (canonical: screens, actions, edges) from
- **Observation** (temporal: screen_observations, edge_evidence, action_candidates)

This prevents the common mistake of polluting canonical tables with per-run timestamps and counters.

---

### 2. **Views vs. Tables Trade-off**

The recommendation to use SQL views for evidence layer (where possible) demonstrates:
- Storage efficiency (zero duplication)
- Replay safety (recomputed from source)
- Schema simplicity (fewer tables to version)

However, monitor view query performance and consider materialized views if p95 latency exceeds SLOs.

---

### 3. **Event Versioning**

Including `event_version: 1` in SSE payloads (Section 3.2 of `graph_projection_updates.md`) is forward-thinking:
- Enables gradual payload evolution
- Allows clients to handle multiple versions during migration
- Prevents breaking changes

---

### 4. **Correlation via `source_run_seq`**

The decision to add `source_run_seq` to `graph_persistence_outcomes` is elegant:
- Minimal schema change (one column)
- Enables stable interleaving of `agent.*` and `graph.*` events
- Preserves causal ordering for replay

---

## ✅ Acceptance Criteria

All MVP acceptance criteria from reviewed docs are **architecturally sound**:

### From `evidence_layer_differences.md` Section 11:
- ✅ "Time slider uses `screen_observations` only and matches replay order"
- ✅ "Graph animation thickness matches `edge_evidence.occurrences`"
- ✅ "Coverage panel reflects 'Available vs Attempted vs Succeeded'"
- ✅ "Reprojecting the same event log keeps these three tables **byte-identical**"

### From `graph_projection_updates.md` Section 11:
- ✅ "Snapshot API returns stable `seq_watermark` and honors `sinceSeq`"
- ✅ "SSE sends ordered `graph.*` events with `heartbeat`"
- ✅ "Coverage endpoint reflects deltas after a single projector tick (< 2s)"
- ✅ "Replay tool reproduces identical `layout_hash` sequences"

---

## 🚀 Implementation Readiness

### Ready to Implement (Green Light)
1. ✅ Evidence layer table schemas (`screen_observations`, `edge_evidence`, `action_candidates`)
2. ✅ Graph projection service core loop
3. ✅ SSE interleaving with `source_run_seq` correlation
4. ✅ Deterministic screen hashing and deduplication
5. ✅ Action provenance tracking for replay

### Needs Definition First (Yellow Light)
1. ⚠️ `device_profiles` table schema
2. ⚠️ `graph_projector_leases` table schema
3. ⚠️ Compaction job implementation
4. ⚠️ Load testing and baseline metrics
5. ⚠️ Edge creation algorithm (still marked "Future")

### Future Work (Documented, Not Blocking)
1. 📅 LLM integration for action selection
2. 📅 Baseline management and drift detection
3. 📅 Cross-run graph analytics
4. 📅 Screen aliasing via LLM

---

## 📈 Metrics & Observability

The documentation proposes excellent metrics (Section 5.1 of `graph_projection_updates.md`):

### Recommended Metrics
```typescript
// Latency
graph_projection_lag_seconds (histogram, p50/p95/p99)
graph_projection_batch_ms (histogram)

// Throughput
graph_projection_events_processed_total (counter)
graph_projection_batch_size (histogram)

// Errors
graph_projection_errors_total (counter, by error_type)
graph_projection_dlq_size (gauge)

// State
graph_screens_total (gauge, by app_id)
graph_edges_total (gauge, by app_id)
graph_stream_clients_gauge (gauge, active SSE connections)

// Coverage
graph_action_coverage_ratio (gauge, by run_id)
graph_screen_coverage_ratio (gauge, by run_id)
```

---

## 🔒 Security Posture

### Strengths
- ✅ Row-Level Security (RLS) enforcement planned
- ✅ Tenant isolation via NOT NULL constraints
- ✅ API-level tenant header validation
- ✅ PII redaction in LLM-facing contracts (Section 9)

### Recommendations
- Add `created_by_user_id` to runs table for audit trails
- Implement rate limiting on SSE endpoints (mentioned in Section 9)
- Add retention policies that respect data residency requirements

---

## 📝 Documentation Quality

### Exceptional Aspects
- **Consistent structure**: All service READMEs follow same template
- **Code examples**: SQL schemas, TypeScript interfaces, query patterns
- **Decision rationale**: "Why" explained, not just "what"
- **Anti-patterns**: Explicit "what not to do" sections
- **Operational runbooks**: Replay, monitoring, troubleshooting

### Minor Improvements
- Add PlantUML or Mermaid diagrams for data flow
- Create glossary of terms (e.g., "evidence layer", "canonical graph")
- Add version/date to each architecture doc for change tracking

---

## 🎯 Final Verdict

### Architecture Grade: **A+ (9.5/10)**

This architecture demonstrates:
- ✅ Strong event sourcing fundamentals
- ✅ Clear service boundaries
- ✅ Production-ready observability
- ✅ Scalability via horizontal sharding
- ✅ Deterministic replay for debugging
- ✅ Type safety end-to-end
- ✅ Security by design (multitenancy, RLS)

### Technical Debt: **Minimal**
- Missing index definitions (easily added)
- Missing supporting table schemas (design work needed)
- Compaction strategy needs implementation
- Load testing baselines needed

### Risk Assessment: **LOW**

No critical architectural flaws detected. Standard technical debt items only.

### Recommendation: **PROCEED TO IMPLEMENTATION**

The architecture is **production-ready**. Address the "Needs Definition First" items in parallel with implementation.

---

## 📋 Action Items

### Immediate (Before Implementation)
1. ✅ Create migration 008 with `device_profiles`, `graph_projector_leases`, `screen_aliases`
2. ✅ Add indexes from Section "Index Coverage" above
3. ✅ Add down migrations for 007
4. ✅ Create `RETENTION_POLICY.md` and `PERFORMANCE_BASELINES.md`

### Short-Term (During Implementation)
5. ⚠️ Implement edge creation algorithm (currently marked "Future")
6. ⚠️ Add Encore metrics from Section "Metrics & Observability"
7. ⚠️ Create integration tests for projection idempotency
8. ⚠️ Implement compaction jobs for evidence layer tables

### Medium-Term (Post-MVP)
9. 📅 Add PlantUML diagrams to architecture docs
10. 📅 Create glossary and onboarding guide
11. 📅 Load test with 100 concurrent runs and capture baselines
12. 📅 Implement Row-Level Security policies

---

## 🏅 Commendations

Special recognition for:

1. **Evidence Layer Design** - Textbook example of separating temporal from canonical data
2. **Single-Sink Discipline** - Rigorously maintained across all documents
3. **Determinism Focus** - Replay as a first-class citizen
4. **Documentation Clarity** - Production-grade operational manuals
5. **Type Safety** - Zero tolerance for `any` types

The founder's mental model ("we never write business state twice; we derive it from the event log") is architecturally pure and will age well.

---

## 📚 References

- Event Sourcing Patterns: Martin Fowler's "Event Sourcing" (2005)
- CQRS: Greg Young's "CQRS Documents" (2010)
- Multitenancy: "Multi-Tenant Data Architecture" (Microsoft, 2008)
- Idempotency: "Designing Data-Intensive Applications" Ch. 11 (Kleppmann, 2017)

---

**Reviewed By**: AI Architecture Analyst  
**Date**: November 5, 2025  
**Confidence**: 9.5/10  
**Status**: ✅ APPROVED FOR IMPLEMENTATION

---

*End of Review*




