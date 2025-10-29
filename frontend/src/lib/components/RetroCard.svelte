<!--
@component
RetroCard: A card container component with retro-modern styling and bold shadows.
Provides consistent spacing and styling for grouped content.

Usage:
```svelte
<RetroCard variant="sky" title="My Card">
  <p>Card content goes here</p>
</RetroCard>
```
-->
<script lang="ts">
	import { type Snippet } from 'svelte';

	/** Visual style variant */
	let {
		variant = 'white',
		/** Optional card title */
		title = undefined,
		/** Optional card description */
		description = undefined,
		/** Additional CSS classes */
		class: className = '',
		/** Card content */
		children
	}: {
		variant?: 'sky' | 'tan' | 'pink' | 'white' | 'gray';
		title?: string;
		description?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	// Variant color mappings
	const variantClasses = {
		sky: 'bg-[var(--color-sky-blue)]',
		tan: 'bg-[var(--color-warm-tan)]',
		pink: 'bg-[var(--color-soft-pink)]',
		white: 'bg-white',
		gray: 'bg-[var(--color-neutral-gray)]'
	};
</script>

<div class="retro-shadow rounded-2xl p-6 {variantClasses[variant]} {className}">
	{#if title}
		<h3 class="text-xl font-medium text-[var(--color-charcoal)] mb-3">
			{title}
		</h3>
	{/if}
	
	{#if description}
		<p class="text-[var(--color-text-secondary)] mb-4">
			{description}
		</p>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>

