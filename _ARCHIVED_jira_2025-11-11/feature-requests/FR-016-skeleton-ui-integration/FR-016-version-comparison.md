# Skeleton UI Version Comparison & Updated Recommendation

**Date:** 2025-11-07  
**Context:** You tried Skeleton v4 (failed) → switched to shadcn-svelte  
**Discovery:** Skeleton v3 supports Svelte 5 and has working components!

---

## 📊 **VERSION COMPARISON**

### Skeleton v2 (@skeletonlabs/skeleton@2.x)
**From Context7: 461 snippets, Trust Score 7.5**

| Aspect | Details |
|--------|---------|
| **Svelte Version** | ❌ Svelte 4 only |
| **Components** | ✅ AppShell, AppBar, Modal, Toast, etc. |
| **API Style** | Traditional slots (`<svelte:fragment slot="header">`) |
| **Documentation** | ✅ Comprehensive (v2.skeleton.dev) |
| **Installation** | `npm i @skeletonlabs/skeleton@2.x` |
| **Status** | Stable, but legacy |

**Code Example (v2):**
```svelte
<!-- Skeleton v2 -->
<script lang="ts">
  import { AppShell, AppBar, Modal } from '@skeletonlabs/skeleton';
  import { RangeSlider } from '@skeletonlabs/skeleton';
  
  let value = 15;
</script>

<AppShell>
  <svelte:fragment slot="header">
    <AppBar>Navigation</AppBar>
  </svelte:fragment>
  
  <RangeSlider name="amount" bind:value ticked />
  
  <svelte:fragment slot="pageFooter">Footer</svelte:fragment>
</AppShell>

<Modal />
```

**Verdict:** ❌ **NOT RECOMMENDED** - Requires downgrading to Svelte 4

---

### Skeleton v3 (@skeletonlabs/skeleton-svelte@latest)
**From Context7: 636 snippets, versions 2.10.2, 2.11.0**

| Aspect | Details |
|--------|---------|
| **Svelte Version** | ✅ **Svelte 5 supported!** |
| **Components** | ✅ AppBar, Slider, Avatar, Tabs, Navigation, etc. |
| **API Style** | Svelte 5 runes (`$state`, `$derived`, event handlers) |
| **Documentation** | ✅ Good (skeleton.dev) |
| **Installation** | `npm i -D @skeletonlabs/skeleton @skeletonlabs/skeleton-svelte` |
| **Status** | **Stable production release** |
| **Tailwind v4** | ✅ Compatible |

**Code Example (v3):**
```svelte
<!-- Skeleton v3 -->
<script lang="ts">
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  
  // ✅ Uses Svelte 5 $state rune
  let value = $state([15]);
</script>

<Slider 
  name="amount" 
  {value} 
  onValueChange={(e) => (value = e.value)} 
  markers={[25, 50, 75]} 
/>
```

**Key Differences from v2:**
- `RangeSlider` → `Slider`
- `bind:value` → `{value}` + `onValueChange` callback
- Uses Svelte 5 runes throughout
- Import from `@skeletonlabs/skeleton-svelte` (not just `@skeletonlabs/skeleton`)

**Verdict:** ⚠️ **POTENTIALLY GOOD** - Need to verify component availability

---

### Skeleton v4 (@skeletonlabs/skeleton@4.x)
**What you tried and failed**

| Aspect | Details |
|--------|---------|
| **Svelte Version** | ✅ Svelte 5 |
| **Components** | ⚠️ Composed API (Avatar.Root, Avatar.Image, Avatar.Fallback) |
| **API Style** | Zag.js state machines, complex nested structure |
| **Documentation** | ❌ Sparse/incomplete |
| **Installation** | `npm i @skeletonlabs/skeleton@latest @skeletonlabs/skeleton-svelte@latest` |
| **Status** | ⚠️ Release Candidate - NOT production ready |

**Code Example (v4 RC):**
```svelte
<!-- Skeleton v4 RC -->
<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<!-- ⚠️ Complex composed pattern -->
<Avatar>
  <Avatar.Image src="https://i.pravatar.cc/150?img=48" alt="Jane Doe" />
  <Avatar.Fallback>SK</Avatar.Fallback>
</Avatar>
```

**Your Experience (FR-016-implementation-notes.md):**
- ❌ AppBar component not rendering
- ❌ No AppShell component
- ❌ Modal → Dialog with different API
- ❌ Poor documentation
- ❌ Zag.js complexity

**Verdict:** ❌ **DO NOT USE** - RC status, proven failures

---

## 🤔 **WHY YOU MISSED SKELETON v3**

Looking at your package.json:
```json
"@skeletonlabs/skeleton": "^4.2.4"
```

**You jumped straight to v4 (latest)!**

The issue:
1. You wanted Svelte 5 support ✅
2. You ran `npm install @skeletonlabs/skeleton@latest` 
3. This installed v4.2.4 (RC, unstable)
4. You should have tried v3 first!

---

## 📋 **UPDATED RECOMMENDATION**

### Option 1: **Stay with shadcn-svelte** ⭐ **RECOMMENDED**

**Status:** ✅ Already working, proven in your codebase

**Pros:**
- ✅ Already implemented
- ✅ Works with Svelte 5
- ✅ Tailwind v4 compatible (with fixes)
- ✅ You own the code
- ✅ Good documentation
- ✅ Copy-paste workflow proven

**Cons:**
- ⚠️ Larger codebase (copy-paste all components)
- ⚠️ Need to fix @theme/@media syntax
- ⚠️ Manual maintenance

**Time to stable:** 2-3 hours (cleanup current issues)

**Risk:** ⭐ Low - already working

---

### Option 2: **Try Skeleton v3** 🔄 **WORTH EXPLORING**

**Status:** 🆕 Not tried yet, but better than v4

**Pros:**
- ✅ Svelte 5 support confirmed
- ✅ Smaller codebase (package import)
- ✅ Stable production release
- ✅ Has components you need (AppBar, Navigation, etc.)
- ✅ Good documentation (better than v4)
- ✅ Tailwind v4 compatible

**Cons:**
- ❓ Need to verify component availability
- ❓ API different from v2 (but simpler than v4)
- ⚠️ Risk of hitting same issues as v4
- ⚠️ Requires migration from current shadcn setup

**Time to stable:** 4-6 hours (clean install + implementation)

**Risk:** ⭐⭐ Medium - unproven but promising

---

### Option 3: **Skeleton v2 + Svelte 4** ❌ **NOT RECOMMENDED**

**Status:** Would work but requires downgrade

**Pros:**
- ✅ Most stable Skeleton version
- ✅ Best documentation
- ✅ All components work

**Cons:**
- ❌ Requires downgrading Svelte 5 → 4
- ❌ Lose Svelte 5 runes
- ❌ Technical debt
- ❌ No future path

**Verdict:** ❌ Absolutely not worth it

---

## 🎯 **FINAL DECISION MATRIX**

### If you want **FASTEST path to stable:**
→ **Stay with shadcn-svelte** (Option 1)
- 2-3 hours to clean up current issues
- Already proven working
- Low risk

### If you want **SMALLER codebase + willing to try:**
→ **Experiment with Skeleton v3** (Option 2)
- 4-6 hours to implement clean
- Could be worth it
- Medium risk, but informed

### Hybrid Approach (Split the difference):
1. **Fix current shadcn issues** (2-3 hours) → Stable state
2. **Create Skeleton v3 POC** in parallel (2 hours)
3. **Compare side-by-side**
4. **Choose winner** based on actual experience

---

## 📝 **SKELETON V3 EVALUATION CHECKLIST**

If you decide to try Skeleton v3, verify these:

### Component Availability
- [ ] AppBar component exists and works
- [ ] Navigation component exists
- [ ] Modal/Dialog component exists
- [ ] Toast component exists
- [ ] Card/Container components exist

### API Compatibility
- [ ] Svelte 5 runes work ($state, $derived, $effect)
- [ ] Event handlers work (onValueChange, etc.)
- [ ] Tailwind v4 @theme works
- [ ] TypeScript types are correct

### Documentation Quality
- [ ] Installation guide is clear
- [ ] Component examples exist
- [ ] Migration from v2 documented
- [ ] Troubleshooting available

### Integration Test
- [ ] AppBar renders correctly
- [ ] Navigation links work
- [ ] Responsive behavior works
- [ ] Dark mode works
- [ ] Build succeeds

---

## 💡 **SKELETON V3 QUICK START**

If you want to try v3:

```bash
cd frontend

# Remove v4
bun remove @skeletonlabs/skeleton

# Install v3 (specific version to avoid v4)
bun add -D @skeletonlabs/skeleton@2.11.0 @skeletonlabs/skeleton-svelte
```

```css
/* app.css - Skeleton v3 */
@import "tailwindcss";

/* Import Skeleton AFTER Tailwind */
@import '@skeletonlabs/skeleton';
@import '@skeletonlabs/skeleton-svelte';
@import '@skeletonlabs/skeleton/themes/cerberus';

@theme {
  /* Your custom tokens */
}
```

```svelte
<!-- +layout.svelte - Test v3 AppBar -->
<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar>
  <svelte:fragment slot="lead">
    <a href="/">ScreenGraph</a>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <nav>
      <a href="/">Home</a>
      <a href="/app-info">App Info</a>
    </nav>
  </svelte:fragment>
</AppBar>

<slot />
```

**Test:** If AppBar renders correctly, v3 might work!

---

## 🔍 **WHY THE CONFUSION HAPPENED**

### Version Naming is Confusing

```
@skeletonlabs/skeleton@2.x  → Skeleton v2 (Svelte 4)
@skeletonlabs/skeleton@3.x  → Doesn't exist! ⚠️
@skeletonlabs/skeleton@4.x  → Skeleton v4 (RC, unstable)

@skeletonlabs/skeleton-svelte → Skeleton v3 (Stable, Svelte 5!)
```

**The gotcha:**
- Skeleton **v3** is NOT version `3.x` of the package!
- Skeleton **v3** is called `@skeletonlabs/skeleton-svelte`
- Package version `@skeletonlabs/skeleton@2.11.0` = Skeleton UI v3!

**This is why you jumped to v4 - natural to think @latest = best!**

---

## 📊 **UPDATED RECOMMENDATION SUMMARY**

| Option | Time | Risk | Codebase Size | Working? |
|--------|------|------|---------------|----------|
| **shadcn-svelte** | 2-3h | ⭐ Low | Large | ✅ Yes |
| **Skeleton v3** | 4-6h | ⭐⭐ Med | Small | ❓ Unknown |
| **Skeleton v4** | N/A | ⭐⭐⭐ High | Small | ❌ No |
| **Skeleton v2** | N/A | ⭐⭐ Med | Small | ❌ Svelte 4 |

---

## 🎯 **MY UPDATED RECOMMENDATION**

### Primary Path: **shadcn-svelte** ⭐
**Why:** Already working, proven, low risk

**Action Items:**
1. Fix @theme/@media syntax (30 min)
2. Remove Skeleton v4 package (5 min)
3. Audit components for Svelte 5 (1 hour)
4. Add Superforms + Zod (1 hour)
5. Document patterns (30 min)

**Total:** 2-3 hours → Stable, production-ready

### Secondary Exploration: **Skeleton v3 POC**
**Why:** Curiosity + potential smaller codebase

**Action Items:**
1. Create `feature/skeleton-v3-test` branch
2. Install Skeleton v3 (10 min)
3. Test AppBar, Navigation, Modal (2 hours)
4. Compare with shadcn-svelte
5. Make data-driven decision

**Total:** 2-3 hours → Answer the question "What if?"

---

## 🚀 **NEXT STEPS**

### Immediate (Now):
1. **Fix shadcn issues** - Get to stable state

### Optional (Later):
2. **Try Skeleton v3 POC** - Scientific experiment

### Don't Do:
- ❌ Try Skeleton v4 again (proven failure)
- ❌ Downgrade to Svelte 4 (wrong direction)
- ❌ Mix Skeleton v3 + shadcn (confusion)

---

**Bottom Line:** You have a **working solution** (shadcn) that needs cleanup. Skeleton v3 **exists** and **might** be better, but it's unproven. Choose based on risk tolerance and time available.

**My vote:** Fix shadcn first (stable), then optionally explore Skeleton v3 (curiosity).

---

**Created:** 2025-11-07  
**Status:** Analysis complete, decision in your hands  
**Key Insight:** Skeleton v3 exists and you never tried it!

