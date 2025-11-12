# Regression Playbook (BUG-010 Case Study)

## Multi-Step RCA
1. **Visual comparison** – Capture current state (`browser_take_screenshot`) and compare with baseline artifacts (`.playwright-mcp/...`).
2. **Browser diagnostics** – Use Cursor Browser tool to inspect DOM, console, and network streams.
3. **Timeline forensics** – Run `backend/scripts/find-completed-runs.ts` and `inspect-run.ts` to compare healthy vs failing runs.
4. **Git analysis** – Narrow regression window with `git log --since/--until`, inspect candidate commits.
5. **Backend inspection** – Use `check-agent-state.ts`, `check-cursor-ordering.ts`, and projector tests to isolate backend causes.
6. **Root cause validation** – Re-run tests after applying fix; ensure events, projector outcomes, and UI align.
7. **Documentation** – Capture RCA in Graphiti (symptom, impact, root cause, fix, prevention).

## Evidence Checklist
- Full-page screenshots (baseline vs current)
- Browser console logs + network traces
- Backend logs (`task backend:logs`)
- Database state (runs, events, projector outcomes)
- Git diff or commit references
- Agent state snapshots

## Prevention Tasks
- Add integration tests covering the regression scenario (`frontend/tests/e2e/` or backend integration suite)
- Update relevant skills/refs (frontend-development, backend-development, e2e-testing) with new patterns
- Document environment requirements or setup changes in `.env` or handoff docs
