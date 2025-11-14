# ScreenGraph Frontend Stack Recommendation

**Date:** 2025-11-07  
**Based on:** Context7 latest documentation, Svelte 5, SvelteKit 2, Tailwind v4  
**Goal:** Deterministic, fast, rapid development with smaller codebase and easy e2e testing

---

## 🎯 **RECOMMENDED STACK**

```
┌─────────────────────────────────────────────────────┐
│  Core Framework                                      │
│  ├─ SvelteKit 2.0+ ✅ (Already using)              │
│  └─ Svelte 5.0+ ✅ (Already using)                 │
├─────────────────────────────────────────────────────┤
│  Styling & Design System                            │
│  ├─ Tailwind CSS 4.0 ✅ (Already using)            │
│  ├─ Bits UI 2.14+ ✅ (Headless components)         │
│  └─ shadcn-svelte ✅ (Component patterns)          │
├─────────────────────────────────────────────────────┤
│  Forms & Validation                                  │
│  ├─ SvelteKit Superforms v2.27+ 🆕                  │
│  ├─ Zod v3.24+ 🆕                                    │
│  └─ Formsnap 🆕 (Accessible form components)        │
├─────────────────────────────────────────────────────┤
│  Icons & Animation                                   │
│  ├─ lucide-svelte ✅ (Already using)               │
│  └─ AutoAnimate ✅ (Already using)                 │
├─────────────────────────────────────────────────────┤
│  Type Safety & Utils                                 │
│  ├─ TypeScript 5.9+ ✅                             │
│  ├─ clsx ✅ (Conditional classes)                  │
│  └─ tailwind-merge ✅ (Class merging)              │
├─────────────────────────────────────────────────────┤
│  Testing (Future)                                    │
│  ├─ Vitest (Unit tests)                             │
│  ├─ Playwright (e2e tests)                          │
│  └─ @testing-library/svelte (Component tests)       │
├─────────────────────────────────────────────────────┤
│  Dev Tools                                           │
│  ├─ Vite 6.0+ ✅                                    │
│  ├─ Biome ✅ (Linting/Formatting)                  │
│  └─ svelte-check ✅ (Type checking)                │
└─────────────────────────────────────────────────────┘
```

---

## 📋 **DETAILED BREAKDOWN**

### 1. **Core Framework** (KEEP AS-IS ✅)

#### **SvelteKit 2.0+** 
**Why:** Full-stack framework, SSR/SSG, file-based routing, type-safe

```typescript
// Load functions provide type-safe data loading
export async function load({ fetch }) {
  const runs = await fetch('/api/runs').then(r => r.json());
  return { runs };
}
```

#### **Svelte 5**
**Why:** Modern reactivity with runes, better performance, smaller bundles

```svelte
<script lang="ts">
  // Modern Svelte 5 runes
  let count = $state(0);
  let doubled = $derived(count * 2);
  
  $effect(() => {
    console.log(`Count is: ${count}`);
  });
</script>
```

**Versions:**
- `@sveltejs/kit@^2.0.0` ✅
- `svelte@^5.0.0` ✅

---

### 2. **Styling & Design System** (CURRENT + CLEANUP)

#### **Tailwind CSS 4.0** ✅
**Why:** Utility-first, minimal CSS, @theme directive for design tokens

**Current State:** ✅ Installed but needs @theme fix

```css
@import "tailwindcss";

@theme {
  --color-primary: 222.2 47.4% 11.2%;
  --color-background: 0 0% 100%;
  /* All design tokens here */
}

/* Dark mode AFTER @theme block */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-primary: 210 40% 98%;
    --color-background: 222.2 84% 4.9%;
  }
}
```

**Versions:**
- `tailwindcss@^4.0.0` ✅
- `@tailwindcss/vite@^4.0.0` ✅

#### **Bits UI 2.14+** ✅
**Why:** Headless components, accessibility-first, full styling control

**Current State:** ✅ Installed as shadcn dependency

**Usage:**
```svelte
<script>
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Why NOT Skeleton UI v4:**
- ❌ API completely different from v2
- ❌ Poor/missing documentation
- ❌ Components didn't render correctly
- ❌ Complex Zag.js architecture
- ✅ Your team already tried and it failed (see FR-016-implementation-notes.md)

**Versions:**
- `bits-ui@^2.14.2` ✅

#### **shadcn-svelte** ✅
**Why:** Pre-built component patterns, copy-paste approach, you own the code

**Current State:** ✅ Working, needs cleanup

**Keep:**
- Component patterns in `$lib/components/ui/`
- Copy-paste workflow from shadcn-svelte.com
- Tailwind-based styling

**Action Items:**
1. Fix @theme/@media syntax in app.css
2. Remove unused Skeleton UI package
3. Audit components for Svelte 5 compatibility

---

### 3. **Forms & Validation** (ADD 🆕)

#### **SvelteKit Superforms v2.27+** 🆕
**Why:** Best-in-class form handling for SvelteKit, type-safe, server+client validation

**From Context7 (Trust Score: 9.6):**

```svelte
<!--- +page.server.ts --->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { z } from 'zod';

  const schema = z.object({
    appId: z.string().min(1),
    deviceId: z.string().uuid(),
    policy: z.enum(['breadth', 'depth']).default('breadth')
  });

  export async function load({ fetch }) {
    const form = await superForm(data, {
      validators: zod(schema)
    });
    return { form };
  }
</script>

<!--- +page.svelte --->
<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  
  let { data } = $props();
  const { form, errors, enhance } = superForm(data.form);
</script>

<form method="POST" use:enhance>
  <input name="appId" bind:value={$form.appId} />
  {#if $errors.appId}<span class="error">{$errors.appId}</span>{/if}
  
  <button type="submit">Start Run</button>
</form>
```

**Benefits:**
- ✅ **Type-safe** - Full TypeScript inference
- ✅ **Server+Client validation** - Validate once, run everywhere
- ✅ **Progressive enhancement** - Works without JS
- ✅ **Auto-serialization** - Dates, Files handled automatically
- ✅ **Nested objects/arrays** - Complex forms supported

**Versions:**
- `sveltekit-superforms@^2.27.0` 🆕

#### **Zod v3.24+** 🆕
**Why:** TypeScript-first validation, static type inference, composable schemas

**From Context7 (Trust Score: 9.6):**

```typescript
import { z } from 'zod';

// Define schema
const runConfigSchema = z.object({
  appId: z.string().min(1, 'App ID required'),
  deviceId: z.string().uuid('Invalid device ID'),
  policy: z.enum(['breadth', 'depth']).default('breadth'),
  maxScreens: z.number().int().positive().optional(),
  timeout: z.number().int().positive().default(300)
});

// Type inference
type RunConfig = z.infer<typeof runConfigSchema>;

// Validation
const result = runConfigSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed!
} else {
  console.error(result.error.issues);
}
```

**Benefits:**
- ✅ **Static type inference** - TypeScript types from schemas
- ✅ **Composable** - Build complex schemas from simple ones
- ✅ **Great error messages** - Clear validation errors
- ✅ **Zero dependencies** - Tiny bundle size

**Versions:**
- `zod@^3.24.2` 🆕

#### **Formsnap** 🆕
**Why:** Accessible form components for Superforms, reduces boilerplate

**From Context7 (Trust Score: 7.4):**

```svelte
<script lang="ts">
  import { Form, Field, Control, Label, FieldErrors } from "formsnap";
  import { superForm } from "sveltekit-superforms";
  
  let { data } = $props();
  const form = superForm(data.form);
</script>

<Form.Root {form} let:config>
  <Field {config} name="appId">
    <Label>App ID</Label>
    <Control let:attrs>
      <input {...attrs} bind:value={$formData.appId} />
    </Control>
    <FieldErrors />
  </Field>
  
  <button type="submit">Submit</button>
</Form.Root>
```

**Benefits:**
- ✅ **Accessible by default** - ARIA attributes handled
- ✅ **Less boilerplate** - Cleaner form code
- ✅ **Works with Superforms** - Designed for integration

**Versions:**
- `formsnap@^1.0.0` 🆕

---

### 4. **Icons & Animation** (KEEP AS-IS ✅)

#### **lucide-svelte** ✅
**Why:** Beautiful icons, tree-shakeable, Svelte-optimized

```svelte
<script>
  import { Play, Pause, Download } from 'lucide-svelte';
</script>

<Play class="w-6 h-6" />
```

**Versions:**
- `lucide-svelte@^0.425.0` ✅

#### **AutoAnimate** ✅
**Why:** Zero-config animations for lists, modals, etc.

```svelte
<script>
  import { autoAnimate } from '@formkit/auto-animate';
</script>

<ul use:autoAnimate>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>
```

**Versions:**
- `@formkit/auto-animate@^0.8.2` ✅

---

### 5. **Type Safety & Utils** (KEEP AS-IS ✅)

#### **TypeScript 5.9+** ✅
**Why:** Type safety, better DX, catch errors early

#### **clsx** ✅
**Why:** Conditional class names

```typescript
import { clsx } from 'clsx';

const className = clsx('btn', {
  'btn-primary': isPrimary,
  'btn-large': isLarge
});
```

#### **tailwind-merge** ✅
**Why:** Merge Tailwind classes correctly (handles conflicts)

```typescript
import { cn } from '$lib/utils';

// cn = clsx + tailwind-merge
const className = cn('px-4 py-2', 'px-6'); // → "px-6 py-2"
```

**Versions:**
- `typescript@^5.9.3` ✅
- `clsx@^2.1.1` ✅
- `tailwind-merge@^3.3.1` ✅

---

### 6. **Testing** (FUTURE 🔮)

#### **Vitest** 
**Why:** Fast, Vite-native, Jest-compatible API

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button', () => {
  it('renders with text', () => {
    const { getByText } = render(Button, { props: { children: 'Click me' } });
    expect(getByText('Click me')).toBeInTheDocument();
  });
});
```

#### **Playwright**
**Why:** Reliable e2e tests, cross-browser, great DX

```typescript
import { test, expect } from '@playwright/test';

test('start run flow', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="start-run-btn"]');
  await page.fill('[name="appId"]', 'com.example.app');
  await page.click('button[type="submit"]');
  await expect(page.locator('.run-status')).toContainText('Active');
});
```

**Versions (when ready):**
- `vitest@latest`
- `@playwright/test@latest`
- `@testing-library/svelte@latest`

---

### 7. **Dev Tools** (KEEP AS-IS ✅)

#### **Vite 6.0+** ✅
**Why:** Fast HMR, modern build tool, Svelte-optimized

#### **Biome** ✅
**Why:** Fast linter+formatter, Rust-based, replaces ESLint+Prettier

#### **svelte-check** ✅
**Why:** Type checking for Svelte components

**Versions:**
- `vite@^6.0.0` ✅
- `@biomejs/biome@1.9.2` ✅
- `svelte-check@^4.0.0` ✅

---

## 📦 **PACKAGE.JSON CHANGES**

### Remove
```json
{
  "dependencies": {
    "@skeletonlabs/skeleton": "^4.2.4"  // ❌ REMOVE
  }
}
```

### Add
```json
{
  "dependencies": {
    "zod": "^3.24.2",  // 🆕 Validation
    "sveltekit-superforms": "^2.27.0",  // 🆕 Forms
    "formsnap": "^1.0.0"  // 🆕 Form components
  }
}
```

### Keep Everything Else
```json
{
  "dependencies": {
    "@formkit/auto-animate": "^0.8.2",
    "clsx": "^2.1.1",
    "envalid": "^8.1.1",
    "lucide-svelte": "^0.425.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.2",
    "@sveltejs/adapter-vercel": "^4.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^24.9.1",
    "bits-ui": "^2.14.2",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tailwind-variants": "^3.1.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.9.3",
    "vite": "^6.0.0"
  }
}
```

---

## 🎯 **WHY THIS STACK**

### Against Your Criteria

| Criteria | Score | Reasoning |
|----------|-------|-----------|
| **Smaller Codebase** | ✅✅ | Headless components (Bits UI) + utility CSS (Tailwind) = minimal code |
| **Visible Design System** | ✅✅ | shadcn patterns + Tailwind tokens = clear system |
| **Easy e2e Tests** | ✅✅ | Consistent DOM (Bits UI), predictable structure (shadcn) |
| **Fast Deterministic Dev** | ✅✅ | Superforms = instant forms, shadcn = copy-paste components |
| **Type Safety** | ✅✅ | TypeScript + Zod + Superforms = end-to-end types |

### Bundle Size Impact

**Estimated additions:**
- Zod: ~14KB gzipped
- Superforms: ~8KB gzipped
- Formsnap: ~3KB gzipped

**Estimated savings from removing Skeleton:**
- Skeleton UI: ~50KB gzipped (unused)

**Net impact:** ~-25KB gzipped 🎉

---

## 🚀 **IMPLEMENTATION PLAN**

### Phase 1: Cleanup (30 min)
1. Fix `app.css` @theme/@media syntax
2. Remove Skeleton UI from package.json
3. Audit shadcn components for Svelte 5 compatibility
4. Run `bun install`

### Phase 2: Add Forms Stack (1 hour)
1. Install Zod, Superforms, Formsnap
2. Create form schema for "Start Run" form
3. Migrate existing form to Superforms
4. Document patterns

### Phase 3: Documentation (30 min)
1. Update FR-016 to mark as complete
2. Create component usage guide
3. Document form patterns
4. Update CLAUDE.md with stack decisions

---

## 📚 **LEARNING RESOURCES**

### Official Docs
- **SvelteKit:** https://svelte.dev/docs/kit
- **Svelte 5:** https://svelte.dev/docs/svelte
- **Tailwind v4:** https://tailwindcss.com/docs/v4-beta
- **Bits UI:** https://bits-ui.com
- **shadcn-svelte:** https://shadcn-svelte.com
- **Superforms:** https://superforms.rocks
- **Zod:** https://zod.dev

### Code Examples
All patterns documented in Context7:
- Bits UI: 1,294 code snippets
- Superforms: 247 code snippets
- Zod: 3,778 code snippets

---

## 🎓 **DECISION RATIONALE**

### Why NOT Other Options

#### **Skeleton UI v4** ❌
- You already tried it
- Components didn't work
- Poor documentation
- Complex API (Zag.js)
- See FR-016-implementation-notes.md for details

#### **DaisyUI** ❌
- Opinionated styles = less control
- Not as composable as Bits UI
- Larger bundle size

#### **Material UI / Chakra UI** ❌
- Not Svelte-native
- React-first design
- Heavy bundles

#### **Custom Everything** ❌
- Slow development
- Need to build accessibility
- Reinventing the wheel

### Why THIS Stack ✅

**Bits UI + shadcn + Tailwind v4:**
- ✅ **Headless primitives** - Full control over styling
- ✅ **Accessibility built-in** - WCAG compliant
- ✅ **Small bundle size** - Tree-shakeable
- ✅ **Great DX** - Type-safe, predictable
- ✅ **Active community** - Issues get answered
- ✅ **Proven** - Used by thousands of projects

**Superforms + Zod:**
- ✅ **Best-in-class** - Nothing better for SvelteKit forms
- ✅ **Type-safe end-to-end** - Schema → types → validation
- ✅ **Progressive enhancement** - Works without JS
- ✅ **Minimal boilerplate** - Fast to write forms

**This stack achieves:**
1. ✅ Smaller codebase (headless + utility CSS)
2. ✅ Visible design system (Tailwind tokens + shadcn patterns)
3. ✅ Easy e2e tests (predictable DOM)
4. ✅ Deterministic fast dev (copy-paste + Superforms)

---

## ✅ **FINAL RECOMMENDATION**

**KEEP:**
- SvelteKit 2 + Svelte 5 (core framework)
- Tailwind v4 (styling)
- Bits UI (headless components)
- shadcn-svelte (component patterns)
- lucide-svelte (icons)
- AutoAnimate (animations)
- TypeScript + clsx + tailwind-merge (utils)

**REMOVE:**
- Skeleton UI v4 (failed integration, unused)

**ADD:**
- Zod (validation)
- SvelteKit Superforms (forms)
- Formsnap (form components)

**RESULT:**
- ✅ Smaller codebase
- ✅ Better DX
- ✅ Faster development
- ✅ Type-safe end-to-end
- ✅ Production-ready

---

**Created:** 2025-11-07  
**Status:** Ready for Implementation  
**Next Step:** Execute Phase 1 cleanup

