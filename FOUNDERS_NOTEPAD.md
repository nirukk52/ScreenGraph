# ScreenGraph Founders Doc

This document captures the working mental models for the current app, and immediate steps to improve those models and accelerate development.

## Purpose
- Provide a shared, lightweight source of truth for how the system is supposed to work.
- Help make rapid decisions without rediscovering tribal knowledge.
- Keep a short list of quick wins to continually reduce friction.

## Core Mental Models

### 1) Run Lifecycle
- A Run represents a single autonomous agent execution over an app under test.
- Creation: `POST /run` inserts a `runs` row and publishes a `run-job` to orchestrate processing.
- Execution: The orchestrator consumes `run-job` and starts the agent loop.
- Streaming: Clients attach to `/run/:id/stream` to receive backfill + live events in order.
- Completion: Terminal events close the stream and finalize run status.

### 2) Event Sourcing (Lightweight)
- Domain events for a run are written to `run_events` with monotonically increasing `seq`.
- Stream endpoint backfills from last seen `seq` and then polls for new events, preserving order.
- Terminal events: `agent.run.finished`, `agent.run.failed`, `agent.run.canceled` close the stream.

### 3) Orchestration via Pub/Sub
- `run-job` Topic triggers the worker (`orchestrator`) to kick off the agent loop.
- The worker is idempotent with respect to run status updates and event sequences.
- Failures are surfaced; retries handled per pub/sub semantics (at-least-once delivery).

### 4) Idempotency & Consistency
- Event inserts enforce uniqueness on `(run_id, seq)`; duplicates with differing payloads are rejected.
- Run status updates follow a compare-and-set style rule: first terminal status wins.

### 5) Frontend Timeline
- `RunTimeline` subscribes to the backend stream with `lastEventSeq` for robust resume after reconnects.
- UI deduplicates events by `seq` and recognizes terminal states to stop streaming.

## Current Implementation Anchors
- Start Run: `backend/run/start.ts` (`POST /run`, publishes `run-job`).
- Orchestrator Worker: `backend/run/orchestrator.ts` (subscribes to `run-job`, runs agent loop).
- Stream: `backend/run/stream.ts` (backfill then live poll, closes on terminal events).
- Frontend Timeline: `frontend/pages/RunTimeline.tsx` (connects, dedupes, displays).
- Idempotency tests: `backend/agent/tests/idempotency.test.ts`.

## Invariants (What must always be true)
- Event order per run is strictly increasing by `seq`.
- Stream never emits out-of-order or duplicate events to the same client session.
- First terminal status for a run is final; subsequent attempts are ignored.tive errors.

## Near-Term Improvements to Mental Models
- Clarify state machine for Run (diagram + textual spec) including intermediate states (e.g., running, canceling, canceled).
- Define a canonical event taxonomy and naming scheme (prefixes, domains, terminal markers).
- Document backpressure strategy for high event volumes (batching, pagination windows, or cursor-based streaming).

## Operating Principles
- Prefer explicit invariants and tests over comments.
- Design for idempotency and at-least-once delivery first; layer exactly-once only if needed.
- Keep the founder doc short and actionable; update alongside meaningful behavior changes.
- **Use American English spelling exclusively** (e.g., "canceled" not "cancelled", "color" not "colour") across all code, database schemas, comments, and documentation for consistency.


[POC — 2–3 weeks]

(Goal: Prove drift detection loop works end-to-end)

Automated Nightly App Crawl — baseline run orchestration

ScreenGraph Generation — screens + navigation edges persisted

Version Comparison Engine — diff graphs by run ID

Change Reports (JSON only) — added/removed/changed screens

Notifications & Webhooks — Slack/webhook delivery

[MVP — 6–8 weeks]

(Goal: Make it usable by design/QA teams)
6. Visual Drift Detection — pixel/layout/text comparison
7. Flow Drift Detection — missing/new navigation paths
8. Drift Dashboard (Web UI) — compare builds visually
9. Baseline Management — lock design baseline per branch/build
10. Drift Severity Scoring — auto-classify impact (minor/major)
11. Multi-run History — track drift trends across builds

[POST_MVP — 10–16 weeks]

(Goal: Team collaboration & automation)
12. Screen Timeline View — evolution of each screen
13. Drift Heatmaps — visualize change intensity per screen
14. CI/CD Integration — fail builds or notify on drift threshold
15. Change Reports (Rich UI) — diff viewer, screenshots side-by-side

[NORTHSTAR — 6+ months]

(Goal: Intelligent continuous UX governance)
16. UX Stability Analytics — trend metrics (drift velocity, volatility)
17. Auto-detected Root Cause Insights — “why drift happened” (code vs layout)
18. Cross-app Consistency Auditing — compare apps/brands for visual alignment
19. Release Notes Automation — human-readable “what changed” summaries
20. Continuous UX Intelligence Layer — AI-based pattern and anomaly detection

ScreenGraph — Top 10 Post-MVP Features (grouped)
1) Observe

Screen Timeline – A per-screen history with side-by-side shots, layout diff, and notes.

Drift Heatmap – Highlights where the UI changes most across releases.

Flow Compare – Compare any two versions of a user journey, step-by-step.

2) Decide

Baseline Manager – Lock a “golden” build; review and accept changes into baseline with one click.

Severity Scoring – Rank changes (minor tweak → breaking change) with simple rules you can tune.

Ownership Rules – Auto-route drifts by screen/area to the right team or person.

3) Act

Mocked Replays – Re-run flows with captured network mocks to confirm drifts or prove fixes.

Scheduled Watchers – Daily/weekly checks that open issues or ping Slack when drift crosses a threshold.

Evidence Packs – One export with screenshots, diffs, traces, and summary text for PRs/Jira.

4) Extend

Labels & Notes – Tag screens (“Paywall”, “KYC”), leave short reviews, and filter dashboards by tag.


Helpful commands
open "/Users/priyankalalge/Library/Caches/encore/objects/d3u8d93djnh82bnf6l1g/artifacts/obj:/artifacts/"     