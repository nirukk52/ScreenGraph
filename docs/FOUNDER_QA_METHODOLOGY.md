# Founder QA Methodology - Log-Based Verification

## Overview
**Primary QA Method**: Encore dashboard logs are the primary way to test/verify/QA all development work.

## Log Verification Checklist

### Core Components
- [ ] **API Endpoints** (`module:"run"`, `actor:"start"`)
  - Input validation logged
  - Database operations logged with success/failure
  - Response data logged
  - Error scenarios produce meaningful logs

- [ ] **Agent Worker** (`module:"agent"`, `actor:"worker"`)
  - Run start/resume logged with workerId and budgets
  - Cancellation checks logged
  - Budget exhaustion logged with stopReason
  - Snapshot saves logged with full AgentState

- [ ] **Orchestrator** (`module:"agent"`, `actor:"orchestrator"`)
  - Initialize/resume logged with sequence numbers
  - Event recording logged with eventSeq
  - Snapshot persistence logged with stepOrdinal
  - Run finalization logged with stopReason

- [ ] **Pub/Sub** (`module:"pubsub"`, `actor:"subscription"`)
  - Message receipt logged
  - Processing handoff logged
  - Error handling logged

### Log Field Requirements
- **Always Present**: `module`, `actor`, `runId`, `ts`, `level`
- **When Available**: `workerId`, `nodeName`, `stepOrdinal`, `eventSeq`, `retryAttempt`
- **Errors**: `err.message`, `err.code`, `stopReason`
- **Snapshots**: Full AgentState including `counters`, `budgets`, `timestamps`, `randomSeed`

### Dashboard Search Patterns
```
module:"agent" AND actor:"worker" AND runId:<ID>
module:"run" AND actor:"start" AND runId:<ID>
actor:"orchestrator" AND runId:<ID>
Snapshot saved AND runId:<ID>
level:ERROR AND runId:<ID>
```

## Development Requirements

### For All New Features
1. **Structured Logging**: Every component must emit logs with proper module/actor classification
2. **State Visibility**: All state changes must be logged with full context
3. **Error Handling**: Error paths must include meaningful error information
4. **Performance**: Critical operations must log timing/duration
5. **Database**: All DB operations must log success/failure with relevant IDs
6. **External APIs**: All external calls must log request/response status

### Verification Process
1. Deploy feature to Encore
2. Trigger test scenarios
3. Search logs using dashboard filters
4. Verify expected log patterns appear
5. Confirm error scenarios produce appropriate logs
6. Validate performance metrics are captured

## Success Criteria
- All user flows traceable through logs
- Error scenarios produce actionable log entries
- Performance bottlenecks identifiable via log timing
- State transitions fully visible
- External integrations logged with status

## Maintenance
- Review log patterns monthly
- Update search patterns as features evolve
- Ensure log volume remains manageable
- Monitor for log performance impact

---

**Note**: This methodology replaces traditional unit testing as the primary verification method for founder QA, providing real-time visibility into system behavior.
