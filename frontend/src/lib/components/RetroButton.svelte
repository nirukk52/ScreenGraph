<!--
@component
RetroButton: A button component with retro-modern styling featuring bold shadows and vibrant colors.
Provides visual feedback through shadow animation on hover and press.

Usage:
```svelte
<RetroButton variant="primary" size="md" onclick={() => console.log('clicked')}>
  Click Me
</RetroButton>
```
-->
<script lang="ts">
	import { type Snippet } from 'svelte';

	/** Visual style variant of the button */
	let { 
		variant = 'primary',
		/** Size of the button */
		size = 'md',
		/** Additional CSS classes */
		class: className = '',
		/** Button type attribute */
		type = 'button',
		/** Disabled state */
		disabled = false,
		/** Click handler */
		onclick,
		/** Button content */
		children
	}: {
		variant?: 'primary' | 'secondary' | 'accent' | 'success';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	} = $props();

	// Variant color mappings
	const variantClasses = {
		primary: 'bg-[var(--color-charcoal-dark)] text-white',
		secondary: 'bg-white text-[var(--color-charcoal)]',
		accent: 'bg-[var(--color-sky-blue)] text-[var(--color-charcoal)]',
		success: 'bg-[var(--color-soft-pink)] text-[var(--color-charcoal)]'
	};

	// Size mappings
	const sizeClasses = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg'
	};
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="retro-shadow-hover rounded-xl font-medium transition-all {variantClasses[variant]} {sizeClasses[size]} {className} disabled:opacity-50 disabled:cursor-not-allowed"
>
	{#if children}
		{@render children()}
	{/if}
</button>

