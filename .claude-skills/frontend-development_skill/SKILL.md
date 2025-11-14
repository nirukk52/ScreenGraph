---
name: frontend-development
description: Frontend development workflow for ScreenGraph using SvelteKit 2, Svelte 5 runes, Skeleton UI v4, and Encore-generated clients. Use when building or updating UI features, routes, or shared components while keeping progressive disclosure intact.
---

# Frontend Development Skill

## Mission
Deliver production-ready SvelteKit 2 + Svelte 5 experiences that stay aligned with Skeleton UI, Encore API types, and founder rules. This skill keeps the top-level workflow lean while the references provide deep dives for setup, patterns, and debugging.

## When to Use
- Designing or implementing new routes, layouts, and components
- Auditing Svelte 5 rune usage before debugging or code review
- Syncing Encore client updates with frontend behavior
- Preparing UI handoffs, demos, or regression fixes

## Development Loop
1. **Confirm stack + environment** – Follow `references/setup-and-config.md` to verify packages, project structure, and Skeleton theme config.
2. **Plan the feature** – Identify required routes, data needs, and component boundaries; capture notes in Graphiti.
3. **Implement with runes** – Use `$state`, `$derived`, `$effect`, `$props`, and `$bindable` patterns from `references/svelte5-patterns.md`.
4. **Compose UI** – Apply Skeleton v4 components, Tailwind tokens, and AutoAnimate helpers as documented in `references/ui-patterns.md`.
5. **Integrate Encore client** – Regenerate clients (`task founder:workflows:regen-client`) and rely on typed calls; never use manual `fetch`.
6. **Validate + test** – Run the quick command set below, then escalate to e2e Playwright flows via `e2e-testing_skill` if needed.
7. **Document + handoff** – Update Graphiti with new patterns, refresh specs, and capture screenshots for stakeholders.

## Quick Command Set
```bash
# Development
cd frontend && bun run dev

# Quality gates
cd frontend && bun run check      # Svelte + TS
cd .cursor && task frontend:lint  # Biome
cd .cursor && task frontend:test  # Unit/component tests

# After backend API changes
cd .cursor && task founder:workflows:regen-client
```

## Quality Gates (Complete Before Handoff)
- Uses Svelte 5 runes exclusively (`let` for mutable runes, no legacy `$:` reactivity)
- Skeleton UI components or Tailwind utility tokens instead of bespoke CSS
- Encore-generated client for every backend call (no manual fetch)
- Explicit TypeScript types, zero `any`
- No `console.log` in committed code
- American English spelling (canceled, color, optimize)
- `bun run build` passes locally before requesting review

## Reference Library
- `references/setup-and-config.md` – Package requirements, Skeleton theme wiring, project structure, Vite configuration
- `references/svelte5-patterns.md` – Rune usage, prop handling, Encore client integration, file-based routing
- `references/ui-patterns.md` – Skeleton component catalog, Tailwind tokens, AutoAnimate recipes, reusable component snippets, anti-patterns
- `references/debugging-and-quality.md` – Debugging signals, hydration checks, rune diagnostics, expanded quality checklist

## Related Skills
- `frontend-debugging_skill` – 10-phase investigation workflow for UI regressions
- `e2e-testing_skill` – Playwright-first regression strategy once UI flow is ready for automation
- `backend-development_skill` – Backend integration patterns that frontend components depend on

## Notes
- Keep SKILL.md lean (<300 lines). Move deep explanations, code samples, and setup scripts into `references/`, `scripts/`, or `assets/` folders.
- Update Graphiti with new UI patterns or decisions so other vibes can reuse the knowledge.
- Re-run `task founder:rules:check` before sharing large UI changes.
