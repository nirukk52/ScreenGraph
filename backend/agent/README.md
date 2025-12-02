# ONE GIANT MAP — TECH STACK + CLOUD + NODES + BUSINESS VALUE

+-----------------------------------------------------------------------------------------------------------------+
|                                               BUSINESS LAYER                                                    |
|  * Primary Use-Cases *                                                                                          |
|    - Full automated mobile QA                                                                                   |
|    - Visual regression + drift detection                                                                        |
|    - Competitive analysis (auto-mapping competitor apps)                                                        |
|    - CI/CD blocking on UX changes                                                                               |
|    - Product insights: new flows, abandoned paths, UX stability                                                 |
|    - Release-over-release diff timelines                                                                         |
|    - PM-facing screen explorer dashboards                                                                        |
|    - Engineering reproducible bug reports                                                                         |
|                                                                                                                 |
|  * Stakeholders *                                                                                               |
|    - QA Teams | Product Managers | Founders | Designers | Analysts                                              |
+-----------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
+-----------------------------------------------------------------------------------------------------------------+
|                                          CLOUD DEVICE PROVIDERS                                                 |
|   (Execution backend for ACT + PERCEIVE)                                                                        |
|     - AWS Device Farm: real devices, parallel runs, screenshots, videos                                         |
|     - BrowserStack App Automate: instant devices, Appium endpoints                                              |
|     - Sauce Labs: automated mobile flows + advanced debugging                                                    |
|                                                                                                                 |
|    All feed into: ScreenGraph DriverPort → Perceive → Act                                                       |
+-----------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
+-----------------------------------------------------------------------------------------------------------------+
|                                        TOOLING + ANALYSIS LAYER                                                 |
|   *Dynamic Crawlers & Fuzzers*                                                                                  |
|       - DroidBot, DroidRun, Fastbot, Stoat, Ape, Monkey, MarlonTool, DroidMate                                 |
|   *State/Model Extractors*                                                                                      |
|       - Gator, DroidFax, FlowDroid                                                                              |
|   *Runtime Introspection Tools*                                                                                 |
|       - Stetho, Flipper, Facebook Infer                                                                         |
|   *APK / XML Processing*                                                                                        |
|       - Apktool, AXMLPrinter2, uiautomatorviewer                                                                |
|   *LLM / AI Engines*                                                                                            |
|       - Humanoid, GPT/LLM-based Explorers                                                                       |
|                                                                                                                 |
|   Role: Enrich ENUMERATE / CHOOSE / VERIFY / PERSIST / DETECTPROGRESS                                          |
+-----------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
+-----------------------------------------------------------------------------------------------------------------+
|                                        CORE SCREENGRAPH ENGINE                                                  |
|   State-Space Engine:                                                                                           |
|      - ScreenGraph (screenId ↔ hash)                                                                            |
|      - ActionGraph (edges)                                                                                      |
|      - Coverage metrics (screens, edges, paths)                                                                 |
|      - Loop detection, stall scoring                                                                            |
|                                                                                                                 |
|   Visual Engine:                                                                                                |
|      - Perceptual hashing (pHash/dHash/SSIM)                                                                    |
|      - Pixel diffs, layout diffs, drift scoring                                                                 |
|                                                                                                                 |
|   Replay Engine:                                                                                                |
|      - Deterministic reproduction of any run                                                                    |
+-----------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
+-----------------------------------------------------------------------------------------------------------------+
|                           8-NODE DETERMINISTIC LOOP (HEART OF THE SYSTEM)                                      |
|                                                                                                                 |
|   [1] PERCEIVE → capture screenshot + XML + hash                                                                |
|   [2] ENUMERATE → extract actionable elements                                                                   |
|   [3] CHOOSE → strategy/AI/coverage-guided decision                                                              |
|   [4] ACT → execute via Appium/ADB/Cloud Device                                                                  |
|   [5] VERIFY → confirm visual or structural change                                                               |
|   [6] PERSIST → upsert screen/action + edges in graph                                                            |
|   [7] DETECT PROGRESS → stall/forward/loop                                                                       |
|   [8] SHOULD CONTINUE → continue / restart app / switch policy / stop                                            |
|                                                                                                                 |
|   Single writer: run_events                                                                                     |
+-----------------------------------------------------------------------------------------------------------------+
                                                         |
                                                         v
+-----------------------------------------------------------------------------------------------------------------+
|                                             RUNTIME CORE                                                         |
|   - Event log (run_events)                                                                                      |
|   - Outbox (strict publish ordering)                                                                            |
|   - Graph projector (screens/actions/edges)                                                                      |
|   - Deterministic replay core                                                                                    |
+-----------------------------------------------------------------------------------------------------------------+


# ScreenGraph Agent System (MVP Scaffolding)

## Service Role
- Orchestrates autonomous exploration deterministically (XState machine) and is the single writer to `run_events`.
- Produces artifacts (screenshots, XML) via the `artifacts` service; stores only IDs/refs in state.
- Does not write screen graph tables; emits events that the `graph` service projects into `screens/actions/edges`.
- Cooperates with the `run` service for lifecycle (start/cancel) and SSE streaming.
- Strictly uses Encore generated clients; maintains replayable snapshots for determinism.

Complete scaffolding for the ScreenGraph Agent System following **functional core, imperative shell** architecture with deterministic execution, event sourcing, and full replay support.

https://chatgpt.com/g/g-p-68c870437ca0819195275f9bbbc56103-co-founder/shared/c/68fde20c-99e0-8330-b4f6-f6946dbb1faf?owner_user_id=user-GfWs3AJR2WbUgbsITOoW13pl

## Architecture Overview

### Design Principles
- **Determinism**: Same inputs → identical outputs (seeded RNG, orchestrator-controlled timestamps)
- **ID-First State**: No heavy payloads in state; only IDs/refs to external artifacts
- **Single Writer**: Orchestrator owns all writes to `run_events`, `agent_state_snapshots`
- **Pure Nodes**: All 17 nodes are side-effect-free; I/O via ports only
- **Outbox Discipline**: Monotonic `sequence` per run, strictly ordered publishing
- **Terminal Guarantee**: Exactly one terminal event via CAS on `runs.status`

### Folder Structure

```
backend/agent/
├── domain/              # Core business types (state, events, entities)
│   ├── state.ts         # AgentState (ID-first) + validation helpers
│   ├── events.ts        # Domain event contracts
│   └── entities.ts      # Candidate, Decision, Outcome, etc.
├── nodes/               # Pure functions implementing agent logic
│   ├── setup/           # 4 setup nodes (EnsureDevice, ProvisionApp, LaunchOrAttach, WaitIdle)
│   ├── main/            # 8 main loop nodes (Perceive → ShouldContinue)
│   ├── policy/          # 2 policy nodes (SwitchPolicy, RestartApp)
│   ├── recovery/        # 2 recovery nodes (RecoverFromError, ResumeFromCheckpoint)
│   └── terminal/        # 1 stop node (Stop)
├── orchestrator/        # Single writer; assigns seq; owns seed & timestamps
│   ├── orchestrator.ts  # Main orchestration logic
│   ├── router.ts        # ShouldContinue routing
│   └── outbox.ts        # Ordered publishing (append-only discipline)
├── ports/               # Interface contracts for all I/O
│   ├── ocr.port.ts      # OCR processing
│   ├── repo.port.ts     # Persistence operations
│   ├── storage.port.ts  # Object storage
│   └── llm.port.ts      # LLM-based action enumeration
├── adapters/fakes/      # In-memory implementations of all ports
│   ├── fake-driver.ts   # Deterministic device simulation
│   ├── fake-ocr.ts      # Deterministic OCR
│   ├── fake-storage.ts  # In-memory storage
│   ├── fake-llm.ts      # Rule-based action enumeration
│   └── fixtures/        # Static test data
├── persistence/         # In-memory repository
│   └── in-memory-repo.ts # In-memory test implementation combining all ports
├── policies/            # Configuration
│   └── default.json     # maxSteps, maxTimeMs, restartLimit, etc.
├── cli/                 # Command-line tools
│   ├── demo.ts          # Main demo: `npm run agent:demo`
│   └── show-run.ts      # Timeline printer
└── tests/               # Determinism & idempotency tests
    ├── golden-run.test.ts
    ├── determinism.test.ts
    └── idempotency.test.ts
```

## Node Categories

### Setup Nodes (4)
1. **EnsureDevice** - Verify device/emulator availability
2. **ProvisionApp** - Ensure target app is installed
3. **LaunchOrAttach** - Launch app or attach to existing session
4. **WaitIdle** - Ensure UI is stable before perception

### Main Loop Nodes (8)
1. **Perceive** - Capture screenshot and UI hierarchy
2. **EnumerateActions** - Derive actionable operations
3. **ChooseAction** - Select next action (heuristic for MVP)
4. **Act** - Execute selected UI action
5. **Verify** - Confirm action produced UI change
6. **Persist** - Persist screens/actions to graph
7. **DetectProgress** - Decide if making forward progress
8. **ShouldContinue** - Route to next step (CONTINUE | SWITCH_POLICY | RESTART_APP | STOP)

### Policy Nodes (2)
1. **SwitchPolicy** - Change exploration strategy (stubbed for MVP)
2. **RestartApp** - Relaunch app cleanly

### Recovery Nodes (2)
1. **RecoverFromError** - Handle transient failures
2. **ResumeFromCheckpoint** - Reload last state snapshot (stubbed)

### Terminal Node (1)
1. **Stop** - Emit exactly one terminal event

## Running the Demo

```bash
# Install dependencies (if not already)
cd backend
npm install

# Run the demo
npm run agent:demo

# Or with ts-node directly
npx ts-node agent/cli/demo.ts
```

### Expected Output

```
🚀 ScreenGraph Agent Demo Starting...

📋 Run ID: 01XXXXXXXXXXXXXXXXXXXXX
🎯 Budgets: maxSteps=50, maxTimeMs=300000ms

✅ Run created

=== SETUP PHASE ===

🔧 Step 1: EnsureDevice
   → Device session: 01DEVICECTX...

📦 Step 2: ProvisionApp
   → App status: PRESENT

🚀 Step 3: LaunchOrAttach
   → App foreground context: 01APPFG...

⏳ Step 4: WaitIdle
   → Quiet window: 500ms

=== MAIN LOOP (Stubbed - 3 iterations) ===

🔄 Iteration 1
   → Step 4 completed

🔄 Iteration 2
   → Step 5 completed

🔄 Iteration 3
   → Step 6 completed

=== TERMINAL PHASE ===

🛑 Step Final: Stop
   → Terminal disposition: SUCCEEDED

📤 Published XX events in order

📊 Final Stats:
   - Total events: XX
   - Total steps: 6
   - Status: completed
   - Stop reason: success

✅ Demo completed successfully!
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test golden-run.test.ts
npm test determinism.test.ts
npm test idempotency.test.ts
```

### Test Coverage

1. **Golden Run Test** - Validates identical results on repeat runs
2. **Determinism Test** - Verifies monotonic sequences and seeded RNG
3. **Idempotency Test** - Ensures duplicate events are rejected, CAS works

## Key Contracts

### AgentState (ID-First)

```typescript
interface AgentState {
  runId: string;
  policyVersion: number;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  
  // IDs only (no heavy payloads)
  deviceRuntimeContextId: string | null;
  applicationForegroundContextId: string | null;
  perception: {
    screenshotRefId: string | null;
    uiHierarchyXmlRefId: string | null;
    screenPerceptualHash64: string | null;
  };
  
  availableActionCandidateIds: string[];
  chosenActionDecisionId: string | null;
  // ... more ID refs
  
  counters: { stepsTotal, screensNew, ... };
  budgets: { maxSteps, maxTimeMs, ... };
  status: RunStatus;
}
```

### Domain Events

All events follow:

```typescript
interface DomainEvent {
  eventId: string;           // ULID
  runId: string;             // ULID
  tenantId: string;
  projectId: string;
  sequence: number;          // Monotonic per run
  ts: string;                // ISO-8601 UTC
  kind: EventKind;           // "agent.run.started" | "agent.node.finished" | ...
  version: string;           // "1"
  payload: Record<string, unknown>;
  checksum: string;          // sha256(eventId|runId|sequence|kind|payload)
}
```

## Guardrails

1. **Determinism**: Same inputs → same outputs (seeded RNG, timestamps from orchestrator)
2. **Immutability**: Nodes return new state; never mutate
3. **Idempotency**: Replay of same `(runId, stepOrdinal)` produces identical results
4. **Ordering**: `(run_id, sequence)` is globally unique; publisher reads strictly in order
5. **Minimal Snapshots**: Snapshot = small JSON + IDs to external artifacts
6. **Error Taxonomy**: Failures return `{errorId, retryable, humanReadableFailureSummary}`
7. **Cancellation**: Honor `CANCELED_REQUESTED` only at node boundaries
8. **Policy Versioning**: `policyVersion` scalar in state; switches explicit
9. **Security**: No PII; artifact IDs opaque
10. **Observability**: Token deltas/logs as domain events

## Next Steps

1. **Real Appium Integration** - Replace `FakeDriver` with Appium WebDriver
2. **Real LLM Integration** - Replace `FakeLLM` with GPT-4V or Claude
3. **SQL Persistence** - Replace `InMemoryRepo` with PostgreSQL
4. **Object Storage** - Replace `FakeStorage` with S3/GCS
5. **Full Main Loop** - Implement complete Perceive → ShouldContinue cycle
6. **UI Timeline Viewer** - Build frontend to visualize event streams

## References
Keep in mind that these maybe deprecated.
- [Architecture Docs](/steering-docs/architecture-founder-generated/)
- [Guardrails](/steering-docs/architecture-founder-generated/guardrails.md)
- [Requirements](/steering-docs/architecture-founder-generated/requirements.md)
- [Testing Requirements](/steering-docs/architecture-founder-generated/testing_requirements.md)
