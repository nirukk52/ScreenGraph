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
# Check browser console
```

### Phase 2: Type Safety
```bash
task frontend:typecheck
task frontend:lint
```

### Phase 3: Encore Client Sync
```bash
task founder:workflows:regen-client
# Verify ~encore/clients imports
```

### Phase 4: Svelte 5 Runes
- Check proper rune usage
- $state for reactive state
- $derived for computed values
- $effect for side effects
- $props for component props

### Phase 5: Routing
- Verify +page.svelte structure
- Check +layout.svelte hierarchy
- Review load functions

### Phase 6: API Calls
- Always use Encore generated client
- Never manual `fetch()` calls
- Full type safety guaranteed

### Phase 7: SSR/CSR Issues
- Check server vs browser context
- Verify `browser` checks when needed

### Phase 8: Component Isolation
- Test component in isolation
- Check props/slots/events

### Phase 9: Build Testing
```bash
task frontend:build
# Test production build
```

### Phase 10: Browser DevTools
- Use Svelte DevTools extension
- Check component state/props
- Review network requests

---

## Common Issues

### Rune Misuse
- Can't use runes in `.ts` files (only `.svelte`)
- Must be top-level declarations
- No conditional runes

### API Type Errors
- Regenerate client after backend changes
- Verify import paths use `~encore/clients`

### SSR Hydration
- Match server/client rendered output
- Check for browser-only code in wrong places

### Routing Issues
- File-based routing: check file structure
- Dynamic routes: `[slug]/+page.svelte`
- Verify load functions return correct shape

