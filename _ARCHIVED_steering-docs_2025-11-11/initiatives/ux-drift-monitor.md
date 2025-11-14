# ScreenGraph UX Drift Monitor — Feature Prioritization & Timeline

## Overview
Automated detection and monitoring of UI/UX changes across app versions to prevent unintended drift and maintain design consistency.

---

## POC — 2–3 weeks
*Goal: Prove drift detection loop works end-to-end*

- ☐ **Automated Nightly App Crawl** — baseline run orchestration
  - *Link: [FR-XXX]()*
- ☐ **ScreenGraph Generation** — screens + navigation edges persisted
  - *Link: [FR-XXX]()*
- ☐ **Version Comparison Engine** — diff graphs by run ID
  - *Link: [FR-XXX]()*
- ☐ **Change Reports (JSON only)** — added/removed/changed screens
  - *Link: [FR-XXX]()*
- ☐ **Notifications & Webhooks** — Slack/webhook delivery
  - *Link: [FR-XXX]()*

---

## MVP — 6–8 weeks
*Goal: Make it usable by design/QA teams*

- ☐ **Visual Drift Detection** — pixel/layout/text comparison
  - *Link: [FR-XXX]()*
- ☐ **Flow Drift Detection** — missing/new navigation paths
  - *Link: [FR-XXX]()*
- ☐ **Drift Dashboard (Web UI)** — compare builds visually
  - *Link: [FR-XXX]()*
- ☐ **Baseline Management** — lock design baseline per branch/build
  - *Link: [FR-XXX]()*
- ☐ **Drift Severity Scoring** — auto-classify impact (minor/major)
  - *Link: [FR-XXX]()*
- ☐ **Multi-run History** — track drift trends across builds
  - *Link: [FR-XXX]()*

---

## POST_MVP — 10–16 weeks
*Goal: Team collaboration & automation*

- ☐ **Screen Timeline View** — evolution of each screen
  - *Link: [FR-XXX]()*
- ☐ **Drift Heatmaps** — visualize change intensity per screen
  - *Link: [FR-XXX]()*
- ☐ **CI/CD Integration** — fail builds or notify on drift threshold
  - *Link: [FR-XXX]()*
- ☐ **Change Reports (Rich UI)** — diff viewer, screenshots side-by-side
  - *Link: [FR-XXX]()*

---

## NORTHSTAR — 6+ months
*Goal: Intelligent continuous UX governance*

- ☐ **UX Stability Analytics** — trend metrics (drift velocity, volatility)
  - *Link: [FR-XXX]()*
- ☐ **Auto-detected Root Cause Insights** — "why drift happened" (code vs layout)
  - *Link: [FR-XXX]()*
- ☐ **Cross-app Consistency Auditing** — compare apps/brands for visual alignment
  - *Link: [FR-XXX]()*
- ☐ **Release Notes Automation** — human-readable "what changed" summaries
  - *Link: [FR-XXX]()*
- ☐ **Continuous UX Intelligence Layer** — AI-based pattern and anomaly detection
  - *Link: [FR-XXX]()*

---

## Status
- **Current Phase**: POC
- **Started**: [Date TBD]
- **Last Updated**: [Date TBD]

## Notes
- All feature requests will be created under `jira/feature-requests/` and linked here
- Progress tracked via checkboxes (☐ → ☑)
- Updates made after nightly/major changes
