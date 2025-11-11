# Frontend Debugging Skill

**Purpose:** Systematic 10-phase debugging procedure for SvelteKit 2 + Svelte 5 frontend issues.

---

## When to Use

- Component rendering issues
- Routing problems
- Svelte 5 runes errors ($state, $derived, $effect)
- API client failures
- Build or type errors

---

## 10-Phase Debugging Process

### Phase 1: Health Check
```bash
task frontend:dev
# Check browser console for errors
# Verify page loads without JavaScript errors
```

### Phase 2: Type Safety
```bash
task frontend:typecheck
task frontend:lint
# Ensure no TypeScript or linting errors
```

### Phase 3: Encore Client Sync
```bash
task founder:workflows:regen-client
# Verify ~encore/clients imports work
# Check generated types are latest
```

### Phase 4: Svelte 5 Runes
- ✅ Check proper rune usage ($state, $derived, $effect, $props)
- ✅ Verify runes only in `.svelte` files (not `.ts`)
- ✅ Ensure top-level declarations
- ✅ Check for conditional rune usage (not allowed)

### Phase 5: Routing
- ✅ Verify file structure: `+page.svelte`, `+layout.svelte`
- ✅ Check dynamic routes: `[id]/+page.svelte`
- ✅ Review load functions return correct shape
- ✅ Test URL navigation with `goto()` or click

### Phase 6: API Calls & Data Loading
- ✅ Always use Encore generated client
- ✅ Never manual `fetch()` calls
- ✅ Full type safety guaranteed
- ✅ Verify load functions execute on server + client
- ✅ Check WebSocket streams connected properly

### Phase 7: SSR/CSR Issues
- ✅ Check server vs browser context
- ✅ Verify `browser` checks when needed
- ✅ Test `+page.server.ts` vs `+page.ts` load functions
- ✅ Ensure no DOM API calls during SSR

### Phase 8: Component Isolation
- ✅ Test component in isolation
- ✅ Check $props destructuring correct
- ✅ Verify slot/snippet usage
- ✅ Test with different prop values

### Phase 9: E2E Testing
```bash
task frontend:test
# Run Playwright tests in headed mode
HEADLESS=false bun run test:e2e:headed
```

**Key E2E patterns:**
- Race navigation + API with `Promise.all([page.waitForURL(...), button.click()])`
- Use data attributes for reliable selectors: `data-testid="name"`
- Wait for final output (rendered screenshots), not intermediate states
- Avoid sequential waits (waitForResponse → waitForURL) which cause hangs

### Phase 10: Browser DevTools
- ✅ Svelte DevTools extension: inspect component state
- ✅ Network tab: verify API calls, WebSocket connections
- ✅ Console: check for errors/warnings
- ✅ Performance: check for rendering slowdowns

---

## Common Issues & Fixes

### E2E Test Hangs
**Problem:** `page.waitForResponse()` + `page.waitForURL()` in sequence causes timeout

**Fix:**
```typescript
// ❌ BAD: Sequential waits
await button.click();
await page.waitForResponse(...);  // HANGS
await page.waitForURL(...);

// ✅ GOOD: Parallel waits
await Promise.all([
  page.waitForURL(/\/run\/[a-f0-9-]+/i, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  }),
  button.click()
]);
```

### Rune Misuse
- ❌ Can't use runes in `.ts` files (only `.svelte`)
- ❌ Must be top-level declarations (no inside functions)
- ❌ No conditional runes
- ✅ Use reactive event handlers with `$effect` instead

### API Type Errors
- ❌ Forgot to regenerate client after backend changes
- ❌ Wrong import path (should be `~encore/clients` not `./encore-client`)
- ✅ Run `task founder:workflows:regen-client` after backend API changes

### SSR Hydration Mismatch
- ❌ Server renders different HTML than client
- ❌ Using browser-only APIs in +page.ts (should be +page.server.ts)
- ✅ Check timestamp/random values match between server and client render

### Navigation Not Working
- ❌ Using manual `goto()` without waiting for page ready
- ❌ Link navigation blocked by unsaved form data
- ✅ Test selector matches actual button: use `getByRole()` or `data-testid`

### WebSocket/Streaming Failures
- ❌ CORS issues with WebSocket endpoint
- ❌ Backend endpoint not registered (needs server restart)
- ✅ Check browser console for connection errors
- ✅ Verify endpoint exists via `browser.snapshot()` inspection

