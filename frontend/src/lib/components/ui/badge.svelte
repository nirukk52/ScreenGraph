<script lang="ts">
import { cn } from "$lib/utils.js";
import type { HTMLAttributes } from "svelte/elements";
import { type VariantProps, tv } from "tailwind-variants";

/** Badge component for tags, statuses, and labels */
type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: VariantProps<typeof badgeVariants>["variant"];
};

const { class: className, variant = "default", ...rest }: Props = $props();

const badgeVariants = tv({
  base: "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  variants: {
    variant: {
      default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
      secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
      outline: "text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
</script>

<div class={cn(badgeVariants({ variant }), className)} {...rest}>
	{@render rest.children?.()}
</div>

