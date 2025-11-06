---
name: cursor-browser-tool-mastery
description: Complete guide to Cursor's built-in @Browser tool for inspecting, debugging, and interacting with web applications. Covers navigation, element inspection, console debugging, network monitoring, form interactions, screenshots, and systematic testing workflows. Essential for frontend debugging, UI testing, and visual verification.
---

# Cursor @Browser Tool - Complete Guide

The Cursor @Browser tool provides full browser automation and inspection capabilities directly from the AI assistant. This is your primary tool for frontend debugging and testing.

## Core Capabilities Overview

### 1. Navigation & Page Inspection
- Load any URL and capture page state
- Get accessibility tree snapshot
- Navigate forward/backward
- Wait for conditions
- Resize viewport for responsive testing

### 2. Element Interaction
- Click buttons, links, any element
- Type into inputs, textareas
- Hover for dropdown/tooltip testing
- Select dropdown options
- Submit forms

### 3. Debugging & Monitoring
- Capture console logs (info, warn, error)
- Monitor network requests/responses
- Check WebSocket connections
- Track API calls and status codes
- Inspect request/response headers

### 4. Visual Verification
- Take full page screenshots
- Capture specific element screenshots
- Compare visual states
- Test responsive layouts

## Tool Reference

### browser_navigate
**Purpose:** Load a URL and get initial page state

```typescript
browser_navigate(url: string)
// Returns: Page snapshot with accessibility tree
```

**Example:**
```typescript
browser_navigate("http://localhost:5173/run/01XXXXX")
```

**Use Cases:**
- Start any debugging session
- Navigate to specific page/route
- Reload page to reset state
- Test different URLs

### browser_snapshot
**Purpose:** Get current page accessibility tree without navigation

```typescript
browser_snapshot()
// Returns: Current page elements with refs
```

**Use Cases:**
- Check page updates after interaction
- Verify elements appeared/disappeared
- Get current state without reload
- Find element refs for interaction

### browser_click
**Purpose:** Click any element on the page

```typescript
browser_click(
  element: string,      // Human-readable description
  ref: string,          // Exact ref from snapshot
  button?: "left" | "right" | "middle",
  doubleClick?: boolean,
  modifiers?: string[]  // ["Shift", "Control", "Alt", "Meta"]
)
```

**Example:**
```typescript
browser_click(
  element: "Cancel Run button",
  ref: "ref-lgvw97wdljn"
)
```

**Use Cases:**
- Trigger button actions
- Follow links
- Open dropdowns
- Test click handlers

### browser_type
**Purpose:** Type text into input fields

```typescript
browser_type(
  element: string,
  ref: string,
  text: string,
  slowly?: boolean,     // One character at a time
  submit?: boolean      // Press Enter after typing
)
```

**Example:**
```typescript
browser_type(
  element: "Search input",
  ref: "ref-abc123",
  text: "test query",
  submit: true
)
```

**Use Cases:**
- Fill form fields
- Test search functionality
- Input validation testing
- Trigger input event handlers

### browser_hover
**Purpose:** Hover over elements to trigger hover states

```typescript
browser_hover(
  element: string,
  ref: string
)
```

**Example:**
```typescript
browser_hover(
  element: "Primary button",
  ref: "ref-btn123"
)
```

**Use Cases:**
- Test hover effects
- Trigger tooltips
- Open hover menus
- Verify CSS transitions

### browser_select_option
**Purpose:** Select option from dropdown

```typescript
browser_select_option(
  element: string,
  ref: string,
  values: string[]      // Can select multiple
)
```

**Example:**
```typescript
browser_select_option(
  element: "Status dropdown",
  ref: "ref-select123",
  values: ["active"]
)
```

**Use Cases:**
- Fill select fields
- Test dropdown behavior
- Multi-select testing

### browser_press_key
**Purpose:** Press keyboard keys

```typescript
browser_press_key(
  key: string  // "Enter", "Escape", "ArrowDown", "a", etc.
)
```

**Example:**
```typescript
browser_press_key(key: "Escape")
browser_press_key(key: "Enter")
browser_press_key(key: "ArrowDown")
```

**Use Cases:**
- Submit forms
- Close modals
- Navigate dropdowns
- Keyboard shortcuts

### browser_wait_for
**Purpose:** Wait for conditions or time

```typescript
browser_wait_for(
  text?: string,      // Wait for text to appear
  textGone?: string,  // Wait for text to disappear
  time?: number       // Wait N seconds
)
```

**Example:**
```typescript
// Wait for loading to disappear
browser_wait_for(textGone: "Loading...")

// Wait for success message
browser_wait_for(text: "Run completed")

// Wait 2 seconds
browser_wait_for(time: 2)
```

**Use Cases:**
- Wait for async operations
- Debounce rapid checks
- Wait for animations
- Wait for API responses

### browser_navigate_back
**Purpose:** Go back to previous page

```typescript
browser_navigate_back()
```

**Use Cases:**
- Test navigation flow
- Return to previous state
- Test browser history

### browser_resize
**Purpose:** Change browser viewport size

```typescript
browser_resize(
  width: number,
  height: number
)
```

**Example:**
```typescript
// Mobile viewport
browser_resize(width: 375, height: 667)

// Desktop viewport
browser_resize(width: 1920, height: 1080)
```

**Use Cases:**
- Test responsive design
- Mobile testing
- Tablet testing
- Different screen sizes

### browser_console_messages
**Purpose:** Get all console logs, warnings, errors

```typescript
browser_console_messages()
// Returns: Array of messages with timestamps
```

**Example Response:**
```json
{
  "messages": [
    {
      "type": "log",
      "message": "[Graph Stream] Connected",
      "timestamp": 1762389831931
    },
    {
      "type": "error",
      "message": "WebSocket closed",
      "timestamp": 1762389831940
    }
  ]
}
```

**Use Cases:**
- Check for errors
- Verify logging
- Debug console output
- Track execution flow

### browser_network_requests
**Purpose:** Get all network requests since page load

```typescript
browser_network_requests()
// Returns: Array of HTTP/WebSocket requests
```

**Example Response:**
```json
{
  "requests": [
    {
      "url": "http://localhost:4000/health",
      "method": "GET",
      "statusCode": 200,
      "resourceType": "xhr"
    },
    {
      "url": "ws://localhost:4000/graph/run/01XXX/stream",
      "method": "GET",
      "statusCode": 101,
      "resourceType": "webSocket"
    }
  ]
}
```

**Use Cases:**
- Verify API calls
- Check WebSocket connections
- Debug failed requests
- Monitor network traffic
- Verify status codes

### browser_take_screenshot
**Purpose:** Capture visual state

```typescript
browser_take_screenshot(
  filename?: string,           // Save location
  fullPage?: boolean,          // Scroll and capture all
  type?: "png" | "jpeg",
  element?: string,            // Description for specific element
  ref?: string                 // Element ref for partial capture
)
```

**Example:**
```typescript
// Full page
browser_take_screenshot(
  filename: "run-page.png",
  fullPage: true
)

// Specific element
browser_take_screenshot(
  filename: "graph-viz.png",
  element: "Graph visualization",
  ref: "ref-graph123"
)
```

**Use Cases:**
- Visual regression testing
- Documentation
- Bug reports
- Design verification

## Systematic Testing Workflow

### Phase 1: Navigate & Inspect
```typescript
// 1. Load page
browser_navigate("http://localhost:5173/run/01XXXXX")

// 2. Wait for load
browser_wait_for(time: 2)

// 3. Get current state
browser_snapshot()

// 4. Check console for errors
browser_console_messages()

// 5. Check network requests
browser_network_requests()
```

### Phase 2: Interact & Verify
```typescript
// 1. Find element from snapshot
// Look for ref in snapshot output

// 2. Interact
browser_click(
  element: "Start button",
  ref: "ref-xyz123"
)

// 3. Wait for response
browser_wait_for(text: "Processing")

// 4. Verify state changed
browser_snapshot()

// 5. Check console/network
browser_console_messages()
browser_network_requests()
```

### Phase 3: Debug Issues
```typescript
// 1. Check console for errors
const console = browser_console_messages()
// Look for error/warning types

// 2. Check network failures
const network = browser_network_requests()
// Look for non-2xx status codes

// 3. Verify WebSocket connections
// Look for resourceType: "webSocket"
// Check statusCode (101 = success)
// No status code = backend didn't upgrade; likely endpoint not active

// 4. Take screenshot for visual inspection
browser_take_screenshot(
  filename: "debug-state.png",
  fullPage: true
)
```

## Real-World Examples

### Example 1: Debug Graph Stream Connection

**Goal:** Find why graph stream isn't receiving events

```typescript
// Step 1: Navigate to run page
browser_navigate("http://localhost:5173/run/01K9B8GS9REXWS4HPHM7N5XG0K")

// Step 2: Wait for page load
browser_wait_for(time: 2)

// Step 3: Check console for connection logs
browser_console_messages()
// Look for: "[Graph Stream] Connected"
// Look for: errors or warnings

// Step 4: Check network for WebSocket
browser_network_requests()
// Find: ws://localhost:4000/graph/run/*/stream
// Check: statusCode (101 = success, no code = failed)

// Step 5: Take screenshot of current state
browser_take_screenshot(
  filename: "graph-not-loading.png"
)
```

**Analysis:**
- Console shows: "[Graph Stream] Connection established"
- Network shows: WebSocket request with NO status code
- Conclusion: Connection attempt made but failed to upgrade

### Example 2: Test Form Submission

**Goal:** Verify run creation flow

```typescript
// Step 1: Navigate to home
browser_navigate("http://localhost:5173")

// Step 2: Get page elements
browser_snapshot()

// Step 3: Click "Detect Drift" button
browser_click(
  element: "Detect My First Drift button",
  ref: "ref-lu4fcsncfbd"
)

// Step 4: Wait for navigation
browser_wait_for(time: 1)

// Step 5: Verify on run page
browser_snapshot()
// Should show run ID in URL and page content

// Step 6: Check network for POST /run
browser_network_requests()
// Find: POST http://localhost:4000/run
// Check: statusCode 200
```

### Example 3: Test Responsive Design

**Goal:** Verify mobile layout

```typescript
// Step 1: Set mobile viewport
browser_resize(width: 375, height: 667)

// Step 2: Navigate
browser_navigate("http://localhost:5173")

// Step 3: Screenshot
browser_take_screenshot(
  filename: "mobile-layout.png",
  fullPage: true
)

// Step 4: Set desktop viewport
browser_resize(width: 1920, height: 1080)

// Step 5: Screenshot
browser_take_screenshot(
  filename: "desktop-layout.png",
  fullPage: true
)

// Step 6: Compare visually
// Check grid columns, button sizes, text scaling
```

### Example 4: Debug WebSocket Stream

**Goal:** Track exact WebSocket lifecycle

```typescript
// Step 1: Navigate and capture baseline
browser_navigate("http://localhost:5173/run/01XXXXX")
const baseline = browser_console_messages()

// Step 2: Wait for connection attempt
browser_wait_for(time: 3)

// Step 3: Get all console messages
const afterWait = browser_console_messages()
// Look for connection lifecycle:
// - "Creating stream"
// - "Stream created, socket state: 0"
// - "WebSocket opened" (if successful)
// - "WebSocket closed" (if failed)

// Step 4: Check network for WebSocket
const network = browser_network_requests()
// Find WebSocket requests
const wsRequests = network.requests.filter(
  r => r.resourceType === "webSocket"
)
// Check statusCode for each

// Step 5: Identify failure point
// If state stays 0: Connection never opened
// If state 0→3: Closed before opening
// If error logged: Check error message
```

## Best Practices

### 1. Always Start with Navigation + Snapshot
```typescript
browser_navigate(url)
browser_snapshot()  // Get element refs
```

### 2. Wait After Interactions
```typescript
browser_click(element, ref)
browser_wait_for(time: 1)  // Let UI update
browser_snapshot()  // Verify change
```

### 3. Check Console + Network Together
```typescript
const console = browser_console_messages()
const network = browser_network_requests()
// Cross-reference errors with failed requests
```

### 4. Use Descriptive Element Names
```typescript
// ✅ Good
browser_click(
  element: "Cancel Run button in header",
  ref: "ref-xxx"
)

// ❌ Bad
browser_click(element: "button", ref: "ref-xxx")
```

### 5. Take Screenshots at Key Points
```typescript
// Before interaction
browser_take_screenshot(filename: "before.png")

// Interact
browser_click(element, ref)

// After interaction
browser_take_screenshot(filename: "after.png")
```

### 6. Filter Console Messages
```typescript
const messages = browser_console_messages()

// Find errors
const errors = messages.messages.filter(m => m.type === "error")

// Find specific prefix
const graphLogs = messages.messages.filter(
  m => m.message.includes("[Graph Stream]")
)
```

### 7. Track WebSocket Status
```typescript
const network = browser_network_requests()

const wsConnections = network.requests.filter(
  r => r.resourceType === "webSocket"
)

// 101 = Successful upgrade
// No statusCode = Connection failed
// 400/404 = Endpoint issue
```

## Common Debugging Patterns

### Pattern: "Component Not Updating"
1. Navigate to page
2. Snapshot to verify component exists
3. Take screenshot of initial state
4. Trigger update action
5. Wait for update
6. Snapshot to verify change
7. Check console for state update logs

### Pattern: "API Call Failing"
1. Navigate to page
2. Clear baseline (refresh page)
3. Trigger action that makes API call
4. Wait for response
5. Check network for request
6. Check status code
7. Check console for error handling

### Pattern: "WebSocket Not Connecting"
1. Navigate to page
2. Wait for connection attempt
3. Check console for connection logs
4. Check network for WebSocket request
5. Verify status code (101 = success)
6. Check console for open/close/error events
7. Compare with working WebSocket

### Pattern: "UI Not Matching Design"
1. Navigate to page
2. Resize to target viewport
3. Take full page screenshot
4. Hover over interactive elements
5. Take hover state screenshot
6. Click elements
7. Take active state screenshot
8. Compare with design

## Integration with Debugging Skills

### Frontend Debugging Flow
1. **Phase 1**: Use browser_navigate + browser_snapshot
2. **Phase 2**: Add console logs in code
3. **Phase 3**: Use browser_console_messages to verify logs
4. **Phase 4**: Use browser_network_requests to verify requests
5. **Phase 5**: Use browser_take_screenshot for visual issues

### When to Use Each Tool

**Use browser_navigate when:**
- Starting debugging session
- Testing routing
- Resetting page state

**Use browser_snapshot when:**
- Need element refs for interaction
- Verifying page structure
- Checking if elements exist

**Use browser_console_messages when:**
- Checking for errors
- Verifying log statements
- Tracking execution flow
- Debugging WebSocket events

**Use browser_network_requests when:**
- Verifying API calls made
- Checking status codes
- Debugging failed requests
- Verifying WebSocket upgrades

**Use browser_take_screenshot when:**
- Visual verification needed
- Creating bug reports
- Comparing states
- Documenting issues

## Limitations & Workarounds

### Limitation 1: No Direct Variable Access
**Can't:** Access JavaScript variables directly
**Workaround:** Add console.log() in code, use browser_console_messages()

### Limitation 2: No Custom JavaScript Execution
**Can't:** Run arbitrary JS in console
**Workaround:** Add debug endpoints or expose via window in dev mode

### Limitation 3: Screenshot Timing
**Can't:** Screenshot mid-animation
**Workaround:** Use browser_wait_for() to wait for animation complete

### Limitation 4: Network Details
**Can't:** See request/response bodies
**Workaround:** Add logging in API functions, check Encore traces

## Quick Reference

```typescript
// Navigation
browser_navigate(url)
browser_navigate_back()
browser_resize(width, height)

// Inspection
browser_snapshot()
browser_console_messages()
browser_network_requests()

// Interaction
browser_click(element, ref)
browser_type(element, ref, text)
browser_hover(element, ref)
browser_select_option(element, ref, values)
browser_press_key(key)

// Timing
browser_wait_for(text?, textGone?, time?)

// Visual
browser_take_screenshot(filename?, fullPage?, type?, element?, ref?)
```

## Resources

- Cursor Browser Documentation: https://cursor.com/docs/agent/browser
- Frontend Debugging Skill: `frontend/.claude-skills/frontend-debugging/SKILL.md`
- Backend Debugging Skill: `backend/.claude-skills/backend-debugging/SKILL.md`

