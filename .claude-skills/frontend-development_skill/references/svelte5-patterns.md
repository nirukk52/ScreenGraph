# Svelte 5 Patterns and Encore Integration

## Rune Fundamentals
- Use `$state()` for mutable state and declare with `let`.
- `$derived()` replaces reactive statements; compute values from state.
- `$effect()` handles side effects (no async return values).
- `$props()` exposes component inputs; destructure with `let`.
- `$bindable()` enables two-way binding without `bind:` directives.

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => {
    console.log('Count changed:', count);
  });

  let { title, items = [] } = $props<{ title: string; items?: string[] }>();
</script>
```

## Guardrails
- No legacy `$:` reactive statements or `export let` syntax.
- Runes must be top-level inside `<script>`.
- Use `let` whenever the rune value mutates (especially `$bindable`).

## Encore Client Integration
```svelte
<script lang="ts">
  import { run } from '$lib/encore-client';

  async function startRun(appId: string) {
    const result = await run.start({ appId, policy: 'breadth' });
    console.log('Run started:', result.runId);
  }
</script>
```
- Regenerate the client after backend changes (`task founder:workflows:regen-client`).
- Never use manual `fetch` for Encore endpoints.

## TypeScript Standards
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return encore.users.get({ id });
}
```
- Explicit types everywhere; replace `any` with `unknown` + type guards when necessary.

## Routing Patterns
```
routes/
├── +layout.svelte
├── +layout.ts
├── +page.svelte
├── +page.ts
├── dashboard/
│   ├── +page.svelte
│   └── +page.ts
└── run/
    └── [id]/
        ├── +page.svelte
        └── +page.ts
```
- Use `+layout.ts` for shared data loaders.
- Dynamic routes use bracket syntax (`[id]`).

## SSR & Data Loading
```typescript
// +page.ts
import type { PageLoad } from './$types';
import { run } from '$lib/encore-client';

export const load: PageLoad = async ({ params }) => {
  const details = await run.get({ runId: params.id });
  return { details };
};
```
- Keep load results serialisable; move complex logic to `src/lib/server` helpers.
- Guard browser-only APIs with `if (browser)`.

## Component Organisation
```svelte
<!-- src/lib/components/RunCard.svelte -->
<script lang="ts">
  import type { Run } from '$lib/types';
  let { run, onClick } = $props<{ run: Run; onClick?: (id: string) => void }>();
</script>

<div class="card hover:variant-soft transition-all">
  <header class="card-header">
    <h3 class="h3">{run.appId}</h3>
  </header>
  <section class="p-4">
    <p>Status: {run.status}</p>
  </section>
  {#if onClick}
    <footer class="card-footer">
      <button class="btn variant-filled-primary" onclick={() => onClick?.(run.id)}>
        View Details
      </button>
    </footer>
  {/if}
</div>
```
- Place reusable UI in `src/lib/components/`.
- Keep props typed via `$props` runes.

## File Checklist Before Commit
- [ ] No `const` assignments for mutable runes
- [ ] Runes present at top level only
- [ ] Encore client imports used instead of fetch
- [ ] Component props and events typed in TypeScript
