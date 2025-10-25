# Naming Conventions

**Status**: Active  
**Last Updated**: 2025-10-23  
**Enforcement**: Linting + Code Review

---

## General Principles

1. **Clarity over brevity** — `agentCrawlSession` beats `acs`
2. **Consistency** — same patterns everywhere
3. **Domain language** — use terms from glossary
4. **No abbreviations** — except universally known (ID, URL, API)

---

## Files and Folders

### Folders
```
kebab-case

✅ Good:
- agent/
- run/
- analysis-report/

❌ Bad:
- Agent/
- crawlSession/
- analysis_report/
```

### Files
```
kebab-case.ts

✅ Good:
- create-agent.ts
- list-runs.ts
- agent-repository.ts

❌ Bad:
- CreateAgent.ts
- list_crawl_sessions.ts
- agentRepository.ts
```

### Test Files
```
{name}.test.ts

✅ Good:
- create-agent.test.ts
- agent-repository.test.ts

❌ Bad:
- create-agent.spec.ts
- test-agent-repository.ts
```

---

## TypeScript Code

### Functions and Methods
```typescript
camelCase

✅ Good:
function calculateTotal(items: Item[]): number { }
async function fetchUserData(userId: string): Promise<User> { }

❌ Bad:
function CalculateTotal(items: Item[]): number { }
function fetch_user_data(userId: string): Promise<User> { }
```

### Classes
```typescript
PascalCase

✅ Good:
class AgentCrawlEngine { }
class PostgresAgentRepository { }

❌ Bad:
class agentCrawlEngine { }
class postgres_agent_repository { }
```

### Interfaces and Types
```typescript
PascalCase

✅ Good:
interface AgentConfig { }
type CrawlStatus = "idle" | "running" | "completed";

❌ Bad:
interface agentConfig { }
type crawl_status = "idle" | "running" | "completed";
```

### Enums
```typescript
PascalCase for enum name, SCREAMING_SNAKE_CASE for values

✅ Good:
enum CrawlStatus {
  IDLE = "idle",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed"
}

❌ Bad:
enum crawlStatus {
  idle = "idle",
  running = "running"
}
```

### Constants
```typescript
SCREAMING_SNAKE_CASE

✅ Good:
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;

❌ Bad:
const maxRetryAttempts = 3;
const defaultTimeoutMs = 5000;
```

### Private Fields
```typescript
_prefixed (underscore prefix)

✅ Good:
class Agent {
  private _internalState: string;
  private _retryCount: number;
}

❌ Bad:
class Agent {
  private internalState: string;
  private retryCount: number;
}
```

### Boolean Variables
```typescript
is/has/can/should prefix

✅ Good:
const isActive = true;
const hasPermission = false;
const canRetry = true;
const shouldLog = false;

❌ Bad:
const active = true;
const permission = false;
```

---

## Events

### Event Names
```
<service>.<aggregate>.<action> (dot-separated, lowercase)

✅ Good:
- agent.run.started
- agent.run.completed
- agent.run.failed
- analysis.report.created
- analysis.report.published

❌ Bad:
- AgentCrawlStarted
- agent_crawl_started
- CrawlStarted (missing service context)
```

### Event Type Interfaces
```typescript
PascalCase + "Event" suffix

✅ Good:
interface CrawlStartedEvent { }
interface CrawlCompletedEvent { }

❌ Bad:
interface crawl_started_event { }
interface CrawlStarted { }
```

---

## Database

### Table Names
```
snake_case, plural

✅ Good:
- agents
- runs
- analysis_reports

❌ Bad:
- Agent
- CrawlSession
- analysisReports
```

### Column Names
```
snake_case

✅ Good:
- agent_id
- created_at
- session_duration_ms

❌ Bad:
- agentId
- createdAt
- sessionDurationMs
```

### Foreign Keys
```
{table}_id

✅ Good:
- agent_id (references agents.id)
- user_id (references users.id)

❌ Bad:
- agent
- userId
```

### Indexes
```
idx_{table}_{columns}

✅ Good:
- idx_agents_status
- idx_crawl_sessions_agent_id_created_at

❌ Bad:
- agent_status_index
- crawlSessionAgentIdIndex
```

---

## API Endpoints

### Endpoint Names
```
kebab-case, lowercase

✅ Good:
- /agents
- /agents/:id
- /agents/:id/start
- /runs

❌ Bad:
- /Agents
- /agents/:ID
- /agents/:id/Start
- /crawlSessions
```

### Path Parameters
```
camelCase

✅ Good:
- /agents/:agentId
- /runs/:runId

❌ Bad:
- /agents/:agent_id
- /crawl-sessions/:SessionId
```

### Query Parameters
```
camelCase

✅ Good:
?userId=123&maxResults=10&sortBy=createdAt

❌ Bad:
?user_id=123&max_results=10&sort_by=created_at
```

---

## Pub/Sub Topics

### Topic Names
```
kebab-case

✅ Good:
- agent-events
- run-events
- analysis-events

❌ Bad:
- AgentEvents
- agent_events
- agentEvents
```

### Subscription Names
```
{service}-{topic}-{purpose}

✅ Good:
- analysis-agent-events-processor
- notification-run-events-emailer

❌ Bad:
- processor
- analysisSub
- agent_events_subscription
```

---

## Environment Variables

```
SCREAMING_SNAKE_CASE

✅ Good:
- DATABASE_URL
- MAX_CRAWL_DURATION_MS
- APPIUM_SERVER_URL

❌ Bad:
- databaseUrl
- max-crawl-duration-ms
- appiumServerUrl
```

---

## React Components

### Component Files
```
PascalCase.tsx

✅ Good:
- AgentDashboard.tsx
- RunList.tsx
- ScreenshotViewer.tsx

❌ Bad:
- agentDashboard.tsx
- crawl-session-list.tsx
- screenshot_viewer.tsx
```

### Component Names
```
PascalCase (matches file name)

✅ Good:
export function AgentDashboard() { }

❌ Bad:
export function agentDashboard() { }
export default function Dashboard() { } // No default exports
```

### Hook Files
```
use-{name}.ts

✅ Good:
- use-agent-status.ts
- use-run.ts

❌ Bad:
- useAgentStatus.ts
- agentStatusHook.ts
```

### Hook Names
```
use{Name} (camelCase)

✅ Good:
export function useAgentStatus() { }
export function useRun() { }

❌ Bad:
export function UseAgentStatus() { }
export function agent_status_hook() { }
```

---

## Domain Language (From Glossary)

Use these exact terms consistently across code:

- **Agent**: AI-powered system (not bot, spider, worker, crawler)
- **Run**: Single execution (not job, task, crawl, session)
- **Screenshot**: UI capture (not image, picture, snap)
- **Screen**: Unique UI state (not page, view, activity)
- **Node**: Graph vertex representing a screen (not vertex, state, page-node)
- **Edge**: Transition between screens (not link, connection, transition)
- **Analysis**: ML-powered insight generation (not report, analytics, insights)

**See**: `facts/glossary.md` for complete domain dictionary.

---

## Violation Handling

- **First time**: Warning + link to this doc
- **Repeat**: PR blocked until fixed
- **Automated**: ESLint rules enforce many conventions

---

**Remember**: Naming is hard, but consistency makes code scannable. When in doubt, check existing code or ask.
