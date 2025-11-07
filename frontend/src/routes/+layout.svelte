<script lang="ts">
import "../app.css";
import { goto } from '$app/navigation';

/** Root layout with Skeleton v3 for ultimate vibe coding */

/** Navigate to app info page */
function handleAppInfo() {
	goto('/app-info');
}

/** Navigate to home page */
function handleHome() {
	goto('/');
}
</script>

<!-- App Header with Skeleton v3 -->
<header class="bg-surface-100-900-token border-b border-surface-300-700-token">
  <div class="container mx-auto flex h-14 items-center px-4">
    <a href="/" class="text-lg font-semibold text-surface-900-50-token">ScreenGraph</a>
    <nav class="ml-auto flex gap-2">
      <button onclick={handleHome} class="btn variant-ghost-surface">Home</button>
      <button onclick={handleAppInfo} class="btn variant-ghost-surface">App Info</button>
    </nav>
  </div>
</header>

<!-- Main Content -->
<main>
  <slot />
</main>

