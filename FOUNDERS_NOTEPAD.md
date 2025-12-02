# ScreenGraph Founders Doc

This document captures the working mental models for the current app, and immediate steps to improve those models and accelerate development.

## Recent Updates (2025-11-05)
✅ **BUG-002 RESOLVED**: Graph projection IS working correctly
- Verified 7 screens projected, 7 outcomes recorded, 7 cursors active
- Schema is correct: `graph_projection_cursors` + `source_event_seq` exist
- Added diagnostic endpoints: `GET /graph/diagnostics` and `GET /graph/screens`
- Ready to proceed with FR-009 (Graph Stream Endpoint)

Review the backend graph @README.md 
agent @README.md 
artifacts @README.md 
run @README.md 

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

https://developer.android.com/training/testing/ui-tests/screenshot