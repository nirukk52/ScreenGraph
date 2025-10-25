# Glossary — ScreenGraph Domain Language

**Purpose**: Canonical dictionary of all terms, abbreviations, and concepts used in ScreenGraph. Use these exact terms consistently across code, docs, and communication.

**Last Updated**: 2025-10-23

---

## Core Entities

### Agent
**Definition**: AI-powered system that autonomously explores a mobile app using Appium.

**Usage**: "The agent takes screenshots and taps UI elements to discover screens."

**Not**: bot, spider, worker, crawler (use "agent" consistently)

**Technical**: Aggregate root in the agent service, owns run lifecycle.

---

### Run
**Definition**: A single execution of an agent exploring an app from start to finish.

**Usage**: "Each run produces a graph of screens and transitions."

**Not**: job, task, execution, crawl, session (use "run")

**Technical**: Aggregate root in the run service, tracks state and results.

---

### Screen
**Definition**: A unique UI state within an app, identified by visual similarity.

**Usage**: "The app has 42 unique screens including login, home, and settings."

**Not**: page, view, activity, fragment (use "screen" for mobile apps)

**Technical**: Node in the graph, stored with screenshot and metadata.

---

### Screenshot
**Definition**: A captured image of the app's UI at a specific moment.

**Usage**: "The agent takes a screenshot after each tap to detect state changes."

**Not**: image, picture, snap, capture (use "screenshot")

**Technical**: Binary blob stored in object storage, referenced by screen ID.

---

### Node
**Definition**: A vertex in the app graph representing a unique screen.

**Usage**: "The graph contains 50 nodes and 120 edges."

**Not**: vertex, state, page-node (use "node" in graph context)

**Technical**: Graph data structure element, contains screen metadata.

---

### Edge
**Definition**: A directed connection between two screens representing a user action (e.g., tap button).

**Usage**: "An edge connects the login screen to the home screen."

**Not**: link, connection, transition, arc (use "edge" in graph context)

**Technical**: Graph data structure element, contains action metadata (tap coordinates, element ID).

---

### Analysis
**Definition**: ML-powered processing of screenshots to extract UI elements and insights.

**Usage**: "The analysis detected 15 buttons and 3 input fields on this screen."

**Not**: report, analytics, insights (use "analysis" for the process, "report" for the output)

**Technical**: Aggregate root in the analysis service, owns element detection.

---

### Element
**Definition**: A detected UI component within a screenshot (button, input, text, image).

**Usage**: "Each element has a bounding box and type classification."

**Not**: component, widget, view (use "element" for detected UI parts)

**Technical**: Stored with bounding box coordinates and confidence score.

---

## Technical Concepts

### Outbox Pattern
**Definition**: Transactional event publishing by writing events to a database table, then publishing asynchronously.

**Usage**: "Events are written to the outbox table in the same transaction as domain changes."

**Technical**: Guarantees at-least-once delivery of events even if Pub/Sub is down.

---

### Event Sourcing
**Definition**: Storing state changes as a sequence of append-only events.

**Usage**: "Agent state transitions are event-sourced for full audit trail."

**Technical**: Events are immutable, state is derived by replaying events.

---

### Aggregate Root
**Definition**: The entry point entity in a cluster of related domain objects (DDD concept).

**Usage**: "Agent is the aggregate root for all run-related entities."

**Technical**: Enforces invariants and owns lifecycle of related entities.

---

### Domain Event
**Definition**: A significant state change in the system, published for other services to react to.

**Usage**: "The `agent.run.completed` event triggers analysis."

**Technical**: Named `<service>.<aggregate>.<action>`, immutable, versioned.

---

### Port
**Definition**: An interface defining how the domain interacts with external systems (Hexagonal Architecture).

**Usage**: "AgentRepository is a port implemented by PostgresAgentRepository adapter."

**Technical**: Domain depends on ports, not adapters (dependency inversion).

---

### Adapter
**Definition**: An implementation of a port that integrates with a specific technology.

**Usage**: "PostgresAgentRepository is an adapter for database persistence."

**Technical**: Lives in adapters/ folder, implements port interface.

---

## App-Specific Terms

### App Package
**Definition**: The unique identifier for a mobile app (e.g., `com.example.myapp`).

**Usage**: "Agent runs the app with package `com.instagram.android`."

**Technical**: Used by Appium to launch the app on device/emulator.

---

### UI Bounds
**Definition**: The rectangular coordinates (x, y, width, height) of a UI element.

**Usage**: "The button's UI bounds are (100, 200, 150, 50)."

**Technical**: Stored as bounding box for element detection.

---

### Perceptual Hash
**Definition**: A fingerprint of an image that allows similarity comparison.

**Usage**: "Screens are deduplicated using perceptual hash matching."

**Technical**: pHash algorithm, returns 64-bit hash for screenshot.

---

### Flow
**Definition**: A sequence of screens connected by edges, representing a user journey.

**Usage**: "The login flow consists of splash → login → home screens."

**Technical**: Subgraph extracted from main graph using path analysis.

---

### Comparison
**Definition**: Side-by-side analysis of two app graphs to find similarities and differences.

**Usage**: "The comparison shows both apps have similar onboarding flows."

**Technical**: Graph diffing algorithm with screen matching heuristics.

---

## Status Values

### Agent Status
- `idle` — created but not running
- `running` — actively executing run
- `paused` — temporarily stopped
- `completed` — finished successfully
- `failed` — terminated with error

---

### Run Status
- `pending` — queued but not started
- `running` — in progress
- `completed` — finished successfully
- `failed` — terminated with error
- `cancelled` — stopped by user

---

### Analysis Status
- `pending` — queued for processing
- `processing` — AI analyzing screenshots
- `completed` — results available
- `failed` — error during analysis

---

## Abbreviations (Allowed)

Use these sparingly, and only in code (not user-facing text):

- **ID**: Identifier (e.g., `agentId`, `runId`)
- **URL**: Uniform Resource Locator
- **API**: Application Programming Interface
- **UI**: User Interface
- **DB**: Database
- **DTO**: Data Transfer Object
- **CRUD**: Create, Read, Update, Delete
- **E2E**: End-to-End (testing)
- **CI/CD**: Continuous Integration/Continuous Deployment
- **WIP**: Work in Progress

---

## Event Names

All events follow the pattern: `<service>.<aggregate>.<action>`

### Agent Events
- `agent.created` — new agent registered
- `agent.updated` — agent configuration changed
- `agent.deleted` — agent removed
- `agent.run.started` — run initiated
- `agent.run.paused` — run temporarily stopped
- `agent.run.resumed` — run restarted after pause
- `agent.run.completed` — run finished successfully
- `agent.run.failed` — run terminated with error

### Graph Events
- `graph.screen.discovered` — new screen found
- `graph.screen.merged` — duplicate screen detected
- `graph.edge.created` — new transition recorded

### Analysis Events
- `analysis.requested` — user requested analysis
- `analysis.processing` — AI analyzing screenshots
- `analysis.completed` — results available
- `analysis.failed` — error during processing

---

## Anti-Patterns (Don't Use)

❌ **Ambiguous terms**:
- "process" (too generic — use "run", "analysis", or specific action)
- "data" (too vague — use "screenshot", "element", "graph")
- "item" (too abstract — use specific entity name)
- "crawl" (replaced by "run")
- "session" (replaced by "run")

❌ **Inconsistent pluralization**:
- Don't mix "agent" and "agents" in same context
- Use plural for collections: `agents`, `screens`, `elements`

❌ **Overloaded terms**:
- Don't call both UI elements and graph nodes "component"
- Don't call both analysis output and strategic docs "report"

---

## Usage Examples

### ✅ Good
```typescript
const agent = await agentRepository.findById(agentId);
const run = await agent.startRun({ maxScreens: 100 });
await publishEvent("agent.run.started", { agentId, runId: run.id });
```

### ❌ Bad
```typescript
const bot = await getBot(id);
const job = await bot.start({ limit: 100 });
await sendEvent("crawl_begin", { botId: id, jobId: job.id });
```

---

## Adding New Terms

When introducing a new concept:

1. **Check glossary first** — avoid duplicate names
2. **Choose clear name** — prefer clarity over brevity
3. **Document here** — add to appropriate section
4. **Update code** — use consistently across codebase
5. **Notify team** — if term changes existing usage

---

**Remember**: Shared language prevents miscommunication. When in doubt, check this glossary and use exact terms.
