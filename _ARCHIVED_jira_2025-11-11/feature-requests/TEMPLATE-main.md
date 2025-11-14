# FR-XXX: [Short Title]

> **Line Limit:** 150 lines max (enforced)
> **Purpose:** Core feature documentation and implementation details

---

## Summary
[Brief description: what is being built, why it's needed, expected impact]

---

## Metadata (Optional)
- **Status**: [Todo | In Progress | Done]
- **Priority**: [P0 | P1 | P2 | P3]
- **Milestone**: [Milestone name or number]
- **Owner**: [Team or person]
- **Estimated Effort**: [S | M | L | XL]

---

## User Story
**As a** [user type]
**I want** [capability]
**So that** [benefit]

---

## Acceptance Criteria
- [ ] Criterion 1  
  _Optional:_ Group criteria by phases (Phase 1, Phase 2, etc.) when rollout is staged.
- [ ] Criterion 2
- [ ] Criterion 3

---

## Technical Approach
[Architecture, design decisions, key technologies. Highlight key insights or trade-offs discovered during analysis.]

---

## Implementation Details

### Backend Changes
- [API endpoints added/modified]
- [Database migrations]
- [Services/modules created]

### Frontend Changes
- [Routes/pages added]
- [Components created]
- [State management]

---

## API Contract (if applicable)
```typescript
// Request
interface RequestDTO {}

// Response
interface ResponseDTO {}
```

---

## Database Schema (if applicable)
```sql
-- Tables created/modified
```

---

## Testing Strategy
- **Unit Tests**: [What to test]
- **Integration Tests**: [What to test]
- **E2E Tests**: [What to test]
- **Manual Testing**: [How to verify]

---

## Dependencies
- **Blocked by**: [FR-XXX, BUG-XXX if applicable]
- **Blocks**: [FR-XXX if applicable]
- **Related**: [FR-XXX, TD-XXX if applicable]

---

## Owner / Priority
- **Requested by**: [Name or "Founder"]
- **Assigned to**: [Team or person]
- **Priority**: [P0 | P1 | P2 | P3]
- **Target Release**: [Version or date]

---

## Notes
- **Context**: [Additional background, links, design references]
- **Risks / Mitigations**: [Potential pitfalls and safeguards]
- **Related Requests**: [Connect to FR/BUG/TD items]

---

## Success Metrics (Optional)
- [Metric 1: Definition + target]
- [Metric 2: Definition + target]

---

## Future Enhancements (Optional)
- [Follow-up idea 1]
- [Follow-up idea 2]

---

## Release Plan (PROC-001)
- Follow PROC-001 “Production Release” in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@run-default-test` (or relevant command) passes
  - [ ] [Add additional precondition]
- Handoff:
  - After merge to main, run `@update-handoff` and choose the appropriate workflow
- Notes:
  - [Release tagging guidance, versioning, rollout cautions]

---

## Worktree Setup Quicklinks
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Tests: `@run-default-test`
- Isolation Check: `@verify-worktree-isolation`

