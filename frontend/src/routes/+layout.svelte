<script lang="ts">
import "../app.css";

/** Root layout with Skeleton v3 for ultimate vibe coding */
</script>

<!-- App Header with Skeleton v3 -->
<header class="bg-surface-100-900-token border-b border-surface-300-700-token">
  <div class="container mx-auto flex h-14 items-center px-4">
    <a href="/" class="text-lg font-semibold text-surface-900-50-token">ScreenGraph</a>
    <nav class="ml-auto flex gap-2">
      <a href="/" class="btn variant-ghost-surface">Home</a>
      <a href="/app-info" class="btn variant-ghost-surface">App Info</a>
    </nav>
  </div>
</header>

<!-- Main Content -->
<main>
  <slot />
</main>

