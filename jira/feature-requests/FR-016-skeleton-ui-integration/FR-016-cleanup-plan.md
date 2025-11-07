# FR-016: Design System Cleanup Plan

**Status:** 🚧 In Progress  
**Last Updated:** 2025-11-07  
**Context:** shadcn-svelte is the correct choice (Skeleton UI v4 was tried and failed)

---

## 🎯 Goal

Clean up remaining issues from the Skeleton UI → shadcn-svelte migration and fix bugs discovered in FR-018.

---

## ✅ Already Complete

- ✅ shadcn-svelte installed and working
- ✅ Tailwind v4 configured
- ✅ Base components created (Button, Card, Badge)
- ✅ Layout migrated to shadcn
- ✅ Documentation written (FR-016-shadcn-implementation.md)

---

## 🚨 Issues to Fix

### 1. **Tailwind v4 @theme/@media Syntax Error** 🔴

**File:** `frontend/src/app.css`  
**Problem:** `@media (prefers-color-scheme: dark)` is placed incorrectly relative to `@theme` block

**Current (Invalid):**
```css
@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  /* ... tokens ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 222.2 84% 4.9%;
    /* ❌ This should use @theme, not :root */
  }
}
```

**Fix:**
```css
@import "tailwindcss";

@theme {
  /* Light mode tokens */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  /* ... all light mode tokens ... */
}

/* Dark mode uses separate @theme inside @media */
@media (prefers-color-scheme: dark) {
  @theme {
    /* Dark mode tokens */
    --color-background: 222.2 84% 4.9%;
    --color-foreground: 210 40% 98%;
    /* ... all dark mode tokens ... */
  }
}

@layer base {
  /* Custom base styles stay here */
  :root {
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    /* ... */
  }
}

@layer utilities {
  /* Retro shadow utilities */
}
```

**Task:** Fix app.css @theme/@media structure

---

### 2. **Button Import Inconsistency** 🟡

**Files affected:**
- `frontend/src/routes/+layout.svelte` (line 3)
- Potentially other files

**Current:**
```svelte
import Button from "$lib/components/ui/button.svelte";
```

**Problem:** Mixing default and named imports causes confusion

**Fix Options:**

**Option A:** Standardize on default imports (recommended for simplicity)
```svelte
// Keep as-is
import Button from "$lib/components/ui/button.svelte";
<Button>Click</Button>
```

**Option B:** Create barrel exports for named imports
```typescript
// Create: $lib/components/ui/button/index.ts
export { default as Button } from './button.svelte';
```
```svelte
// Then use:
import { Button } from "$lib/components/ui/button";
```

**Decision:** Use **Option A** (default imports) for consistency with shadcn-svelte docs

**Task:** Audit all component imports and standardize

---

### 3. **Remove Unused Skeleton UI Package** 📦

**File:** `frontend/package.json`

**Current:**
```json
{
  "dependencies": {
    "@skeletonlabs/skeleton": "^4.2.4",  // ❌ Remove this
    "clsx": "^2.1.1",
    "lucide-svelte": "^0.425.0",
    "tailwind-merge": "^3.3.1",
    "tw-animate-css": "^1.4.0"
  }
}
```

**Why remove:**
- Not using any Skeleton UI components
- Failed integration (see FR-016-implementation-notes.md)
- Adds ~2MB to node_modules
- Confusing for future developers

**Task:** Remove from package.json and run `bun install`

---

### 4. **Audit All shadcn Components for Svelte 5 Compatibility** 🟡

**Current components:**
- `$lib/components/ui/button.svelte` ✅ Uses $props()
- `$lib/components/ui/card.svelte` ❓ Need to verify
- `$lib/components/ui/badge.svelte` ❓ Need to verify

**Check for:**
- ✅ Using `$props()` rune (not `export let`)
- ✅ Using `{@render children?.()}` (not `<slot>`)
- ✅ No deprecated Svelte 4 patterns
- ✅ TypeScript types are correct

**Task:** Review each component file

---

### 5. **Document Component Usage Patterns** 📝

**Create:** `frontend/COMPONENT_GUIDE.md`

**Include:**
- Import patterns (default vs named)
- Svelte 5 rune usage examples
- How to add new shadcn components
- Troubleshooting common issues

**Task:** Create quick reference guide

---

## 📋 Task Checklist

### Phase 1: Critical Fixes (30 min)
- [ ] 1.1 Fix app.css @theme/@media syntax
- [ ] 1.2 Test dark mode still works
- [ ] 1.3 Remove Skeleton UI from package.json
- [ ] 1.4 Run `bun install` to clean up

### Phase 2: Code Audit (1 hour)
- [ ] 2.1 Audit button.svelte (Svelte 5 patterns)
- [ ] 2.2 Audit card.svelte
- [ ] 2.3 Audit badge.svelte
- [ ] 2.4 Check all imports across pages
- [ ] 2.5 Standardize import patterns

### Phase 3: Documentation (30 min)
- [ ] 3.1 Create COMPONENT_GUIDE.md
- [ ] 3.2 Update FR-016-main.md (mark as complete)
- [ ] 3.3 Update FR-016-status.md (100% complete)
- [ ] 3.4 Write FR-016-retro.md

### Phase 4: Validation (30 min)
- [ ] 4.1 Visual check: All pages render correctly
- [ ] 4.2 Test dark mode toggle
- [ ] 4.3 Test all button variants
- [ ] 4.4 Frontend build passes (`bun run build`)
- [ ] 4.5 No linter errors (`bun run lint`)

---

## 🎓 Lessons Learned

### What We Learned About Skeleton UI v4
- ❌ v4 is a **complete rewrite** with breaking API changes
- ❌ Documentation is sparse/missing for v4
- ❌ Components didn't work out-of-box
- ✅ Utility classes worked, but that's just Tailwind

### Why shadcn-svelte Was the Right Choice
- ✅ **Comprehensive documentation** for Svelte 5
- ✅ **Copy-paste examples work** immediately
- ✅ **You own the code** - can debug and fix
- ✅ **AI-friendly** - open source, predictable
- ✅ **Active community** - issues get answered

### Decision-Making Framework
**When evaluating UI libraries:**
1. Check **actual documentation quality** (not just "has docs")
2. Test **component rendering** before committing
3. Verify **import/export patterns** work
4. Prefer **code ownership** over npm packages for UI
5. **Try before you standardize** - don't trust marketing

---

## 🔗 Related Documents

- [FR-016 Main](./FR-016-main.md) - Feature request
- [FR-016 Implementation Notes](./FR-016-implementation-notes.md) - Why Skeleton failed
- [FR-016 shadcn Implementation](./FR-016-shadcn-implementation.md) - Current system
- [FR-018 Retro](../../FR-018-monorepo-harness-evaluation/FR-018-retro.md) - Where bugs were found

---

## 🚀 Next Steps After Cleanup

1. **Add more shadcn components as needed:**
   ```bash
   bunx shadcn-svelte@latest add dialog alert-dialog toast input
   ```

2. **Customize theme in app.css:**
   - Adjust color tokens to match brand
   - Add custom variants to components

3. **Build component library:**
   - Create higher-level composite components
   - Document patterns for team

---

**Created:** 2025-11-07  
**Owner:** Claude (Cursor AI)  
**Estimated Time:** 2.5 hours total

