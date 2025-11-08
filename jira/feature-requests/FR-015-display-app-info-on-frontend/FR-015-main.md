# FR-015: Display App Info on Frontend

**Status:** 📋 Todo  
**Priority:** P2 (Medium)  
**Milestone:** M7 - App Metadata & Discovery  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description

Create a `/app-info` route on the SvelteKit frontend that displays Google Play Store metadata for a configured Android application. The package name is loaded from environment variables, and app data is fetched from the backend `appinfo` service via Encore generated client.

**Business Value:**
- Provides visual verification that app metadata ingestion works correctly
- Serves as foundation for app discovery and app catalog features
- Demonstrates end-to-end integration of backend service → frontend UI

**User Impact:**
- Developers can see app information (title, icon, rating, screenshots) in browser
- Quick verification that Play Store data is being fetched correctly
- Foundation for future app browsing/selection UI

---

## 🎯 Acceptance Criteria
- [ ] Environment variable `VITE_DEFAULT_APP_PACKAGE` defined in frontend `.env`
- [ ] SvelteKit route created at `frontend/src/routes/app-info/+page.svelte`
- [ ] Page loads app metadata using Encore client: `appinfo.getAppInfo({ packageName })`
- [ ] UI displays: app icon, title, developer, rating, category, install count
- [ ] Screenshots rendered in horizontal scrollable gallery
- [ ] Loading state shown while fetching data
- [ ] Error state shown if app not found or fetch fails
- [ ] Tailwind CSS + Skeleton UI styling applied
- [ ] Page is responsive (mobile and desktop)
- [ ] Manual testing with com.pinterest confirms all data displays correctly

---

## 🔗 Dependencies

**Prerequisite FRs:**
- FR-014: Fetch and Store Play Store App Data (MUST be completed)

**Backend Service:**
- `appinfo` service running on backend
- Encore client generation: `cd frontend && bun run gen`

**Frontend Libraries:**
- Encore client (generated)
- Skeleton UI components
- Lucide icons (for fallback icon)

---

## 🧪 Testing Requirements

**Manual Testing:**
- [ ] Visit http://localhost:5173/app-info with VITE_DEFAULT_APP_PACKAGE=com.pinterest
- [ ] Verify Pinterest icon, title, and rating display
- [ ] Verify screenshots gallery is scrollable and shows all images
- [ ] Test with com.spotify.music as well
- [ ] Test error handling by setting invalid package name
- [ ] Test loading state by throttling network in DevTools

**Browser Testing:**
- [ ] Desktop Chrome (1920x1080)
- [ ] Mobile viewport (375x667)
- [ ] Verify responsive layout works on both

---

## 📋 Technical Notes

### Route Structure

```
frontend/src/routes/app-info/
└── +page.svelte
```

### Environment Variable (`frontend/.env`)

```bash
# Default app package to display on /app-info route
VITE_DEFAULT_APP_PACKAGE=com.pinterest
```

### Load Function (`+page.ts` - optional)

```typescript
import { appinfo } from '$lib/encore-client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  const packageName = import.meta.env.VITE_DEFAULT_APP_PACKAGE || 'com.pinterest';
  
  try {
    const response = await appinfo.getAppInfo({ packageName });
    return {
      appInfo: response.appInfo,
      packageName
    };
  } catch (err) {
    return {
      error: 'Failed to load app info',
      packageName
    };
  }
};
```

### Page Component (`+page.svelte`)

```svelte
<script lang="ts">
  import { Download, Star, Users } from 'lucide-svelte';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  const appInfo = data.appInfo;
  const error = data.error;
</script>

{#if error}
  <div class="card variant-filled-error p-4 m-8">
    <p>{error}</p>
  </div>
{:else if appInfo}
  <div class="container mx-auto p-8 max-w-4xl">
    <!-- Header -->
    <div class="card p-6 mb-6">
      <div class="flex items-start gap-4">
        {#if appInfo.iconUrl}
          <img src={appInfo.iconUrl} alt={appInfo.displayName} class="w-24 h-24 rounded-2xl" />
        {:else}
          <div class="w-24 h-24 rounded-2xl bg-surface-600 flex items-center justify-center">
            <Download class="w-12 h-12 text-surface-400" />
          </div>
        {/if}
        
        <div class="flex-1">
          <h1 class="h2">{appInfo.displayName}</h1>
          <p class="text-surface-600 dark:text-surface-400">{appInfo.developerName}</p>
          
          <div class="flex gap-4 mt-2">
            {#if appInfo.ratingScore}
              <div class="flex items-center gap-1">
                <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span class="font-medium">{appInfo.ratingScore}</span>
              </div>
            {/if}
            
            {#if appInfo.installsLabel}
              <div class="flex items-center gap-1">
                <Users class="w-4 h-4" />
                <span>{appInfo.installsLabel}</span>
              </div>
            {/if}
            
            <div class="chip variant-soft">{appInfo.primaryCategory}</div>
          </div>
        </div>
      </div>
      
      {#if appInfo.shortDescription}
        <p class="mt-4 text-surface-700 dark:text-surface-300">{appInfo.shortDescription}</p>
      {/if}
    </div>
    
    <!-- Screenshots -->
    {#if appInfo.media && appInfo.media.length > 0}
      <div class="card p-6">
        <h2 class="h3 mb-4">Screenshots</h2>
        <div class="flex gap-4 overflow-x-auto pb-4">
          {#each appInfo.media.filter(m => m.kind === 'phone_screenshot') as screenshot}
            <img 
              src={screenshot.assetUrl} 
              alt="Screenshot {screenshot.position + 1}"
              class="h-96 rounded-lg shadow-lg flex-shrink-0"
            />
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="card variant-ghost p-4 m-8">
    <p>Loading...</p>
  </div>
{/if}
```

### Type Safety

After backend changes, regenerate client:

```bash
cd frontend
bun run gen
```

This generates typed client in `src/lib/encore-client.ts` with:
```typescript
export const appinfo = {
  getAppInfo: (req: { packageName: string }) => Promise<GetAppInfoResponse>
};
```

---

## 🏷️ Labels
`[frontend]`, `[ui]`, `[sveltekit]`, `[milestone-7]`, `[p2]`

---

## 📚 Related Documents
- FR-014: Fetch and Store Play Store App Data
- `frontend/FRONTEND_HANDOFF.md`
- `.cursor/rules/frontend_engineer.mdc`
- `.cursor/rules/frontend_llm_instruction.mdc`
- Skeleton UI Docs: https://skeleton.dev

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
