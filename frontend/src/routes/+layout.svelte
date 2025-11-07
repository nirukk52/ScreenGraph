<script lang="ts">
import "../app.css";
import Button from "$lib/components/ui/button.svelte";

/** Root layout with shadcn-svelte for ultimate vibe coding */
</script>

<!-- App Header with shadcn-svelte -->
<header class="border-b">
  <div class="container mx-auto flex h-14 items-center px-4">
    <a href="/" class="text-lg font-semibold">ScreenGraph</a>
    <nav class="ml-auto flex gap-2">
      <Button variant="ghost" href="/">Home</Button>
      <Button variant="ghost" href="/app-info">App Info</Button>
    </nav>
  </div>
</header>

<!-- Main Content -->
<main>
  <slot />
</main>

