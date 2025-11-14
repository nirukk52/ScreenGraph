<script lang="ts">
import { cn } from "$lib/utils.js";
import type { HTMLAttributes } from "svelte/elements";

/** Card component - perfect for grouping content with vibe */
type Props = HTMLAttributes<HTMLDivElement>;

const { class: className, ...rest }: Props = $props();
</script>

<div
	class={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
	{...rest}
>
	{@render rest.children?.()}
</div>

