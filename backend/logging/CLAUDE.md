# Logging Subsystem Context

## Overview
Unified structured logging across all backend components with module/actor organization for Encore dashboard filtering.

## Core Files
- **`logger.ts`**: LogContext interface, loggerWith helper, MODULES/ACTORS constants
- **`HANDOFF.md`**: Complete implementation summary and Graphiti episode IDs
- **`session_summary.md`**: Session notes when Graphiti unavailable

## Logger API

### `loggerWith(module, actor, context)`
Creates a contextual logger with fixed module/actor fields.

```typescript
import { loggerWith, MODULES, AGENT_ACTORS } from "../logging/logger";

const logger = loggerWith(MODULES.AGENT, AGENT_ACTORS.WORKER, {
  runId: state.runId,
  workerId: options.workerId,
});

logger.info("Worker starting", { budgets });
logger.error("Worker failed", { err: error.message, stopReason: "crash" });
```

### LogContext Interface
```typescript
interface LogContext {
  module: string;        // High-level subsystem
  actor: string;         // Specific component
  runId?: string;        // Run identifier
  workerId?: string;     // Worker identifier
  nodeName?: string;     // Current node
  stepOrdinal?: number;  // Step sequence
  eventSeq?: number;     // Event sequence
  [key: string]: unknown; // Additional context
}
```

## Log Field Conventions

### Always Present
- `module`: High-level subsystem (`"run"`, `"agent"`, `"db"`, `"pubsub"`)
- `actor`: Specific component (`"orchestrator"`, `"worker"`, `"subscription"`, `"start"`, `"stream"`)
- `runId`: Run identifier (when applicable)
- `ts`: ISO timestamp (automatic)
- `level`: Log level (INF/WARN/ERROR)

### When Available
- `workerId`: Worker process identifier
- `nodeName`: Current node being executed
- `stepOrdinal`: Step sequence number
- `eventSeq`: Event sequence number
- `retryAttempt`: Retry counter for current node
- `retryDelayMs`: Backoff delay before retry

### Error Logging
- `err.message`: Error message text
- `err.code`: Typed error code (if available)
- `stopReason`: Why run terminated (`"success"`, `"budget_exhausted"`, `"crash"`, `"no_progress"`, `"user_cancelled"`)

### Snapshot Logging
Full AgentState logged including:
- `runId`, `stepOrdinal`, `status`, `stopReason`
- `counters`: stepsTotal, screensNew, noProgressCycles, outsideAppSteps, restartsUsed, errors
- `budgets`: maxSteps, maxTimeMs, maxTaps, outsideAppLimit, restartLimit
- `timestamps`: createdAt, updatedAt
- `randomSeed`: For deterministic replay

## Module/Actor Constants

### MODULES
- `RUN`: API endpoints, run lifecycle
- `AGENT`: Agent orchestration, nodes
- `DB`: Database operations
- `PUBSUB`: Pub/Sub topics and subscriptions

### AGENT_ACTORS
- `ORCHESTRATOR`: ID generation, event recording, snapshot persistence
- `WORKER`: Long-lived execution loop
- `SUBSCRIPTION`: Pub/Sub handler

### RUN_ACTORS
- `START`: POST /run endpoint
- `CANCEL`: POST /run/:id/cancel endpoint
- `STREAM`: GET /run/:id/stream endpoint
- `HEALTH`: GET /health endpoint

## Encore Dashboard Usage

### Search Patterns
```
module:"agent" AND actor:"worker" AND runId:<ID>
module:"run" AND actor:"start" AND runId:<ID>
actor:"orchestrator" AND runId:<ID>
"Snapshot saved" AND runId:<ID>
level:ERROR AND runId:<ID>
```

### Filtering Examples
- **Worker execution**: `module:"agent" AND actor:"worker"`
- **API requests**: `module:"run" AND actor:"start"`
- **Orchestration**: `actor:"orchestrator"`
- **Errors only**: `level:ERROR`
- **Specific run**: `runId:"01JC8XYZ..."`

## Implementation Guidelines

### Component Instrumentation
1. Import logger helper and constants at top
2. Create contextual logger at component entry
3. Log lifecycle events (start/complete/error)
4. Log state transitions with full context
5. Log errors with stopReason

### Example Pattern
```typescript
import { loggerWith, MODULES, AGENT_ACTORS } from "../logging/logger";

export class AgentWorker {
  async run(): Promise<AgentWorkerResult> {
    const logger = loggerWith(MODULES.AGENT, AGENT_ACTORS.WORKER, {
      runId: this.options.run.runId,
      workerId: this.options.workerId,
    });

    logger.info("Worker starting", { budgets: this.options.budgets });

    try {
      const outcome = await this.executeAgentLoop(state);
      logger.info("Worker completed", { status: outcome.status });
      return outcome;
    } catch (err) {
      logger.error("Worker failed", { 
        err: err instanceof Error ? err.message : String(err),
        stopReason: "crash"
      });
      throw err;
    }
  }
}
```

## Maintenance
- Review log volume monthly
- Adjust log levels as needed
- Update constants when adding new modules/actors
- Ensure no PII in logs
- Monitor dashboard query performance

## Testing
- Verify logs appear in Encore dashboard
- Confirm module/actor filters work correctly
- Validate error scenarios produce actionable logs
- Check snapshot logs include full state

