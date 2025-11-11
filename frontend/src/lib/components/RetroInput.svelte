<!--
@component
RetroInput: An input field component with retro-modern styling.
Provides consistent styling and optional label for form inputs.

Usage:
```svelte
<RetroInput 
  label="Email Address" 
  type="email" 
  placeholder="you@example.com"
  bind:value={email}
/>
```
-->
<script lang="ts">
/** Generate unique ID for label association */
const inputId = `retro-input-${Math.random().toString(36).substring(2, 9)}`;

/** Input label text */
const {
  label = undefined,
  /** Input type */
  type = "text",
  /** Placeholder text */
  placeholder = "",
  /** Input value */
  value = $bindable(""),
  /** Required field */
  required = false,
  /** Additional CSS classes */
  class: className = "",
  /** Change handler */
  onchange = undefined,
  /** Input handler */
  oninput = undefined,
}: {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  class?: string;
  onchange?: (e: Event) => void;
  oninput?: (e: Event) => void;
} = $props();
</script>

<div class="space-y-2 {className}">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-[var(--color-charcoal)]">
			{label}
			{#if required}<span class="text-red-500">*</span>{/if}
		</label>
	{/if}
	<input
		id={inputId}
		{type}
		{placeholder}
		{required}
		bind:value
		{onchange}
		{oninput}
		class="w-full px-4 py-3 bg-white retro-shadow rounded-xl text-[var(--color-charcoal)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-charcoal)] focus:ring-offset-2 transition-all"
	/>
</div>
