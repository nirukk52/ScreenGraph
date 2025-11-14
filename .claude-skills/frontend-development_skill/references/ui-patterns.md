# UI Patterns and Component Recipes

## Skeleton UI Components
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
- Functional: AppBar, Modal, Toast, Dialog, Popover, Tabs, Accordion
- Form: Combobox, DatePicker, FileUpload, Listbox, Switch, Slider
- Display: Avatar, Badge, Card, Chip, Progress, Tooltip
- Layout: Navigation, Pagination, Portal

## Tailwind + Theme Tokens
```svelte
<div class="bg-surface-100-900-token text-surface-900-50-token">
  Content adapts to light/dark mode
</div>
<button class="btn variant-filled-primary">Primary</button>
<button class="btn variant-ghost-surface">Ghost</button>
<button class="btn variant-soft-secondary">Soft</button>
```
- Prefer Skeleton tokens (`bg-surface-*`, `text-surface-*`) for theme-aware colors.
- Use Tailwind utility classes for layout, spacing, and responsive grids.

## AutoAnimate Recipes
```svelte
<script lang="ts">
  import { autoAnimate } from '@formkit/auto-animate';
  let items = $state(['A', 'B', 'C']);
</script>

<ul use:autoAnimate>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>
```
- Apply `use:autoAnimate` to lists, modals, and conditional containers.
- For modals or toasts, pair with Skeleton components for transitions.

## Common Page Pattern
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
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each runs as run}
      <RunCard {run} />
    {/each}
  </div>
</div>
```

## Modal Form Pattern
```svelte
<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';
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

## Toast Notifications
```svelte
<script lang="ts">
  import { Toast, toastStore } from '@skeletonlabs/skeleton-svelte';
  function showSuccess() {
    toastStore.trigger({
      message: 'Operation successful! ',
      background: 'variant-filled-success'
    });
  }
</script>

<Toast />
```

## Anti-Patterns (Avoid)
- Copy-pasting component source instead of importing from Skeleton.
- Manual `fetch` calls instead of Encore client.
- Inline styles for colors/spacing; rely on Tailwind utilities and tokens.
- Mixing legacy Svelte 4 syntax with runes within the same component.

## Skeleton Theme Catalog
| Category | Themes |
| --- | --- |
| Modern | `cerberus`, `modern`, `concord`, `seafoam` |
| Retro | `vintage`, `legacy`, `terminus` |
| Vibrant | `crimson`, `rose`, `mint`, `fennec` |

Switch themes by changing the `data-theme` attribute on `<html>` in `app.html`.
