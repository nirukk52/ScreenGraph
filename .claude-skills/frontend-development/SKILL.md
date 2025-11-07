# Frontend Development Skill

**Category:** Development  
**Status:** Active  
**Last Updated:** 2025-11-07

---

## Purpose

This skill defines the complete frontend development workflow for ScreenGraph, ensuring consistent, high-quality SvelteKit 2 + Svelte 5 + Skeleton v4 code across the entire application.

---

## Stack

- **Framework:** SvelteKit 2 (with Vite)
- **UI Library:** Svelte 5 (with Runes: $state, $derived, $effect, $props, $bindable)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + Skeleton v4
- **Design System:** Skeleton v4 (40+ components, 22 themes)
- **Animation:** AutoAnimate
- **API Client:** Encore-generated client (type-safe)
- **Deployment:** Vercel (adapter-vercel)

---

## Required Packages

```json
{
  "dependencies": {
    "@formkit/auto-animate": "^0.8.2",
    "envalid": "^8.1.1",
    "lucide-svelte": "^0.425.0"
  },
  "devDependencies": {
    "@skeletonlabs/skeleton": "4.2.4",
    "@skeletonlabs/skeleton-svelte": "^4.2.4",
    "@sveltejs/adapter-vercel": "^4.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "svelte": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.9.3",
    "vite": "^6.0.0"
  }
}
```

---

## Setup Procedure

### 1. Skeleton v4 Configuration

**app.css:**
```css
@import 'tailwindcss';

/* Skeleton v4 CSS imports */
@import '@skeletonlabs/skeleton';
@import '@skeletonlabs/skeleton-svelte';
@import '@skeletonlabs/skeleton/themes/cerberus';

@layer base {
  :root {
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.5;
    font-weight: 400;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }
}
```

**app.html:**
```html
<html lang="en" data-theme="cerberus">
```

### 2. Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   ├── server/            # Server-only helpers
│   │   ├── encore-client.ts   # Generated Encore API client
│   │   └── env.ts             # Environment validation
│   ├── routes/
│   │   ├── +layout.svelte     # Root layout
│   │   ├── +page.svelte       # Landing page
│   │   └── [...routes]/       # Feature pages
│   ├── app.html               # HTML template
│   └── app.css                # Global styles
├── static/                    # Public assets
├── package.json
├── svelte.config.js
└── vite.config.ts
```

### 3. vite.config.ts

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port: 5173,
    strictPort: true
  }
});
```

---

## Development Standards

### 1. **Svelte 5 Runes (Required)**

Always use Svelte 5 Runes syntax:

**State Management:**
```svelte
<script lang="ts">
  // ✅ Use $state() for reactive state
  let count = $state(0);
  
  // ✅ Use $derived() for computed values
  let doubled = $derived(count * 2);
  
  // ✅ Use $effect() for side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
  
  // ✅ Use $props() for component props
  let { title, items = [] } = $props<{
    title: string;
    items?: string[];
  }>();
</script>
```

**NO legacy syntax:**
```svelte
<!-- ❌ Don't use let/const for reactive state -->
let count = 0; // Wrong!

<!-- ❌ Don't use $: for computed values -->
$: doubled = count * 2; // Wrong!

<!-- ❌ Don't use export for props -->
export let title: string; // Wrong!
```

### 2. **Skeleton v4 Components**

Use Skeleton v4 components via imports:

```svelte
<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import { Toast } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar>
  <svelte:fragment slot="lead">Logo</svelte:fragment>
  <svelte:fragment slot="trail">
    <a href="/" class="btn variant-ghost-surface">Home</a>
  </svelte:fragment>
</AppBar>
```

**Available Skeleton v4 Components:**
- Functional: AppBar, Modal, Toast, Dialog, Popover, Tabs, Accordion
- Form: Combobox, DatePicker, FileUpload, Listbox, Switch, Slider
- Display: Avatar, Badge, Card, Chip, Progress, Tooltip
- Layout: Navigation, Pagination, Portal

### 3. **Tailwind CSS v4 Styling**

Use Skeleton v4's Tailwind classes:

```svelte
<!-- Surface colors (theme-aware) -->
<div class="bg-surface-100-900-token text-surface-900-50-token">
  Content adapts to light/dark mode
</div>

<!-- Skeleton components -->
<button class="btn variant-filled-primary">Primary Button</button>
<button class="btn variant-ghost-surface">Ghost Button</button>
<button class="btn variant-soft-secondary">Soft Button</button>

<!-- Cards -->
<div class="card p-4">
  <header class="card-header">Title</header>
  <section class="p-4">Content</section>
  <footer class="card-footer">Footer</footer>
</div>

<!-- Badges -->
<span class="badge variant-filled-success">Success</span>
<span class="chip variant-soft-error">Error Chip</span>
```

### 4. **AutoAnimate Transitions**

Use AutoAnimate for smooth transitions:

```svelte
<script lang="ts">
  import { autoAnimate } from '@formkit/auto-animate';
  
  let items = $state(['A', 'B', 'C']);
</script>

<!-- Animate list changes -->
<ul use:autoAnimate>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>

<!-- Animate conditional rendering -->
<div use:autoAnimate>
  {#if showModal}
    <div class="modal">Content</div>
  {/if}
</div>
```

### 5. **API Calls with Encore Client**

Always use the generated Encore client for type-safe API calls:

```svelte
<script lang="ts">
  import { run } from '$lib/encore-client';
  
  async function startRun(appId: string) {
    try {
      const result = await run.start({ appId, policy: 'breadth' });
      console.log('Run started:', result.runId);
    } catch (error) {
      console.error('Failed to start run:', error);
    }
  }
</script>
```

**❌ Never use manual fetch:**
```typescript
// ❌ Wrong - bypasses type safety
const response = await fetch('/api/run/start', {
  method: 'POST',
  body: JSON.stringify({ appId })
});
```

### 6. **TypeScript Standards**

**Always provide explicit types:**
```typescript
// ✅ Good - explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return encore.users.get({ id });
}

// ❌ Bad - no types
function getUser(id) {
  return encore.users.get({ id });
}
```

**Never use `any`:**
```typescript
// ❌ Bad - using any
let data: any = await fetchData();

// ✅ Good - proper type or unknown
let data: unknown = await fetchData();
if (isUser(data)) {
  // Type guard narrows to User
  console.log(data.name);
}
```

### 7. **File-Based Routing**

Follow SvelteKit's routing conventions:

```
routes/
├── +layout.svelte           # Root layout
├── +layout.ts               # Root layout data loader
├── +page.svelte             # Landing page (/)
├── +page.ts                 # Landing page data loader
├── app-info/
│   └── +page.svelte         # /app-info page
├── run/
│   └── [id]/
│       ├── +page.svelte     # /run/:id page
│       └── +page.ts         # Load run data
└── api/                     # NOT USED - use Encore backend
```

### 8. **Server-Side Rendering (SSR)**

Use `+page.ts` or `+page.server.ts` for data loading:

```typescript
// +page.ts (runs on client + server)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  // Load data from Encore API
  const run = await encore.run.get({ runId: id });
  return { run };
};
```

### 9. **Component Organization**

Create reusable components in `src/lib/components/`:

```svelte
<!-- src/lib/components/RunCard.svelte -->
<script lang="ts">
  import type { Run } from '$lib/types';
  
  let { run, onClick } = $props<{
    run: Run;
    onClick?: (id: string) => void;
  }>();
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

---

## Workflow Commands

### Development
```bash
cd frontend && bun run dev       # Start dev server (port 5173)
cd frontend && bun run build     # Production build
cd frontend && bun run preview   # Preview production build
```

### Quality Checks
```bash
cd frontend && bun run check     # TypeScript + Svelte check
cd .cursor && task frontend:typecheck  # TypeScript only
cd .cursor && task frontend:lint       # Biome lint
cd .cursor && task frontend:test       # Run tests
```

### After Backend Changes
```bash
cd frontend && bun run gen       # Regenerate Encore client
# OR
cd .cursor && task founder:workflows:regen-client
```

---

## Common Patterns

### 1. **Page with Data Loading**

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import RunCard from '$lib/components/RunCard.svelte';
  
  let { data } = $props<{ data: PageData }>();
  let runs = $state(data.runs);
</script>

<div class="container mx-auto p-4">
  <h1 class="h1">Runs</h1>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each runs as run}
      <RunCard {run} />
    {/each}
  </div>
</div>
```

```typescript
// +page.ts
import { encore } from '$lib/encore-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const runs = await encore.run.list();
  return { runs };
};
```

### 2. **Modal with Form**

```svelte
<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import { autoAnimate } from '@formkit/auto-animate';
  
  let showModal = $state(false);
  let name = $state('');
  
  async function handleSubmit() {
    await encore.users.create({ name });
    showModal = false;
  }
</script>

<button class="btn variant-filled-primary" onclick={() => showModal = true}>
  Create User
</button>

{#if showModal}
  <Modal onclose={() => showModal = false}>
    <svelte:fragment slot="header">Create User</svelte:fragment>
    
    <form onsubmit|preventDefault={handleSubmit} class="space-y-4">
      <label class="label">
        <span>Name</span>
        <input class="input" type="text" bind:value={name} required />
      </label>
      <button type="submit" class="btn variant-filled-primary">Create</button>
    </form>
  </Modal>
{/if}
```

### 3. **Toast Notifications**

```svelte
<script lang="ts">
  import { Toast, toastStore } from '@skeletonlabs/skeleton-svelte';
  
  function showSuccess() {
    toastStore.trigger({
      message: 'Operation successful!',
      background: 'variant-filled-success'
    });
  }
  
  function showError() {
    toastStore.trigger({
      message: 'Something went wrong',
      background: 'variant-filled-error',
      autohide: false
    });
  }
</script>

<Toast />
```

---

## Anti-Patterns (Do NOT Do This)

### ❌ 1. Don't Copy-Paste Components

```svelte
<!-- ❌ Bad - copying component code -->
<script>
  // 500 lines of copied button component code
</script>

<!-- ✅ Good - import from package -->
<script>
  import { Button } from '@skeletonlabs/skeleton-svelte';
</script>
```

### ❌ 2. Don't Use Manual Fetch

```typescript
// ❌ Bad - manual fetch, no types
const response = await fetch('/api/users');
const users = await response.json();

// ✅ Good - Encore client with types
const users = await encore.users.list();
```

### ❌ 3. Don't Use console.log

```typescript
// ❌ Bad - console.log in production
console.log('User logged in:', user);

// ✅ Good - use Encore structured logging (backend only)
// Frontend: Remove debug logs before commit
```

### ❌ 4. Don't Mix Svelte 4 and Svelte 5 Syntax

```svelte
<!-- ❌ Bad - mixing old and new syntax -->
<script>
  export let count = 0;  // Svelte 4
  let doubled = $derived(count * 2);  // Svelte 5
</script>

<!-- ✅ Good - pure Svelte 5 -->
<script>
  let { count = 0 } = $props();
  let doubled = $derived(count * 2);
</script>
```

### ❌ 5. Don't Use Inline Styles

```svelte
<!-- ❌ Bad - inline styles -->
<div style="color: red; padding: 20px;">Content</div>

<!-- ✅ Good - Tailwind classes -->
<div class="text-error-500 p-5">Content</div>
```

---

## Skeleton v4 Themes

22 available themes (change via `data-theme` attribute):

**Modern:**
- `cerberus` (default) - Balanced gray/blue
- `modern` - Clean contemporary
- `concord` - Purple tones
- `seafoam` - Teal/aqua

**Retro:**
- `vintage` - Warm retro
- `legacy` - Classic skeleton
- `terminus` - Dark terminal

**Vibrant:**
- `crimson` - Red accents
- `rose` - Pink tones
- `mint` - Green fresh
- `fennec` - Orange warmth

**View all:** https://www.skeleton.dev/docs/design-system/themes

---

## Debugging

### Common Issues

**1. "Module not found: @skeletonlabs/skeleton/themes/cerberus"**
- Cause: Wrong package version installed
- Fix: Ensure `@skeletonlabs/skeleton@4.2.4` (not 2.x)
- Run: `bun remove @skeletonlabs/skeleton && bun add -D @skeletonlabs/skeleton@latest`

**2. "Cannot use import statement outside a module"**
- Cause: Missing `type: "module"` in package.json
- Fix: Add `"type": "module"` to package.json

**3. "Rune syntax not working"**
- Cause: Svelte 4 installed instead of Svelte 5
- Fix: `bun add -D svelte@^5.0.0`

**4. "Encore client types missing"**
- Cause: Client not regenerated after backend changes
- Fix: `cd frontend && bun run gen`

---

## Quality Checklist

Before committing frontend code, verify:

- [ ] Uses Svelte 5 Runes ($state, $derived, $effect, $props)
- [ ] Imports Skeleton v4 components (not copy-pasted)
- [ ] Uses Encore client for API calls (no manual fetch)
- [ ] All functions/components have TypeScript types
- [ ] No `any` types
- [ ] No `console.log` statements
- [ ] Uses Tailwind classes (no inline styles)
- [ ] Uses AutoAnimate for transitions
- [ ] Follows file-based routing conventions
- [ ] American English spelling (canceled, color, etc.)
- [ ] Build passes: `bun run build`
- [ ] Type check passes: `bun run check`

---

## Resources

- [Skeleton v4 Docs](https://www.skeleton.dev/docs/get-started/installation/sveltekit)
- [Skeleton LLM Docs](https://www.skeleton.dev/llms-svelte.txt)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [AutoAnimate](https://auto-animate.formkit.com/)

---

**Last Updated:** 2025-11-07  
**Maintainer:** ScreenGraph Team  
**Status:** Active ✅

