# Code Style Preferences

**Status**: Active  
**Last Updated**: 2025-10-23  
**Nature**: Soft guidelines (not enforced by CI)

---

## Philosophy

Code style is **subjective but valuable**. These preferences create consistency and make code feel cohesive across the project.

**When to follow**: New code, greenfield features, refactors  
**When to ignore**: Legacy code that works, hot fixes, experimental spikes

---

## TypeScript Style

### Prefer `const` Over `let`
```typescript
// ✅ Preferred
const total = items.reduce((sum, item) => sum + item.price, 0);

// ⚠️ Acceptable if truly needed
let count = 0;
for (const item of items) count++;

// ❌ Avoid
let total = 0;
items.forEach(item => total += item.price);
```

**Why**: Signals immutability, prevents accidental reassignment.

---

### Explicit Over Implicit
```typescript
// ✅ Preferred — explicit return type
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ⚠️ Acceptable for simple cases
const sum = (a: number, b: number) => a + b;
```

**Why**: Self-documenting, catches type errors at function boundary.

---

### Destructuring for Clarity
```typescript
// ✅ Preferred
const { agentId, runId, status } = runData;

// ⚠️ Acceptable for single property
const agentId = runData.agentId;

// ❌ Avoid when destructuring helps
const id1 = runData.agentId;
const id2 = runData.runId;
const s = runData.status;
```

---

### Early Returns Over Deep Nesting
```typescript
// ✅ Preferred — guard clauses
export function processAgent(agent: Agent | null): void {
  if (!agent) return;
  if (agent.status !== "idle") return;
  if (!agent.config.isValid()) return;
  
  agent.start();
}

// ❌ Avoid — pyramid of doom
export function processAgent(agent: Agent | null): void {
  if (agent) {
    if (agent.status === "idle") {
      if (agent.config.isValid()) {
        agent.start();
      }
    }
  }
}
```

**Why**: Reduces cognitive load, easier to follow logic.

---

### Optional Chaining for Safety
```typescript
// ✅ Preferred
const userName = user?.profile?.name ?? "Anonymous";

// ⚠️ Acceptable if null checks needed
if (user && user.profile && user.profile.name) {
  console.log(user.profile.name);
}
```

---

## React Style

### Functional Components Only
```typescript
// ✅ Preferred
export function AgentCard({ agent }: { agent: Agent }) {
  return <div>{agent.name}</div>;
}

// ❌ Avoid — class components are legacy
export class AgentCard extends React.Component { }
```

**Why**: Hooks API is modern standard, simpler to reason about.

---

### Named Props Interface
```typescript
// ✅ Preferred
interface AgentCardProps {
  agent: Agent;
  onStart: (agentId: string) => void;
  showDetails?: boolean;
}

export function AgentCard({ agent, onStart, showDetails = false }: AgentCardProps) {
  // ...
}

// ⚠️ Acceptable for very simple components
export function AgentCard({ agent }: { agent: Agent }) { }
```

---

### Extract Complex JSX
```typescript
// ✅ Preferred
export function AgentDashboard() {
  return (
    <div>
      <Header />
      <AgentList />
      <Footer />
    </div>
  );
}

// ❌ Avoid — everything in one component
export function AgentDashboard() {
  return (
    <div>
      <header>...</header>
      <main>
        {agents.map(agent => (
          <div key={agent.id}>
            <h2>{agent.name}</h2>
            <button onClick={() => handleStart(agent)}>Start</button>
            {/* 50 more lines... */}
          </div>
        ))}
      </main>
      <footer>...</footer>
    </div>
  );
}
```

---

### Hooks at Top Level
```typescript
// ✅ Preferred
export function AgentCard({ agentId }: { agentId: string }) {
  const agent = useAgent(agentId);
  const { startAgent } = useAgentActions();
  
  if (!agent) return <div>Loading...</div>;
  
  return <div>{agent.name}</div>;
}

// ❌ Avoid — conditional hooks
export function AgentCard({ agentId }: { agentId: string }) {
  if (!agentId) return null;
  const agent = useAgent(agentId); // Violates Rules of Hooks
}
```

---

## Formatting

### Line Length
- **Target**: 80-100 characters
- **Max**: 120 characters
- **Break long lines** at logical points (after commas, before operators)

```typescript
// ✅ Preferred
const result = await backend.agent.create({
  name: "Test Agent",
  appPackage: "com.example.app",
  config: { maxScreens: 100, timeout: 5000 }
});

// ❌ Avoid
const result = await backend.agent.create({ name: "Test Agent", appPackage: "com.example.app", config: { maxScreens: 100, timeout: 5000 } });
```

---

### Vertical Spacing
```typescript
// ✅ Preferred — breathing room between logical blocks
export function processAgents(agents: Agent[]): void {
  const idle = agents.filter(a => a.status === "idle");
  
  for (const agent of idle) {
    validateAgent(agent);
  }
  
  const results = idle.map(agent => startAgent(agent));
  
  logResults(results);
}

// ⚠️ Acceptable but cramped
export function processAgents(agents: Agent[]): void {
  const idle = agents.filter(a => a.status === "idle");
  for (const agent of idle) {
    validateAgent(agent);
  }
  const results = idle.map(agent => startAgent(agent));
  logResults(results);
}
```

---

### Object/Array Formatting
```typescript
// ✅ Preferred — multi-line for >3 properties
const agent = {
  id: "agent-1",
  name: "Test Agent",
  status: "idle",
  config: validConfig
};

// ✅ Acceptable — single line for ≤3 properties
const point = { x: 10, y: 20 };

// ✅ Preferred — trailing commas (easier diffs)
const colors = [
  "red",
  "green",
  "blue",
];
```

---

## Naming Style

See `rules/naming-conventions.md` for hard rules. These are stylistic preferences:

### Descriptive Over Short
```typescript
// ✅ Preferred
const isAgentReadyToStart = agent.status === "idle" && agent.config.isValid();

// ⚠️ Acceptable in very local scope
const rdy = agent.status === "idle";
```

---

### Verb Functions, Noun Variables
```typescript
// ✅ Preferred
function startAgent(agent: Agent) { }
const agentStatus = getStatus(agent);

// ❌ Avoid
function agent(agent: Agent) { } // Confusing
const start = startAgent(agent); // What is "start"?
```

---

### Positive Boolean Names
```typescript
// ✅ Preferred
const isValid = validateConfig(config);
const canStart = agent.status === "idle";

// ⚠️ Avoid negatives
const isNotValid = !validateConfig(config);
const cannotStart = agent.status !== "idle";
```

---

## Error Handling Style

### Specific Error Types
```typescript
// ✅ Preferred
try {
  await startCrawl(agent);
} catch (err) {
  if (err instanceof AgentNotFoundError) {
    logger.error("Agent not found", { agentId: agent.id });
  } else if (err instanceof InvalidConfigError) {
    logger.error("Invalid config", { config: agent.config });
  } else {
    throw err; // Re-throw unexpected errors
  }
}

// ❌ Avoid — swallowing all errors
try {
  await startCrawl(agent);
} catch (err) {
  console.log("Error occurred");
}
```

---

### Logging Before Throwing
```typescript
// ✅ Preferred
if (!agent) {
  logger.error("Agent not found", { agentId });
  throw new AgentNotFoundError(agentId);
}

// ⚠️ Acceptable if error is logged at higher level
if (!agent) {
  throw new AgentNotFoundError(agentId);
}
```

---

## Comments Style

### Use JSDoc for Public APIs
```typescript
// ✅ Preferred
/**
 * Starts a crawl session for the given agent.
 * 
 * @param agentId - The unique identifier of the agent
 * @param options - Crawl configuration options
 * @returns The created crawl session
 * @throws AgentNotFoundError if agent doesn't exist
 */
export async function startCrawl(
  agentId: string,
  options: CrawlOptions
): Promise<CrawlSession> {
  // ...
}
```

---

### Inline Comments for "Why", Not "What"
```typescript
// ✅ Preferred — explains reasoning
// Retry with exponential backoff to handle transient network failures
const result = await retryWithBackoff(fetchData);

// ❌ Avoid — states the obvious
// Call retry function
const result = await retryWithBackoff(fetchData);
```

---

## Imports Style

### Group and Sort
```typescript
// ✅ Preferred
// 1. Node/external packages (alphabetical)
import { api } from "encore.dev/api";
import { v4 as uuid } from "uuid";

// 2. Internal absolute imports (alphabetical)
import type { Agent } from "~backend/agent/types";
import backend from "~backend/client";

// 3. Relative imports (alphabetical)
import { CrawlEngine } from "./crawl-engine";
import { parseScreenshot } from "./utils/parse-screenshot";
```

---

### Named Imports
```typescript
// ✅ Preferred
import { startAgent, stopAgent, pauseAgent } from "./agent-actions";

// ⚠️ Acceptable for namespace grouping
import * as AgentActions from "./agent-actions";
```

---

## When to Break the Rules

These are **preferences**, not laws. Break them when:

1. **Legacy code**: Don't rewrite working code just for style
2. **Performance**: If style hurts performance (rare)
3. **External APIs**: Match third-party library conventions
4. **Team consensus**: If team agrees on different style

---

## Tooling

### Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

### ESLint Recommendations
- `@typescript-eslint/explicit-function-return-type` (warn)
- `prefer-const` (error)
- `no-var` (error)

---

**Remember**: Style matters for team cohesion, but shipping working software matters more. Don't bikeshed.
