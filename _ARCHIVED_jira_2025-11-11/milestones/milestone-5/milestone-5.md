# Milestone 5 — Drift Detection & Baseline Comparison

**Status:** 📅 Planned  
**Start Date:** TBD  
**Target Completion:** TBD  
**Owner:** Core Team

---

## 🎯 Goal
Detect UI/UX changes automatically by comparing crawl runs to baseline references, enabling regression detection and visual QA.

---

## 📦 Deliverables

### Baseline Management
- [ ] Store baseline crawl runs as references
- [ ] Baseline versioning and tagging
- [ ] Baseline selection API
- [ ] Multi-baseline support (per app version)

### Diff Engine
- [ ] Event stream comparison algorithm
- [ ] Screenshot visual diffing (pixel-level)
- [ ] Graph structure diffing
- [ ] Action sequence divergence detection
- [ ] Semantic diff (element changes)

### Alerting & Reporting
- [ ] Drift score calculation
- [ ] Alert rules engine (threshold-based)
- [ ] Notification integration (Slack, email)
- [ ] Drift report generation
- [ ] Historical drift tracking

### Frontend
- [ ] Side-by-side crawl comparison view
- [ ] Screenshot diff viewer with highlights
- [ ] Graph diff visualization
- [ ] Drift dashboard with trends
- [ ] Alert configuration UI

### Testing
- [ ] Diff algorithm correctness tests
- [ ] False positive rate measurement
- [ ] Performance test: diff 1000-event crawls
- [ ] Alert delivery verification

---

## ✅ Definition of Done
System detects UI changes by comparing new crawls to baselines, visualizes diffs in dashboard, and sends alerts when drift exceeds thresholds.

---

## 🚀 Success Metrics
- [ ] Diff computation time p95 < 5s for 500-event crawls
- [ ] False positive rate < 5%
- [ ] Alert delivery latency < 30s
- [ ] Visual diff accuracy > 90%

---

## 🔗 Dependencies
- Milestone 4 (Graph Building) must be complete
- Notification service integration

---

## 📝 Notes
**Allowed Tech Debt for M5:**
- Simple pixel-level diffing (no ML-based semantic diff)
- Single baseline per app (no multi-version comparison)
- Manual drift threshold configuration
- No auto-remediation suggestions
