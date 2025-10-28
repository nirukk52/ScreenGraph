# ScreenGraph — Backend Agent Module Review (As of 2025-10-28)

**Scope:** Agent module inside `backend/`. You’ve just finished **EnsureDevice**, scaffolded core pieces, and are about to **ProvisionApp**. Goal is to **ship fast** without compromising the **core, deterministic architecture**.

---

## Strategic Angle — [POC] [MVP] [POST_MVP] [NORTHSTAR]

**Where we are:** We’ve proven the **device handshake** (EnsureDevice). The runway is clear to get to a first “tap-through & capture” vertical slice.

**Why this matters for business:** The **first value moment** for users is seeing a **live run** produce **screenshots + UI dumps** stitched into a small ScreenGraph. If we can do that with clean events and replay, we can start demos and design partner conversations.

**Northstar:** **Deterministic, replayable agent runs** that turn into **graphs** with artifacts and typed events. This is the core of our **enterprise story** (auditability, SLA, repeatability) and **GTM narrative** (a living map that never lies).

---

## What’s Good (Keep / Double Down)

1) **Clean “ports & adapters” intent** — [POC→MVP]  
   - The `DriverPort` abstraction is crisp. We can swap WDIO/Appium/ADB later.
   - Aligns with our **DB-write-only agent**: domain logic stays pure, adapter touches the device.

2) **Event-sourced thinking** — [MVP]  
   - You’ve already got the **run events** mindset (monotonic `seq`, outbox later). That’s the backbone for **replay**, **post‑mortems**, and **progress tracking**.

3) **Node scaffolding mirrors LangGraph-like loop** — [POC]  
   - EnsureDevice → Launch/Attach → WaitIdle → Perceive → Enumerate → Choose → Act → Verify → Persist. This is the right decomposition for later policy switching/recovery.

4) **Determinism-first tone** — [MVP]  
   - You’re choosing to keep runner features **out of the loop**. The agent owns timeouts, retries, and seeds. That keeps demos credible and failures explainable.

5) **Rapid-dev energy is real** — [POC]  
   - You’re shipping. The trick now is **channeling speed into a narrow vertical** that proves end-to-end value without tech sprawl.

---

## What’s Rough / Risky (Fix Soon)

1) **Vendor session leakage** — [CRITICAL][POC]  
   - Method signatures still pass `sessionId`. This couples domain to the driver.  
   **Fix:** Use only our **`deviceRuntimeContextId`** in the port. The adapter hides vendor sessions.

2) **Artifacts returned as raw strings** — [CRITICAL][MVP]  
   - `captureScreenshot()` / `dumpUiHierarchy()` return strings. That invites memory bloat and breaks replay.  
   **Fix:** Store once to object storage, return **`artifactId`**. Hash for dedupe.

3) **No canonical error taxonomy** — [CRITICAL][MVP]  
   - Without typed errors, recovery becomes ad hoc.  
   **Fix:** Define 6–8 **driver error kinds** (e.g., `DRIVER_TIMEOUT`, `SESSION_LOST`, `APP_NOT_FOREGROUND`, `INPUT_FAILED`). Map vendor errors in the adapter.

4) **Hidden timing assumptions** — [HIGH][MVP]  
   - If the adapter injects waits/retries implicitly, we lose determinism.  
   **Fix:** All waits/retries/time budgets must come from **AgentState** and be **event-emitted**.

5) **Gesture coordinate ambiguity** — [HIGH][MVP]  
   - Taps/swipes may vary by rotation, density, insets.  
   **Fix:** Lock **viewport pixel** space and centralize transforms (rotation, safe areas). Document it.

6) **App lifecycle gaps** — [MEDIUM][POST_MVP]  
   - We’ll need `bringToForeground`, `ensureAppInstalled`, `clearAppState` soon.  
   **Fix:** Keep them in the port (even as stubs) so we don’t break the interface later.

7) **No conformance suite** — [MEDIUM][MVP]  
   - We need a repeatable micro-flow to compare adapters and detect flakiness.  
   **Fix:** Build a **10-step conformance** that asserts only on **events + artifact IDs**.

---

## Critical-to-Fix Checklist (Short, Unambiguous)

- [ ] Replace all `sessionId` params with **`deviceRuntimeContextId`** in `DriverPort`.  
- [ ] `captureScreenshot` and `dumpUiHierarchy` → **persist + return `artifactId`**, not blobs.  
- [ ] Introduce **`DriverErrorKind`** enum and enforce mapping at the adapter boundary.  
- [ ] Push **time budgets / retries** from AgentState; **no implicit waits** in the adapter.  
- [ ] Lock **tap/swipe coordinate contract** (viewport px; rotation-aware).  
- [ ] Emit **start/finish/error** events for every driver call with a **correlationId**.  
- [ ] Write the **conformance micro-flow** and baseline flake/p95 before adding features.

---

## Architectural Direction — What We Lock Now

**Interface shape (no code, just the contract):**

- Inputs: `deviceRuntimeContextId`, explicit **time budgets**, **correlationId**.  
- Outputs: `InteractionReceipt` (id, startedAt, finishedAt, optional foreground app/activity), or `artifactId`.  
- Errors: one of `DriverErrorKind` values only. Everything else is wrapped and logged as `INTERNAL_DRIVER_ERROR` with vendor detail in payload.

**Event story:**  
- Every adapter call emits `agent.node.started/finished` and specific `agent.event.*` (e.g., `screenshot_captured`, `ui_hierarchy_captured`, `action_performed`).  
- Outbox publishes to interested services (graph builder, artifact ingestor, progress tracker).

**Data story:**  
- Artifacts → object storage; DB stores **index + hash**; events carry `artifactId`.  
- `run_events` remain the **source of truth** for replay; nothing writes outside that flow.

---

## Execution Plan — Thin, Deterministic Vertical Slice

**[POC] This week**  
1) **EnsureDevice → ProvisionApp → WaitIdle → Perceive → Tap → Verify** on a single APK.  
2) Persist **one screenshot** and **one UI dump** per screen, return `artifactId`s.  
3) Emit typed events; no implicit waits. Baseline p50/p95 and flake (<2%).

**[MVP] Next 10–14 days**  
1) Add **EnumerateActions** (simple heuristics from UI dump) and **ChooseAction** (naive policy).  
2) Add **RecoverFromError** using `DriverErrorKind`.  
3) Publish **outbox** to a thin **graph builder** that turns events into a tiny ScreenGraph for the run.

**[POST_MVP]**  
1) App lifecycle helpers (foreground/install/clear).  
2) Environment probes (window metrics, keyboard).  
3) Rich gestures and IME niceties.

**[NORTHSTAR]**  
- Multi-adapter parity (WDIO client vs Appium JS vs ADB) via the conformance suite.  
- Replay a run on CI and get the same graph + artifacts under the same IDs.

---

## Risks + Mitigation

- **Flaky device state** → *Mitigation:* `WaitIdle` heuristics + explicit budgets, restart app on ANR suspicion.  
- **Artifact bloat** → *Mitigation:* Deduplicate via content hash, TTL on raw blobs, keep only indices in DB.  
- **Team drift toward test-runner patterns** → *Mitigation:* ADR that forbids runner hooks/services in agent loop.  
- **Vendor lock** → *Mitigation:* Tiny `DriverPort`, conformance suite, adapter swap is cheap.

---

## Next Move — Simple and Immediate

- Approve the **port hygiene** changes (contextId in, artifactId out, typed errors).  
- Add the **conformance micro-flow** before we wire more nodes.  
- Ship the **first end-to-end demo run**: launch app → capture → tap → verify → emit a 4–6 node graph with artifacts.  
- Start **design partner outreach** the moment we can show a replayable run.

---

### Appendix — Suggested `DriverErrorKind` (v1)

```
DRIVER_TIMEOUT
SESSION_LOST
APP_NOT_FOREGROUND
INPUT_FAILED
VISIBILITY_STALE
WINDOW_METRICS_UNKNOWN
INTERNAL_DRIVER_ERROR
```

Keep it small and useful. Map vendor details under `payload.vendor` in the event.
