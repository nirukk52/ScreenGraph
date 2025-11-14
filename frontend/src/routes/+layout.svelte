<script lang="ts">
import "../app.css";
import { goto } from "$app/navigation";
import { page } from "$app/state";

/** Root layout with Skeleton v3 for ultimate vibe coding */

/** Navigate to app info page */
function handleAppInfo() {
  goto("/app-info");
}

/** Navigate to home page */
function handleHome() {
  goto("/");
}

/** Navigate to dev journey page */
function handleDevJourney() {
  goto("/dev-journey");
}

/** Navigate to components page */
function handleComponents() {
  goto("/components");
}

/** Check if current path matches */
function isActive(path: string): boolean {
  return page.url.pathname === path;
}
</script>

<svelte:head>
  <title>ScreenGraph</title>
</svelte:head>

<!-- App Header with Skeleton v3 -->
<header class="bg-surface-100-900-token border-b border-surface-300-700-token">
  <div class="container mx-auto flex h-14 items-center px-4">
    <a href="/" class="text-lg font-semibold text-surface-900-50-token">ScreenGraph</a>
    <nav class="ml-auto flex gap-2">
      <button onclick={handleHome} class="btn variant-ghost-surface {isActive('/') ? 'variant-filled-primary' : ''}">Home</button>
      <button onclick={handleDevJourney} class="btn variant-ghost-surface {isActive('/dev-journey') ? 'variant-filled-primary' : ''}">Dev Journey</button>
      <button onclick={handleAppInfo} class="btn variant-ghost-surface {isActive('/app-info') ? 'variant-filled-primary' : ''}">App Info</button>
      <button onclick={handleComponents} class="btn variant-ghost-surface {isActive('/components') ? 'variant-filled-primary' : ''}">Components</button>
    </nav>
  </div>
</header>

<!-- Main Content -->
<main>
  <slot />
</main>

