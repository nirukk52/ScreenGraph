# FR-016: shadcn-svelte Design System (formerly skeleton-ui-integration)

**Status:** ✅ **Complete**  
**Priority:** P2 (Medium)  
**Milestone:** M3 - Frontend Enhancement  
**Owner:** Claude (Cursor AI)  
**Estimated Effort:** Medium → **Completed**

---

## 📝 Description
~~Integrate Skeleton UI toolkit~~ **Implemented shadcn-svelte + Tailwind v4** as the ultimate vibe coding baseline design system. Provides copy-pasteable components with full source code ownership, enabling rapid, joyful frontend development with modern tooling.

**Business Value:**
- Faster feature development with ready-to-use components
- Consistent user experience across all pages
- Professional, modern UI out of the box
- Reduced custom CSS and maintenance overhead

---

## 🎯 Acceptance Criteria
- [x] ~~Skeleton UI and tw-plugin installed~~ → **shadcn-svelte + Tailwind v4 implemented**
- [x] Tailwind config updated → **Migrated to v4 @theme directive**
- [x] App shell implemented in root layout with header/nav structure
- [x] Core components created: **Button, Card, Badge** (owned code in `src/lib/components/ui/`)
- [x] Component styling implemented with **shadcn utilities**
- [x] Theme system configured (**shadcn Slate theme + custom retro tokens**)
- [x] Documentation updated with **shadcn usage examples** (FR-016-shadcn-implementation.md)
- [x] All existing pages migrated to use **shadcn/Tailwind classes**

---

## 🔗 Dependencies
- **Frontend:** Existing SvelteKit 2 + Svelte 5 setup
- **Libraries:** 
  - `shadcn-svelte@1.0.10` (Component CLI)
  - `bits-ui@2.14.2` (Headless component primitives)
  - `tailwindcss@4.0.0` (Utility-first CSS)
  - `tailwind-variants@3.1.1` (Component variants)
  - `tailwind-merge@3.3.1` (Class merging utility)
  - `clsx@2.1.1` (Conditional classes)
- **Related:** FR-015 (display-app-info-on-frontend) - uses shadcn Card and Badge components

---

## 🧪 Testing Requirements
- [ ] Visual regression testing for theme switching
- [ ] Component rendering tests for core Skeleton components
- [ ] Responsive design testing across breakpoints
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Toast notification system integration test
- [ ] Modal/drawer overlay functionality tests

---

## 📋 Technical Notes

### Installation
```bash
cd frontend

# Upgrade to Tailwind v4
bun add -D tailwindcss@next @tailwindcss/vite@next

# Install shadcn-svelte dependencies
bun add -D bits-ui clsx tailwind-merge tailwind-variants
```

### Tailwind v4 Configuration
**No `tailwind.config.ts` needed!** Configuration via CSS:

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  --color-primary: 222.2 47.4% 11.2%;
  --color-background: 0 0% 100%;
  /* ... all design tokens */
}
```

### Vite Configuration (`vite.config.ts`)
```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

### Root Layout (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
  import "../app.css";
  import { Button } from "$lib/components/ui/button.svelte";
</script>

<header class="border-b">
  <div class="container mx-auto flex h-14 items-center px-4">
    <a href="/" class="text-lg font-semibold">ScreenGraph</a>
    <nav class="ml-auto flex gap-2">
      <Button variant="ghost" href="/">Home</Button>
      <Button variant="ghost" href="/app-info">App Info</Button>
    </nav>
  </div>
</header>

<main>
  <slot />
</main>
```

### Component Usage Pattern
```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button.svelte";
  import { Card } from "$lib/components/ui/card.svelte";
  import { Badge } from "$lib/components/ui/badge.svelte";
  
  let loading = $state(false);
</script>

<Card class="p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-bold">Run Status</h2>
    <Badge variant="secondary">Active</Badge>
  </div>
  
  {#if loading}
    <div class="animate-pulse space-y-2">
      <div class="h-4 bg-muted rounded"></div>
      <div class="h-4 bg-muted rounded w-3/4"></div>
    </div>
  {:else}
    <Button>View Details</Button>
  {/if}
</Card>
```

### Adding More Components
```bash
# Copy-paste approach (recommended)
# 1. Visit https://www.shadcn-svelte.com/docs/components/[component]
# 2. Copy the code
# 3. Paste into src/lib/components/ui/[component].svelte

# Or use CLI
bunx shadcn-svelte@latest add dialog toast input
```

---

## 🏷️ Labels
`[frontend]`, `[ui]`, `[design-system]`, `[milestone-3]`, `[priority-p2]`

---

## 📚 Related Documents
- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/docs) - Main docs
- [shadcn-svelte Components](https://www.shadcn-svelte.com/docs/components) - Component library
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4-beta) - New CSS framework
- [FR-016 Implementation Guide](./FR-016-shadcn-implementation.md) - Complete setup guide
- [FR-016 Investigation Notes](./FR-016-implementation-notes.md) - Why we switched from Skeleton
- [Frontend Engineer Rules](.cursor/rules/frontend_engineer.mdc)
- [SvelteKit Documentation](.cursor/rules/frontend_llm_instruction.mdc)
- [FR-015: Display App Info on Frontend](../FR-015-display-app-info-on-frontend/FR-015-main.md)

---

## Release Plan (PROC-001)
- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@run-default-test` passes on this worktree
- Handoff:
  - After merge to main, run `@update-handoff` and choose the "Production Release Update" workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@run-default-test`

