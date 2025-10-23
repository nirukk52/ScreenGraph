# Milestone 1 — Stream Backbone

**Status:** 🚧 In Progress  
**Start Date:** 2025-10-23  
**Target Completion:** TBD  
**Owner:** Core Team

---

## 🎯 Goal
Build a deterministic event pipeline with live streaming capabilities that forms the foundation of ScreenGraph's crawl observation system.

---

## 📦 Deliverables

### Backend
- [x] Architecture decision: Monolithic Orchestrator + Outbox Pattern
- [ ] API endpoint: `POST /crawl` - Start a new crawl run
- [ ] API endpoint: `GET /crawl/:id/stream` - SSE stream of crawl events
- [ ] API endpoint: `POST /crawl/:id/cancel` - Cancel running crawl
- [ ] Orchestrator worker with 3 demo nodes (Start → Process → Finish)
- [ ] Outbox publisher job (200ms polling interval)
- [ ] Database schema: `crawl_runs`, `crawl_events`, `crawl_outbox`
- [ ] Redis Pub/Sub integration for live event broadcasting

### Frontend
- [ ] UI timeline component displaying crawl events
- [ ] SSE client with auto-reconnect logic
- [ ] Backfill mechanism for missed events on reconnect
- [ ] Real-time event updates in timeline
- [ ] Loading and error states

### Testing & Quality
- [ ] Integration test: Full crawl lifecycle with event verification
- [ ] Unit tests: Orchestrator state machine
- [ ] Unit tests: Outbox publisher ordering
- [ ] E2E test: SSE stream reconnect/backfill
- [ ] Load test: 10 concurrent crawls

---

## ✅ Definition of Done
Single crawl run can stream all events deterministically with exactly one terminal event (`COMPLETED` or `FAILED`). Timeline UI displays all events in order with proper reconnect handling.

---

## 🎫 Related Tickets
See `tickets.md` for detailed breakdown.

**Feature Requests:** FR-001 through FR-008  
**Tech Debt:** None (greenfield)  
**Bugs:** TBD as discovered

---

## 🚀 Success Metrics
- [ ] End-to-end latency from event generation to UI display < 500ms (p95)
- [ ] Zero event loss on reconnect (verified via integration tests)
- [ ] Outbox publisher processes events in order with no duplicates
- [ ] Timeline renders 1000+ events without performance degradation

---

## 🔗 Dependencies
- Encore.ts framework (queue, pub/sub, database)
- PostgreSQL for event persistence
- Redis for pub/sub messaging
- React + SSE for frontend streaming

---

## 📝 Notes
**Allowed Tech Debt for M1:**
- Hardcoded tenant ID (single-tenant mode)
- In-memory orchestrator state (no checkpoints)
- Mock device actions (no real Appium)
- No artifact storage (screenshots come in M2)
- Simple demo nodes (full node set in M3-M4)

**Key Decisions:**
- Use SSE over WebSocket for simplicity and auto-reconnect
- Outbox pattern for deterministic event ordering
- Redis pub/sub for ephemeral live streaming
- PostgreSQL as source of truth for event history
