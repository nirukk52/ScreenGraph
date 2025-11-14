<script lang="ts">
import { cn } from "$lib/utils.js";
import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

/** Button component with multiple variants for ultimate vibe coding */
const BASE_CLASS =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

/** Maps variant names to Tailwind class tokens. */
const VARIANT_CLASS_MAP = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline:
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
} as const;

/** Maps size tokens to Tailwind class strings. */
const SIZE_CLASS_MAP = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASS_MAP;
type ButtonSize = keyof typeof SIZE_CLASS_MAP;

type Props = HTMLButtonAttributes & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: Snippet;
};

let {
  class: className,
  variant = "default",
  size = "default",
  children,
  ...rest
}: Props = $props();

/** Combines base, variant, and size classes to style the button element. */
const computedClass = $derived(
  cn(BASE_CLASS, VARIANT_CLASS_MAP[variant], SIZE_CLASS_MAP[size], className ?? ""),
);
</script>

<button
	type="button"
	class={computedClass}
	{...rest}
>
	{@render children?.()}
</button>
