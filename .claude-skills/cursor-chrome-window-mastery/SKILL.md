---
name: cursor-chrome-window-mastery
description: Expert at using Cursor's Google Chrome mode (Playwright-controlled isolated window) for clean-state testing and verification. Specializes in ScreenGraph application testing including run lifecycle, WebSocket debugging, graph visualization, and systematic verification workflows. Respects port management for worktree isolation.
---

# Cursor Chrome Window Testing - ScreenGraph Specialist

Master skill for testing ScreenGraph frontend using Cursor's **Google Chrome mode** (Playwright-controlled isolated browser window). This mode launches a fresh Chrome instance with clean state, ideal for reproducible testing and verification.

## Core Capabilities

### Browser Control
- Launch isolated Chrome window (fresh state every time)
- Navigate to any URL with automatic port detection
- Capture accessibility tree for semantic element selection
- Take screenshots for visual verification
- Monitor console logs and network requests
- Control viewport size for responsive testing

### ScreenGraph-Specific Testing
- Verify run creation flow ("Detect My First Drift" button)
- Monitor WebSocket graph stream connections
- Count discovered screens and verify rendering
- Check timeline event rendering
- Verify agent state transitions
- Detect backend/frontend connectivity issues

### Architecture Review Validation Loop (2025-11-07)
- **Purpose:** Capture Chrome evidence that backs updates to `ARCHITECTURE_REVIEW.md`.
- **Steps:**
  1. Launch isolated Chrome, navigate to timeline + graph routes documented in the review.
  2. Record clean screenshots for each documented flow stage (start, orchestrate, stream, cancel).
  3. Capture console + network logs to prove SSE/WebSocket activity during the session.
  4. Store artifact filenames in the review’s references section for traceability.
  5. Re-run after backend/frontend changes to keep the architecture document grounded in current behavior.
- **Use when:** Refreshing architecture documentation or validating critiques/risks with real UI state.

## Port Management Integration

### Auto-Detection Strategy
Always detect ports using this priority order:

1. **Port Coordinator** (preferred for worktrees):
   ```bash
   source .env 2>/dev/null || true
   echo "backend: ${BACKEND_PORT:-4000}" "frontend: ${FRONTEND_PORT:-5173}"
   ```
   Parse JSON output for `ports.backend` and `ports.frontend`

2. **Environment Variables** (fallback):
   - Backend: `$VITE_BACKEND_BASE_URL` or `http://localhost:4000`
   - Frontend: `http://localhost:${FRONTEND_PORT:-5173}`

3. **Verify Reachability** (best-effort):
   ```bash
   curl -sf http://localhost:${FRONTEND_PORT} > /dev/null
   curl -sf http://localhost:${BACKEND_PORT}/health > /dev/null
   ```

### Worktree Awareness
- **Actual Behavior**: Port coordinator assigns hash-based offsets to ALL trees including main
- Main tree ("ScreenGraph") currently gets: backend=4007, frontend=5180, dashboard=9407
- Other worktrees get different offsets based on name hash
- **Note**: This differs from founder rules which specify main tree should use defaults (4000/5173)
- Always call port coordinator before launching tests to get actual assigned ports
- Report detected ports in test output

## Tool Reference

### browser_navigate
**Purpose**: Load a URL and capture initial page state

```typescript
browser_navigate(url: string)
// Returns: Accessibility tree snapshot
```

**ScreenGraph Usage**:
```typescript
// Detect ports first, then navigate
browser_navigate("http://localhost:5173")
browser_navigate("http://localhost:5173/run/01XXXXX")
```

### browser_snapshot
**Purpose**: Get current page structure without navigation

```typescript
browser_snapshot()
// Returns: Element refs and accessibility tree
```

**ScreenGraph Usage**:
```typescript
// After interaction, check if page updated
browser_snapshot()
// Look for: timeline events, graph nodes, run status
```

### browser_click
**Purpose**: Click any interactive element

```typescript
browser_click(
  element: string,      // Human-readable description
  ref: string           // Exact ref from snapshot
)
```

**ScreenGraph Usage**:
```typescript
// Start a run
browser_click(
  element: "Detect My First Drift button",
  ref: "ref-abc123"  // From snapshot
)

// Cancel a run
browser_click(
  element: "Cancel Run button",
  ref: "ref-xyz789"
)
```

### browser_wait_for
**Purpose**: Wait for conditions or time to pass

```typescript
browser_wait_for(
  text?: string,        // Wait for text to appear
  textGone?: string,    // Wait for text to disappear
  time?: number         // Wait N seconds
)
```

**ScreenGraph Usage**:
```typescript
// Wait for run to complete
browser_wait_for(time: 30)

// Wait for specific event
browser_wait_for(text: "agent.run.finished")

// Wait for loading to disappear
browser_wait_for(textGone: "Loading...")
```

### browser_console_messages
**Purpose**: Get all console logs, warnings, errors

```typescript
browser_console_messages()
// Returns: Array of {type, message, timestamp}
```

**ScreenGraph Usage**:
```typescript
const messages = browser_console_messages()

// Find WebSocket lifecycle
const wsLogs = messages.messages.filter(
  m => m.message.includes("[Graph Stream]")
)

// Find errors
const errors = messages.messages.filter(
  m => m.type === "error"
)
```

**Key Logs to Look For**:
- `[Graph Stream] Connected` - WebSocket opened
- `[Graph Stream] WebSocket opened` - Connection successful
- `[Graph Stream] Received event` - Graph event received
- `[Graph Stream] WebSocket closed` - Connection closed
- `[vite] connected` - Vite HMR ready

### browser_network_requests
**Purpose**: Get all HTTP/WebSocket requests since page load

```typescript
browser_network_requests()
// Returns: Array of {url, method, statusCode, resourceType}
```

**ScreenGraph Usage**:
```typescript
const network = browser_network_requests()

// Find backend health check
const health = network.requests.find(
  r => r.url.includes("/health")
)

// Find run creation
const runPost = network.requests.find(
  r => r.method === "POST" && r.url.includes("/run")
)

// Check if WebSocket attempted (NOTE: upgrade not captured)
// Use browser_console_messages for WebSocket debugging
```

### browser_take_screenshot
**Purpose**: Capture visual state for verification

```typescript
browser_take_screenshot(
  filename?: string,
  fullPage?: boolean,
  type?: "png" | "jpeg"
)
```

**ScreenGraph Usage**:
```typescript
// Full page screenshot
browser_take_screenshot(
  filename: "run-timeline.png",
  fullPage: true
)

// Save to .cursor/test-artifacts/
browser_take_screenshot(
  filename: ".cursor/test-artifacts/graph-state.png",
  fullPage: false
)
```

## ScreenGraph Testing Workflows

### Workflow 1: Basic Run Lifecycle Test

**Goal**: Verify user can start a run and see results

```typescript
// Step 1: Detect ports
const ports = detectPorts()  // Returns {backend, frontend}

// Step 2: Navigate to landing page
browser_navigate(`http://localhost:${ports.frontend}`)
browser_wait_for(time: 2)  // Let page load

// Step 3: Snapshot to get button ref
const snapshot = browser_snapshot()
// Find: "Detect My First Drift" button ref

// Step 4: Click button
browser_click(
  element: "Detect My First Drift button",
  ref: "ref-from-snapshot"
)

// Step 5: Wait for navigation
browser_wait_for(time: 2)

// Step 6: Verify on run page
const runSnapshot = browser_snapshot()
// Check: URL is /run/{id}
// Check: Timeline heading visible

// Step 7: Wait for agent flow
browser_wait_for(time: 30)

// Step 8: Check for screenshots
const finalSnapshot = browser_snapshot()
// Count: img tags under "Discovered Screens"

// Step 9: Take screenshot
browser_take_screenshot(
  filename: ".cursor/test-artifacts/run-complete.png",
  fullPage: true
)

// Step 10: Report results
// - Run ID
// - Number of screenshots discovered
// - Any console errors
// - Network request status
```

### Workflow 2: WebSocket Stream Debugging

**Goal**: Verify graph stream connects and receives events

```typescript
// Step 1: Navigate to run page
browser_navigate(`http://localhost:5173/run/01XXXXX`)
browser_wait_for(time: 3)

// Step 2: Check console for WebSocket lifecycle
const console = browser_console_messages()

// Find key logs:
const connected = console.messages.find(
  m => m.message.includes("WebSocket opened")
)

const events = console.messages.filter(
  m => m.message.includes("Received event from stream")
)

const closed = console.messages.find(
  m => m.message.includes("WebSocket closed")
)

// Step 3: Analyze connection
if (!connected) {
  // Connection failed - check network
  const network = browser_network_requests()
  // Look for WebSocket request failures
}

if (events.length === 0) {
  // No events received - backend issue or run finished
}

// Step 4: Report findings
// - Connection established: yes/no
// - Events received: count
// - Connection closed cleanly: yes/no (code 1005)
```

### Workflow 3: Screenshot Count Test

**Goal**: Count screenshots displayed on run page

```typescript
// Step 1: Navigate to run page
browser_navigate(`http://localhost:5173/run/01XXXXX`)
browser_wait_for(time: 35)  // Wait for run completion

// Step 2: Snapshot page
const snapshot = browser_snapshot()

// Step 3: Parse snapshot for img elements
// Look for pattern:
// - Section: "Discovered Screens"
// - Child elements: img tags with src="/artifacts/*"

// Step 4: Count screenshots
const screenshotCount = countImagesInDiscoveredScreens(snapshot)

// Step 5: Verify graph nodes
// Look for pattern:
// - Section: "Screen Graph"
// - Child elements: graph-node-* divs

const graphNodeCount = countGraphNodes(snapshot)

// Step 6: Take visual proof
browser_take_screenshot(
  filename: `.cursor/test-artifacts/screenshots-${screenshotCount}.png`,
  fullPage: true
)

// Step 7: Report
// - Screenshots discovered: count
// - Graph nodes rendered: count
// - Run status: check heading for "Run Timeline: 01XXXXX"
```

### Workflow 4: Error Detection

**Goal**: Find and diagnose errors in the application

```typescript
// Step 1: Navigate
browser_navigate(`http://localhost:5173`)
browser_wait_for(time: 2)

// Step 2: Check for immediate errors
const console = browser_console_messages()
const errors = console.messages.filter(m => m.type === "error")

if (errors.length > 0) {
  // Report: Console errors found
  // - Error messages
  // - Timestamps
  // - Take screenshot
}

// Step 3: Trigger action
browser_click(element: "Detect My First Drift", ref: "...")
browser_wait_for(time: 2)

// Step 4: Check network failures
const network = browser_network_requests()
const failures = network.requests.filter(
  r => r.statusCode >= 400
)

if (failures.length > 0) {
  // Report: Network failures
  // - URLs
  // - Status codes
  // - Request types
}

// Step 5: Check for missing elements
const snapshot = browser_snapshot()
// Verify expected elements exist:
// - Timeline heading
// - Graph container
// - Event list

// Step 6: Take diagnostic screenshot
browser_take_screenshot(
  filename: ".cursor/test-artifacts/error-state.png",
  fullPage: true
)
```

## Best Practices for ScreenGraph

### 1. Always Detect Ports First
```bash
# Before any browser_navigate, run:
source .env 2>/dev/null || true
echo "backend: ${BACKEND_PORT:-4000}" "frontend: ${FRONTEND_PORT:-5173}"

# Parse output and use detected ports
```

### 2. Wait After Navigation
```typescript
browser_navigate(url)
browser_wait_for(time: 2)  // Let Svelte hydrate
browser_snapshot()         // Then interact
```

### 3. Use Console for WebSocket Debugging
```typescript
// WebSocket upgrade NOT captured in network requests
// Instead, use console logs:
const wsLogs = browser_console_messages().messages.filter(
  m => m.message.includes("[Graph Stream]")
)
```

### 4. Take Screenshots at Key Points
```typescript
// Before interaction
browser_take_screenshot(filename: "before.png")

// Interact
browser_click(element, ref)

// After interaction
browser_wait_for(time: 2)
browser_take_screenshot(filename: "after.png")
```

### 5. Count Elements from Snapshot, Not DOM
```typescript
// ✅ Good: Parse accessibility tree
const snapshot = browser_snapshot()
const images = snapshot.split("img").length - 1

// ❌ Bad: Don't try to execute JavaScript
// (Not supported by browser MCP)
```

### 6. Verify Clean State Benefits
```typescript
// Every test starts fresh:
// - No cookies from previous sessions
// - No localStorage pollution
// - No cached API responses
// - Reproducible behavior
```

## Common Issues & Solutions

### Issue 1: "Button not found"
**Symptom**: `browser_click` fails with "element not found"

**Solution**:
1. Take a snapshot first: `browser_snapshot()`
2. Look for exact element ref in output
3. Verify element is visible (not hidden by CSS)
4. Wait for page to load: `browser_wait_for(time: 2)`

### Issue 2: "WebSocket not connecting"
**Symptom**: Console shows "Connection failed" or state stays 0

**Solution**:
1. Check console logs: `browser_console_messages()`
2. Look for: "[Graph Stream] Connection established"
3. Verify backend is running: Check network for `/health` request
4. Check run exists: Navigate to `/run/{id}` directly

### Issue 3: "No screenshots found"
**Symptom**: Snapshot shows 0 images under "Discovered Screens"

**Solution**:
1. Check run completion: Look for "agent.run.finished" in console
2. Wait longer: Agent flow takes 25-35 seconds
3. Check Appium: Ensure device is connected
4. Check artifacts: Look for `/artifacts/*` requests in network

### Issue 4: "Port detection failed"
**Symptom**: Cannot reach `http://localhost:5173`

**Solution**:
1. Load `.env`: `source .env 2>/dev/null || true`
2. Check output for assigned ports
3. Verify services running:
   ```bash
   lsof -ti:4000  # Backend should return PID
   lsof -ti:5173  # Frontend should return PID
   ```
4. If main tree, ports should be 4000/5173
5. If worktree, use coordinator-assigned ports

## Testing Checklist

Before starting any test:
- [ ] Backend is running (`lsof -ti:4000` or worktree port)
- [ ] Frontend is running (`lsof -ti:5173` or worktree port)
- [ ] Ports detected via coordinator or environment
- [ ] Appium is running if testing agent flows

During test:
- [ ] Navigate to correct URL with detected ports
- [ ] Wait after navigation for page load
- [ ] Take snapshot before clicking
- [ ] Use exact refs from snapshot
- [ ] Wait after interactions
- [ ] Check console for errors
- [ ] Verify network requests succeeded

After test:
- [ ] Take screenshots for visual proof
- [ ] Report screenshot count
- [ ] Report any errors found
- [ ] Save artifacts to `.cursor/test-artifacts/`

## Integration with Commands

This skill is designed to work with the `test-default-run` command:

```bash
# Command will:
# 1. Detect ports
# 2. Invoke this skill
# 3. Run full test workflow
# 4. Report results with screenshot count
```

See: `.cursor/commands/test-default-run`

## Performance Expectations

| Task | Expected Time | Notes |
|------|---------------|-------|
| Browser launch | 2-3 seconds | Fresh window startup |
| Page navigation | 1-2 seconds | Includes Vite HMR connect |
| Button click | <1 second | Instant UI response |
| Run creation | 1-2 seconds | POST /run request |
| Agent flow | 25-35 seconds | Device + app + perceive |
| Full test | ~40 seconds | Start to screenshot count |

## Artifact Management

### Screenshot Storage
- Save to: `.cursor/test-artifacts/`
- Naming: `{test-name}-{timestamp}.png`
- Include: Full page screenshots at key states

### Test Reports
- Format: Markdown with screenshots
- Include: Pass/fail status, error logs, screenshots
- Save to: `.cursor/test-reports/`

## Advanced Patterns

### Pattern: Parallel Verification
```typescript
// Capture multiple data sources in parallel
const [snapshot, console, network] = await Promise.all([
  browser_snapshot(),
  browser_console_messages(),
  browser_network_requests()
])

// Cross-reference findings
const wsConnected = console.messages.some(
  m => m.message.includes("WebSocket opened")
)
const runCreated = network.requests.some(
  r => r.method === "POST" && r.url.includes("/run")
)
```

### Pattern: Visual Regression
```typescript
// Take baseline screenshot
browser_navigate(url)
browser_wait_for(time: 2)
browser_take_screenshot(filename: "baseline.png")

// Make change
browser_click(element, ref)

// Take comparison screenshot
browser_take_screenshot(filename: "after-change.png")

// Compare visually (manual or tooling)
```

### Pattern: Stateful Flow Testing
```typescript
// Even though browser is fresh, can test multi-step flows:

// Step 1: Start run
browser_click("Detect My First Drift", ref)

// Step 2: Wait for completion
browser_wait_for(time: 35)

// Step 3: Verify results
const snapshot = browser_snapshot()
// Check: Screenshots discovered

// Step 4: Click a node (if interactive)
browser_click("Graph node", nodeRef)

// Step 5: Verify detail panel
const detailSnapshot = browser_snapshot()
// Check: Detail panel visible
```

## Limitations

### What You CAN'T Do
1. **Execute JavaScript**: No `page.evaluate()` or custom scripts
2. **Access DOM directly**: Must use accessibility tree
3. **Modify cookies/localStorage**: Read-only via browser state
4. **See WebSocket frames**: Only connection lifecycle in console
5. **Multi-window testing**: One window at a time
6. **Persist state**: Each test starts fresh (by design)

### Workarounds
1. **Need JavaScript execution**: Add console.log to code, read via `browser_console_messages()`
2. **Need WebSocket frames**: Add logging to stream handler
3. **Need state persistence**: Not possible in Chrome mode (use Browser Tab mode instead)
4. **Need request/response bodies**: Add logging in API layer

## Resources

- Browser MCP tools: See `browser_*` commands
- Frontend debugging: `.claude-skills/frontend-debugging/`
- Ports defined in `.env` (backend 4000, frontend 5173)
- Worktree setup: `.cursor/worktree-init.sh`

## Summary

**Use Google Chrome mode when you need**:
- Clean state for reproducible tests
- Visual verification via screenshots
- Pre-commit verification
- Bug reproduction without state pollution

**Don't use Google Chrome mode for**:
- Fast iteration during development (use Browser Tab mode)
- Test file generation (use Playwright MCP standalone)
- State-dependent flows requiring auth

**Integration with ScreenGraph**:
- Respects port management (main tree vs worktrees)
- Knows key UI elements (timeline, graph, screenshots)
- Understands WebSocket debugging patterns
- Can count screenshots and report results
- Takes proof screenshots automatically

