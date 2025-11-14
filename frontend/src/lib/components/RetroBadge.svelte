<!--
@component
RetroBadge: A badge component with retro-modern styling for labels and status indicators.

Usage:
```svelte
<RetroBadge variant="sky">New Feature</RetroBadge>
```
-->
<script lang="ts">
import type { Snippet } from "svelte";

/** Visual style variant */
const {
  variant = "gray",
  /** Additional CSS classes */
  class: className = "",
  /** Badge content */
  children,
}: {
  variant?: "sky" | "tan" | "pink" | "gray" | "dark";
  class?: string;
  children?: Snippet;
} = $props();

// Variant color mappings
const variantClasses = {
  sky: "bg-[var(--color-sky-blue)] text-[var(--color-charcoal)]",
  tan: "bg-[var(--color-warm-tan)] text-[var(--color-charcoal)]",
  pink: "bg-[var(--color-soft-pink)] text-[var(--color-charcoal)]",
  gray: "bg-[var(--color-neutral-gray)] text-[var(--color-charcoal)]",
  dark: "bg-[var(--color-charcoal-dark)] text-white",
};
</script>

<span class="inline-block px-3 py-1 retro-shadow-sm rounded-lg text-sm font-medium {variantClasses[variant]} {className}">
	{#if children}
		{@render children()}
	{/if}
</span>

