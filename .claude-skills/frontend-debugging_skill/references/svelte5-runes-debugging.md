# Svelte 5 Runes Debugging Guide

**Focus:** Resolve runtime overlays and Playwright failures caused by incorrect rune declarations.

## Failure Signature
- Vite overlay `[plugin:vite-plugin-svelte] Cannot assign/bind to constant`
- Playwright screenshots show `500 Internal Error`
- Console stack traces point to destructuring lines using `$state`, `$bindable`, `$props`, `$derived`

## Fix Workflow
1. Grep for misuse:
   ```bash
grep -R "\$state" src | grep 'const'
grep -R "\$bindable" src | grep 'const'
grep -R "\$props" src | grep 'const'
   ```
2. Replace `const` with `let` when the rune value mutates or participates in binding.
3. Restart the dev server to clear cached overlays: `bun run dev`.
4. Re-run the grep commands to verify there are no remaining constant assignments.

## `$bindable` Rules
- Do **not** use `bind:value` with `$bindable()`.
- Preferred pattern:
  ```svelte
  let { value = $bindable("") } = $props();

  <input
    {value}
    oninput={(event) => {
      value = event.currentTarget.value;
      oninput?.(event);
    }}
  />
  ```

## `$state` Rules
- Always declare mutable state with `let`:
  ```svelte
  let count = $state(0);
  count++;
  ```
- Never mix Svelte 4 reactivity (e.g., `$: doubled = count * 2`) with runes inside the same component.

## `$props` Rules
- Destructure with `let` to allow reassignment:
  ```svelte
  let { items = $state([]), query = $state("") } = $props();
  ```
- Runes are only valid at the top level of a `<script>` block—never inside functions or conditionals.

## Quick Diagnostics
- Component still failing after fixes? Confirm Svelte 5 installed: `bun pm ls | grep svelte@5`.
- Ensure `frontend-development_skill/references/svelte5-patterns.md` is up to date before changing patterns.
- Use Svelte DevTools to inspect the live component state after redeploying.
