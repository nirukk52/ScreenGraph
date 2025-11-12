# Debugging Signals and Quality Checklist

## Fast Debugging Signals
- `page.waitForURL` timeout ➜ backend `startRun` failure; inspect `task backend:logs`.
- Timeline event `agent.app.launch_failed` ➜ Appium/device misconfiguration.
- Playwright screenshot shows Vite overlay ➜ Rune declaration issue (see `frontend-debugging_skill/references/svelte5-runes-debugging.md`).

## Hydration & SSR Checks
- Ensure server/client markup matches—watch console for hydration warnings.
- Wrap browser-only APIs with `if (browser)`.
- Return serialisable data from load functions; offload heavy logic to `src/lib/server`.

## Rune Diagnostics
- Grep for `const .* $state` / `$bindable` / `$props` and replace with `let` when mutating.
- `$bindable` cannot be combined with `bind:value`; use `{value}` + `oninput` handlers.
- Keep runes at top level of the `<script>` block.

## Expanded Quality Checklist
- [ ] Svelte 5 runes only (`let` for mutable runes, no legacy `$:`)
- [ ] Skeleton/Tailwind tokens instead of ad-hoc CSS
- [ ] Encore-generated client for all backend calls
- [ ] Explicit TypeScript types, no `any`
- [ ] `bun run build` and `bun run check` succeed
- [ ] `task frontend:lint` and `task frontend:test` succeed
- [ ] American English spelling throughout (canceled, color, optimize)
- [ ] UI snippets documented in Graphiti when introducing new patterns

## Resources
- Skeleton Docs: https://www.skeleton.dev/docs/get-started/installation/sveltekit
- Svelte 5 Docs: https://svelte.dev/docs/svelte/overview
- SvelteKit Docs: https://kit.svelte.dev/docs
- Tailwind CSS v4: https://tailwindcss.com/docs
- AutoAnimate: https://auto-animate.formkit.com/
