# Milestone 2 — Orchestration Node Wiring & Device Bring-up

**Status:** Planned  
**Start Date:** TBD  
**Target Completion:** TBD  
**Owner:** Backend Agent Team

---

## 🎯 Goal
Wire initial setup nodes into the NodeEngine and validate end-to-end execution on a real/emulated device with structured logging visible in the Encore dashboard.

---

## 📦 Deliverables
- EnsureDevice handler wired to SessionPort (WebDriverIO adapter)
- ProvisionApp handler wired; backtrack to EnsureDevice after retries
- Orchestrator emits node started/finished events via recordNodeEvents
- Worker runs engine loop (at least one full EnsureDevice → ProvisionApp cycle)
- Full snapshots persisted and “Snapshot saved” logs emitted per step
- Dashboard filters verified (module/actor/runId)

---

## ✅ Acceptance Criteria
- Start a run → agent claims and executes at least two nodes
- On ProvisionApp failure after 3 retries → backtrack to EnsureDevice and proceed
- Logs show module/actor, runId, nodeName, stepOrdinal, retry/backoff
- Events appended in order; snapshots saved for each step

---

## 🧩 Tasks & Todos
1. Register handlers in `node-registry.ts` and enable engine in `worker.ts`
2. Map `EngineContext` from RunJob (device config, app descriptor)
3. Use `WebDriverIOSessionAdapter` for `SessionPort`
4. Emit `recordNodeEvents` around each runOnce
5. Persist snapshots after each step
6. Add retry sleep using computed backoff delay
7. Verify Encore dashboard logs and sequences

---

## 🔗 References
- backend/agent/orchestrator/node-engine.ts
- backend/agent/orchestrator/node-registry.ts
- backend/agent/orchestrator/worker.ts
- backend/agent/orchestrator/orchestrator.ts
- backend/agent/adapters/appium/webdriverio/session.adapter.ts
- docs/FOUNDER_QA_METHODOLOGY.md
- backend/logging/CLAUDE.md

---

## 🧪 Test Plan
- Local device/emulator run triggered via POST /run
- Observe worker logs and events in Encore dashboard
- Induce ProvisionApp failure to validate retry/backtrack
- Confirm snapshots available in DB for each stepOrdinal

---

## 📈 Success Metrics
- First step executed in < 5s from job publish
- Retry/backoff bounded (≤ 5s max)
- Zero missing snapshots for executed steps
