---
name: frontend-debugging-sveltekit
description: A systematic procedure for investigating and debugging frontend issues in SvelteKit 2 + Svelte 5 applications with Encore client integration. Uses browser tools for live inspection, checks SSE/WebSocket connections, verifies client generation, traces reactive state updates, and provides console debugging patterns. Essential for troubleshooting streaming endpoints, component reactivity, API client issues, and build errors.
---

# Frontend Debugging for SvelteKit 2 + Svelte 5 Applications

This skill provides a systematic 10-phase approach to investigating and resolving frontend issues in SvelteKit applications, with emphasis on Encore API client integration, SSE/WebSocket streams, and Svelte 5 runes.

## When to Use This Skill

- Components not rendering or updating
- SSE/WebSocket streams not connecting or receiving events
- API calls failing or returning unexpected data
- Encore client generation issues or type mismatches
- Svelte 5 runes (`$state`, `$derived`, `$effect`) not working
- Build failures or TypeScript errors
- Routing issues or page not loading
- Reactive state not updating UI

## Phase 1: Environment Setup & Verification

**Goal:** Confirm the application is running and accessible.

```bash
# Start frontend dev server
cd frontend && bun run dev

# Verify frontend is accessible
curl http://localhost:5173

# Check if backend is running
curl http://localhost:4000/health

# Regenerate Encore client (after backend changes)
cd frontend && bun run gen
```

**Success Criteria:**
- ✅ Frontend dev server starts without errors
- ✅ Browser loads `http://localhost:5173`
- ✅ Backend health check succeeds
- ✅ Encore client generation completes
- ✅ No TypeScript errors in terminal

## Phase 2: Use Browser Tools (CRITICAL: Always Use First!)

**Before writing any diagnostic code**, use browser tools for live inspection.

### Browser Navigation & Inspection
```
mcp_cursor-ide-browser_browser_navigate(url="http://localhost:5173/run/01XXXXX")
```
Returns: Page snapshot with interactive elements

```
mcp_cursor-ide-browser_browser_snapshot()
```
Returns: Current page accessibility tree

### Console & Network Monitoring
```
mcp_cursor-ide-browser_browser_console_messages()
```
Returns: All console logs, warnings, errors with timestamps

```
mcp_cursor-ide-browser_browser_network_requests()
```
Returns: All HTTP/WebSocket requests with status codes

### Interactive Testing
```
mcp_cursor-ide-browser_browser_click(element="Button", ref="ref-xxx")
mcp_cursor-ide-browser_browser_type(element="Input", ref="ref-xxx", text="test")
```

**When Browser Tools Fail:**
- Error "page not found" → Dev server not running, restart with `bun run dev`
- Empty snapshot → Page failed to load, check console for errors
- Network requests empty → CORS issue or backend not accessible

## Phase 3: Console Debugging Patterns

Add strategic console logs to trace execution:

### API Call Debugging
```typescript
// frontend/src/lib/api.ts
export async function streamGraphEvents(
  runId: string,
  onEvent: (event: graph.GraphStreamEvent) => void,
) {
  const client = await getEncoreClient();
  
  console.log("[Graph Stream] Starting connection for runId:", runId);
  
  try {
    const stream = await client.graph.streamGraphForRun(runId, { 
      replay: true, 
      fromSeq: 0 
    });
    
    console.log("[Graph Stream] Stream created, socket state:", stream.socket.ws.readyState);
    // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
    
    stream.socket.on("open", () => {
      console.log("[Graph Stream] WebSocket opened");
    });
    
    stream.socket.on("close", (event) => {
      console.log("[Graph Stream] WebSocket closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
    });
    
    stream.socket.on("error", (error) => {
      console.error("[Graph Stream] Socket error:", error);
    });
    
    for await (const event of stream) {
      console.log("[Graph Stream] Received event:", event);
      onEvent(event);
    }
  } catch (error) {
    console.error("[Graph Stream] Failed to create stream:", error);
    throw error;
  }
}
```

### Component State Debugging
```typescript
// In Svelte component
let graphNodes = $state([]);

$effect(() => {
  console.log("[Component] graphNodes updated:", {
    count: graphNodes.length,
    nodes: graphNodes.map(n => n.screenId)
  });
});
```

### Conditional Breakpoints
```typescript
$effect(() => {
  if (graphNodes.length > 0) {
    debugger; // Pause execution when nodes are added
  }
});
```

## Phase 4: Verify Encore Client Generation

**Check client is up-to-date with backend:**

```bash
# Regenerate client
cd frontend && bun run gen

# Check for graph service in generated client
grep -n "export namespace graph" frontend/src/lib/encore-client.ts

# Verify endpoint exists
grep -n "streamGraphForRun" frontend/src/lib/encore-client.ts
```

**Common Issues:**
- Client outdated → Run `bun run gen`
- Endpoint missing → Backend endpoint not exported or `expose: true` not set
- Type mismatch → Backend DTO changed, regenerate client

### Verify Client Configuration
```typescript
// frontend/src/lib/getEncoreClient.ts
const LOCAL_PORTS = [4000, 4002, 4001, 4003];

// Check which port is detected
async function findLocalEndpoint(): Promise<string> {
  for (const port of LOCAL_PORTS) {
    const url = `http://localhost:${port}`;
    if (await testUrl(url)) {
      console.log(`Found Encore backend at ${url}`);
      return url;
    }
  }
}
```

## Phase 5: WebSocket/SSE Stream Debugging

### Check WebSocket Connection State

**WebSocket Ready States:**
- `0` = CONNECTING
- `1` = OPEN
- `2` = CLOSING
- `3` = CLOSED

**Debugging Pattern:**
```typescript
const stream = await client.graph.streamGraphForRun(runId, params);

// Log initial state
console.log("Initial state:", stream.socket.ws.readyState);

// Wait for connection
await new Promise((resolve) => {
  if (stream.socket.ws.readyState === 1) {
    resolve(null);
  } else {
    stream.socket.on("open", resolve);
  }
});

console.log("Connected, state:", stream.socket.ws.readyState);
```

### Check Network Tab
Browser DevTools → Network → WS (WebSocket filter)

**Look for:**
- ✅ Status 101 (Switching Protocols) = Success
- ❌ Status 400/404 = Endpoint not found
- ❌ No status = Connection failed immediately
- ❌ Status 403 = Auth required

### Common WebSocket Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Connection closes immediately | Backend throws error on connect | Check backend logs |
| Status 101 but no messages | Backend not sending events | Verify backend query returns data |
| Connection never opens (state 0) | Wrong URL or CORS | Check backend endpoint path |
| Error event fires | Network issue or backend crash | Check backend logs, network |

## Phase 6: Svelte 5 Runes Debugging

### $state Not Updating
```typescript
// ❌ Wrong: Mutating state directly
graphNodes.push(newNode); // Won't trigger reactivity

// ✅ Correct: Creating new array
graphNodes = [...graphNodes, newNode];
```

### $derived Not Computing
```typescript
// Check if dependency is reactive
let nodes = $state([]);
let count = $derived(nodes.length); // ✅ Reactive

let plainArray = []; // ❌ Not reactive
let count2 = $derived(plainArray.length); // Won't update
```

### $effect Not Running
```typescript
// Check if dependencies are actually used
$effect(() => {
  console.log("Effect running");
  // ❌ If you don't reference reactive state, effect won't re-run
});

$effect(() => {
  console.log("Nodes changed:", nodes.length); // ✅ References reactive state
});
```

### $bindable Props Not Working
```typescript
// Parent
<Component bind:value={myState} />

// Child - MUST use single $props() call
let { value = $bindable(0) } = $props(); // ✅ Correct

// ❌ Wrong: Multiple $props() calls
let { value } = $props();
let { other } = $props(); // Error: Cannot use $props() more than once
```

## Phase 7: Component Reactivity Verification

### Check Component Re-renders
```typescript
<script>
let renderCount = $state(0);

$effect(() => {
  renderCount++;
  console.log("Component rendered:", renderCount);
});
</script>

<div>Render count: {renderCount}</div>
```

### Verify Prop Changes
```typescript
let { nodes = $bindable([]) } = $props();

$effect(() => {
  console.log("Props changed - nodes:", {
    count: nodes.length,
    ids: nodes.map(n => n.id)
  });
});
```

### Check Conditional Rendering
```typescript
{#if nodes.length === 0}
  <div>No nodes - Check if array is truly empty: {JSON.stringify(nodes)}</div>
{:else}
  <div>Found {nodes.length} nodes</div>
{/if}
```

## Phase 8: Build & Type Checking

### Check for Build Errors
```bash
cd frontend && bun run build
```

**Common Errors:**
- **`Cannot use $props() more than once`** → Combine into single destructure
- **`Unexpected token`** → Check for invalid Svelte syntax
- **`Type not found`** → Run `bun run gen` to regenerate client
- **`Module not found`** → Check import paths, run `bun install`

### Type Checking
```bash
# Check TypeScript errors
cd frontend && bunx tsc --noEmit
```

### Verify Imports
```typescript
// ✅ Correct - Use Encore types
import type { graph } from "$lib/encore-client";

// ❌ Wrong - Duplicate imports
import type { graph } from "./encore-client";
import type { graph } from "$lib/encore-client"; // Conflict!
```

## Phase 9: Root Cause Classification

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| **"Cannot use $props() more than once"** | Multiple $props() calls in component | Combine into single destructure |
| **WebSocket closes immediately** | Backend endpoint throws error | Check backend logs with module/actor filters |
| **State updates but UI doesn't** | Mutation instead of reassignment | Use `arr = [...arr, item]` not `arr.push(item)` |
| **"Type not found" error** | Encore client outdated | Run `bun run gen` |
| **Component doesn't render** | Conditional logic blocking render | Check if conditions are met, log state values |
| **SSE no events received** | Backend not emitting or query returns empty | Check backend query, verify data exists |
| **Network tab shows 404** | Endpoint path mismatch | Compare frontend URL with backend path |
| **"Module not found"** | Import path wrong or missing install | Fix import path or run `bun install` |

### Detailed Diagnostics by Pattern

**Pattern: Stream Connects but No Events**
1. Check WebSocket state is `1` (OPEN)
2. Verify backend logs show "Client connected"
3. Check backend query returns rows
4. Add logging in stream `for await` loop
5. Verify event format matches interface

**Pattern: Component State Not Updating**
1. Check if using mutation (`push`) instead of reassignment
2. Verify state is defined with `$state()`
3. Check if update happens inside async function
4. Add logging before and after state update
5. Verify component is still mounted

**Pattern: WebSocket Error on Connect**
1. Check browser console for exact error
2. Check network tab for status code
3. Verify backend endpoint path matches
4. Check CORS configuration in `backend/encore.app`
5. Verify backend endpoint is exported and running

## Phase 10: Testing Procedures

### Manual Testing Flow
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to page
4. Watch for connection logs
5. Trigger actions (click, navigate)
6. Verify state updates in console
7. Check Network tab for requests
8. Verify responses are correct

### Automated Checks
```typescript
// Add test mode flag
const TEST_MODE = import.meta.env.MODE === 'test';

if (TEST_MODE) {
  // Expose state for testing
  window.__appState = { graphNodes, graphEvents };
}
```

### Browser Console Commands
```javascript
// Check reactive state (in test mode)
console.log(window.__appState);

// Force garbage collection (Chrome)
// Settings → More tools → Performance monitor

// Check WebSocket connections
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('ws://'))
```

## Debugging Checklist for Stream Issues

When graph stream doesn't populate:

- [ ] Backend is running (`curl http://localhost:4000/health`)
- [ ] Frontend client regenerated (`bun run gen`)
- [ ] Browser console shows connection attempt
- [ ] WebSocket shows in Network tab
- [ ] WebSocket status is 101 (if not, check backend)
- [ ] Backend logs show "Client connected"
- [ ] Backend query returns data (check with SQL)
- [ ] Events logged in console `for await` loop
- [ ] State update logged after adding nodes
- [ ] Component re-renders after state update
- [ ] Conditional logic allows rendering

### Quick Fix: "WS shows no status code"
- Backend likely not running or endpoint not registered
- Start Docker daemon, then `cd backend && encore run`
- Restart frontend dev server if client types changed, then `bun run gen`

## Console Logging Standards

### Prefix Pattern
Use consistent prefixes for filtering:
- `[Graph Stream]` - WebSocket/SSE streaming
- `[Component]` - Component lifecycle
- `[API]` - HTTP API calls
- `[State]` - State updates
- `[Effect]` - $effect hooks

### Structured Logging
```typescript
console.log("[Graph Stream] Received event:", {
  type: event.type,
  screenId: event.data.screenId,
  seqRef: event.data.seqRef,
  timestamp: new Date().toISOString()
});
```

### Remove Logs After Debugging
```typescript
// During development
if (import.meta.env.DEV) {
  console.log("[Debug]", ...);
}
```

## Key Principles

### 🎯 Browser Tools First
Always use browser inspection tools before adding console logs. DevTools provide real-time state without code changes.

### 📊 Console Logs with Structure
Use prefixes and structured objects for easy filtering and understanding.

### 🔍 Verify Client Generation
When backend changes, ALWAYS regenerate the client. Type mismatches cause silent failures.

### ⚡ Check WebSocket State
WebSocket issues are #1 cause of streaming failures. Log state at every stage.

### 🔄 Follow Data Flow
For streams: Connect → Open → Receive → Parse → Update State → Render

### 📝 Structured Console Output
Use objects not strings for console logs. Makes debugging faster.

### 🧪 Test with Browser DevTools
Network tab + Console tab = 90% of debugging

### 📚 Document Patterns
Every debugging session teaches something. Update this skill.

## Real-World Example: Graph Stream Not Populating

**Reported Issue:** "Events logged but graph showing 'Waiting for screens...'"

**Investigation Steps:**
1. ✅ Used browser tools: `mcp_cursor-ide-browser_browser_console_messages()`
2. ✅ Found: "[Graph Stream] Connection established"
3. ✅ Found: "[Graph Stream] Stream ended (no more events)"
4. ✅ Network tab: WebSocket has no status code → Connection failed
5. ✅ Added detailed error logging to capture close reason
6. ✅ Found: Socket closes immediately after connecting
7. ✅ Checked backend logs: Endpoint handler never called
8. ✅ Root cause: Backend endpoint not registered or path mismatch

**Resolution:** 
- Check `backend/graph/encore.service.ts` imports endpoint
- Verify endpoint path in backend matches client call
- Restart backend to reload service definitions

## Guidelines

- **Browser tools first** - Faster than adding console logs
- **Network tab is critical** - Shows all connection attempts
- **Log WebSocket states** - State 0/1/2/3 tells the story
- **Regenerate client often** - After any backend API change
- **Check CORS** - Common issue with local development
- **Svelte 5 reactivity** - Reassign, don't mutate
- **Single $props() call** - Combine all props in one destructure
- **Console structure** - Objects not strings
- **Remove debug logs** - Or gate with `import.meta.env.DEV`

## Resources

- [SvelteKit Documentation](https://kit.svelte.dev)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state)
- [Encore Client Generation](https://encore.dev/docs/develop/client-generation)
- [Browser DevTools Guide](https://developer.chrome.com/docs/devtools/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

