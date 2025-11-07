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
- [ ] Skeleton UI and tw-plugin installed via bun
- [ ] Tailwind config updated with Skeleton plugin and theme presets
- [ ] App shell implemented in root layout with header/nav structure
- [ ] Core Skeleton components integrated: AppBar, Modal, Toast, ProgressBar
- [ ] Skeleton loader patterns implemented for async data loading
- [ ] Theme system configured (default to 'skeleton' preset)
- [ ] Documentation updated with Skeleton usage examples
- [ ] All existing pages migrated to use Skeleton components where applicable

---

## 🔗 Dependencies
- **Frontend:** Existing SvelteKit 2 + Svelte 5 setup
- **Libraries:** 
  - `@skeletonlabs/skeleton` (UI components)
  - `@skeletonlabs/tw-plugin` (Tailwind integration)
- **Related:** FR-015 (display-app-info-on-frontend) - may benefit from Skeleton components

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
bun add -D @skeletonlabs/skeleton @skeletonlabs/tw-plugin
```

### Tailwind Configuration (`tailwind.config.ts`)
```typescript
import { skeleton } from '@skeletonlabs/tw-plugin';
import { join } from 'path';

export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  plugins: [
    skeleton({
      themes: { preset: ['skeleton', 'modern', 'crimson'] }
    })
  ]
};
```

### App CSS (`src/app.css`)
```css
@import '@skeletonlabs/skeleton/styles/skeleton.css';
@import '@skeletonlabs/skeleton/themes/theme-skeleton.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Root Layout (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
  import { AppShell, AppBar, Modal, Toast } from '@skeletonlabs/skeleton';
  import { initializeStores } from '@skeletonlabs/skeleton';
  
  initializeStores();
</script>

<Toast />
<Modal />

<AppShell>
  <svelte:fragment slot="header">
    <AppBar>
      <svelte:fragment slot="lead">ScreenGraph</svelte:fragment>
      <svelte:fragment slot="trail">
        <!-- Navigation items -->
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  
  <slot />
</AppShell>
```

### Component Usage Pattern
```svelte
<script lang="ts">
  import { ProgressBar, Avatar, getToastStore } from '@skeletonlabs/skeleton';
  
  const toastStore = getToastStore();
  let loading = $state(false);
</script>

{#if loading}
  <div class="placeholder animate-pulse" />
{:else}
  <ProgressBar value={progress} max={100} />
{/if}
```

---

## 🏷️ Labels
`[frontend]`, `[ui]`, `[design-system]`, `[milestone-3]`, `[priority-p2]`

---

## 📚 Related Documents
- [Skeleton UI Documentation](https://www.skeleton.dev)
- [Frontend Engineer Rules](.cursor/rules/frontend_engineer.mdc)
- [SvelteKit Documentation](.cursor/rules/frontend_llm_instruction.mdc)
- [FR-015: Display App Info on Frontend](../FR-015-display-app-info-on-frontend/FR-015-main.md)

---

## Release Plan (PROC-001)
- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@test-default-run` passes on this worktree
- Handoff:
  - After merge to main, run `@update_handoff` and choose the "Production Release Update" workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@test-default-run`

