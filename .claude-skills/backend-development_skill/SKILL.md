---
name: backend-development
description: Integration-first development patterns for Encore.ts backend services. Focuses on importing subscriptions, polling async flows, verifying database state, and keeping diagnostic tooling close at hand.
---

# Backend Development Skill

## Mission
Ship reliable Encore.ts services by exercising the full flow—API call, worker execution, projector persistence, and database validation—inside every test cycle. This skill outlines the core loop and points to detailed playbooks in `references/`.

## When to Use
- Creating or updating Encore.ts services or subscriptions
- Writing integration tests that cover PubSub + database interactions
- Diagnosing flaky backend tests before handing off to QA or FE
- Preparing backend changes for CI, smoke tests, or release gates

## Development Loop
1. **Plan the flow** – Identify required subscriptions, services, and database tables; note expectations in Graphiti.
2. **Import dependencies** – Bring subscriptions/services into the test runtime to mirror production wiring.
3. **Execute via Encore client** – Call the service using generated types, not manual fetches.
4. **Poll for completion** – Use polling helpers (no fixed sleeps) until the worker finishes or times out.
5. **Assert database + logs** – Verify rows, outcomes, and structured log fields against expectations.
6. **Clean up + document** – Remove test data, note findings in Graphiti, and link any new scripts or helpers.

## Quick Command Set
```bash
cd backend && encore dev          # Local dev server
cd backend && encore test         # Full test suite
cd backend && encore test path/to.test.ts  # Focused integration test
cd .cursor && task backend:test   # Automation layer entry point
cd .cursor && task backend:logs   # Stream structured logs
```

## Quality Gates
- Subscriptions imported for every PubSub interaction
- Services and repositories typed end-to-end (no `any` or untyped SQL results)
- Polling loops with bounded timeouts instead of `setTimeout`
- Database cleaned after each integration test run
- Structured logging uses `encore.dev/log` with `module`, `actor`, and identifiers

## Reference Library
- `references/integration_test_patterns.md` – Step-by-step pattern for polling, cleanup, and database verification
- `references/api_testing_examples.md` – Example tests covering multi-service flows and assertions
- `references/encore_mcp_testing_patterns.md` – How to combine Encore MCP with tests for live introspection
- `WEBDRIVER_SESSION_ERRORS.md` – Known Appium/WebDriver error catalog used during agent-driven tests

## Related Skills
- `backend-debugging_skill` – Deep-dive diagnostics when runs stall or regressions persist
- `e2e-testing_skill` – Playwright automation that consumes backend APIs end-to-end
- `graphiti-mcp-usage_skill` – Document backend architecture and test discoveries in Graphiti
