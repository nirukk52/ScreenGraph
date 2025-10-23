# Milestone 1 — Ticket Tracker

**Last Updated:** 2025-10-23

---

## 📊 Summary

| Type | Total | Completed | In Progress | Blocked |
|------|-------|-----------|-------------|---------|
| Feature Requests | 8 | 0 | 0 | 0 |
| Tech Debt | 0 | 0 | 0 | 0 |
| Bugs | 0 | 0 | 0 | 0 |

---

## 🎫 Feature Requests

### Backend API
- **FR-001:** POST /crawl endpoint - Start new crawl run
- **FR-002:** GET /crawl/:id/stream endpoint - SSE event stream
- **FR-003:** POST /crawl/:id/cancel endpoint - Cancel running crawl

### Orchestrator & Workers
- **FR-004:** Orchestrator worker with demo node execution
- **FR-005:** Outbox publisher job with 200ms polling

### Database & Events
- **FR-006:** Database schema for crawl runs and events
- **FR-007:** Event ordering and deduplication logic

### Frontend
- **FR-008:** Timeline UI component with SSE integration

---

## 🔧 Tech Debt
_None yet (greenfield milestone)_

---

## 🐛 Bugs
_To be tracked as discovered during development_

---

## 🔗 Cross-Milestone Dependencies
_None for M1 (foundational milestone)_
