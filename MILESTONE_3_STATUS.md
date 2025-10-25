# Milestone 3: SvelteKit Frontend Migration Status

**Started:** 2025-01-16  
**Target:** SvelteKit frontend deployed on Vercel  
**Status:** 🟡 In Progress (Structure Created, Needs Testing)

**Note:** Basic SvelteKit structure created. Core pages migrated but needs testing and refinement.

---

## Completed Work ✅

### Core Setup
- ✅ Installed SvelteKit and Vercel adapter
- ✅ Created `svelte.config.js` and `vite.config.ts`
- ✅ Setup project structure (`src/routes/`, `src/lib/`)
- ✅ Created API client (`src/lib/api.ts`)
- ✅ Configured Tailwind CSS

### Pages Migrated
- ✅ StartRun page (`src/routes/+page.svelte`)
- ✅ RunTimeline page (`src/routes/run/[id]/+page.svelte`)
- ✅ SteeringWheel placeholder (`src/routes/steering/+page.svelte`)

### Configuration
- ✅ Vercel config (`vercel.json`)
- ✅ TypeScript config
- ✅ Build scripts updated

### Remaining Work ⏳
- ⏳ Test SvelteKit dev server
- ⏳ Verify API integration
- ⏳ Test WebSocket streaming
- ⏳ Deploy to Vercel
- ⏳ Environment variables setup

---

## Overview

Migrating the React frontend to SvelteKit for better integration with Vercel, improved performance, and modern DX. This milestone covers the entire frontend migration and deployment setup.

---

## Current State Analysis

### Current Tech Stack
- **Framework:** React 18.3.1
- **Router:** Hash-based routing (`window.location.hash`)
- **Build Tool:** Vite 4.5.14
- **Styling:** Tailwind CSS 3.4.18
- **Backend:** Encore Cloud (`steering-wheel-documentation-65b2.encr.app`)

### Current Pages
1. **StartRun** (`frontend/pages/StartRun.tsx`) - Start new agent run
2. **RunTimeline** (`frontend/pages/RunTimeline.tsx`) - View run events
3. **SteeringWheel** (`frontend/pages/SteeringWheel.tsx`) - Documentation management

### Current Components
- Event blocks
- Documentation editor/nav/viewer
- UI components (button, card, input, toast, etc.)

---

## Migration Strategy

### Option A: Full SvelteKit Migration (Recommended)
- Convert all React components to Svelte
- Use SvelteKit file-based routing
- Leverage SvelteKit SSR/hydration
- Better performance, smaller bundle

### Option B: Hybrid Approach
- Keep React components, wrap in Svelte
- Gradual migration
- More work upfront

**Decision:** Option A - Full migration for cleaner architecture

---

## Tasks Checklist

### 1. SvelteKit Setup 🔴 Critical

#### 1.1 Initialize SvelteKit Project
- [ ] Create new SvelteKit app structure
- [ ] Configure `svelte.config.js`
- [ ] Setup Vite integration
- [ ] Add TypeScript support

#### 1.2 Install Dependencies
- [ ] Install SvelteKit core dependencies
- [ ] Add Tailwind CSS for SvelteKit
- [ ] Add UI component library (similar to current)
- [ ] Add WebSocket client library

**Target Dependencies:**
```json
{
  "@sveltejs/adapter-vercel": "^4.0.0",
  "@sveltejs/kit": "^2.0.0",
  "svelte": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.0"
}
```

---

### 2. Component Migration 📝 Not Started

#### 2.1 Migrate UI Components
- [ ] Convert `components/ui/button.tsx` → Svelte
- [ ] Convert `components/ui/card.tsx` → Svelte
- [ ] Convert `components/ui/input.tsx` → Svelte
- [ ] Convert `components/ui/toast.tsx` → Svelte
- [ ] Convert other UI components

#### 2.2 Migrate Feature Components
- [ ] Convert `components/run/EventBlock.tsx` → Svelte
- [ ] Convert `components/steering/*` → Svelte

#### 2.3 Migrate Pages
- [ ] Convert `pages/StartRun.tsx` → SvelteKit route
- [ ] Convert `pages/RunTimeline.tsx` → SvelteKit route
- [ ] Convert `pages/SteeringWheel.tsx` → SvelteKit route

---

### 3. API Integration 🔴 Critical

#### 3.1 Create API Client
- [ ] Create SvelteKit API utilities
- [ ] Implement REST API calls
- [ ] Implement WebSocket client
- [ ] Add error handling

**Client Pattern:**
```typescript
// src/lib/api.ts
const API_BASE = import.meta.env.PUBLIC_API_BASE;
const WS_BASE = import.meta.env.PUBLIC_API_BASE.replace(/^http/, 'ws');

export async function startRun(request: StartRunRequest) {
  const response = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return response.json();
}

export function streamRunEvents(runId: string, onEvent: (event: RunEvent) => void) {
  const ws = new WebSocket(`${WS_BASE}/run/${runId}/stream`);
  ws.onmessage = (e) => onEvent(JSON.parse(e.data));
  return ws;
}
```

#### 3.2 Add Environment Configuration
- [ ] Create `.env.example`
- [ ] Configure Vercel environment variables
- [ ] Setup local development env

**Environment Variables:**
```bash
PUBLIC_API_BASE=https://steering-wheel-documentation-65b2.encr.app
PUBLIC_WS_BASE=wss://steering-wheel-documentation-65b2.encr.app
```

---

### 4. Routing Migration 🔴 Critical

#### 4.1 Setup SvelteKit Routes
- [ ] Create `src/routes/+page.svelte` (StartRun)
- [ ] Create `src/routes/run/[id]/+page.svelte` (RunTimeline)
- [ ] Create `src/routes/steering/+page.svelte` (SteeringWheel)

#### 4.2 Implement Navigation
- [ ] Update all internal links
- [ ] Add programmatic navigation
- [ ] Handle redirects

**Route Structure:**
```
src/routes/
├── +page.svelte (StartRun)
├── run/
│   └── [id]/
│       └── +page.svelte (RunTimeline)
└── steering/
    └── +page.svelte (SteeringWheel)
```

---

### 5. Styling Migration 📊 Not Started

#### 5.1 Migrate Tailwind CSS
- [ ] Copy Tailwind config
- [ ] Migrate CSS styles
- [ ] Update component classes

#### 5.2 Dark Mode Support
- [ ] Implement dark mode toggle
- [ ] Add theme persistence

---

### 6. Build & Deploy Configuration 🔴 Critical

#### 6.1 Vercel Configuration
- [ ] Create `vercel.json` configuration
- [ ] Set build command
- [ ] Configure output directory
- [ ] Setup environment variables

**vercel.json:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".svelte-kit",
  "framework": "sveltekit"
}
```

#### 6.2 Build Optimization
- [ ] Configure production build
- [ ] Optimize bundle size
- [ ] Add compression

---

### 7. Testing 🧪 Not Started

#### 7.1 Local Testing
- [ ] Test all pages render correctly
- [ ] Test API calls work
- [ ] Test WebSocket streaming
- [ ] Test navigation

#### 7.2 Deployment Testing
- [ ] Deploy to Vercel preview
- [ ] Test in production environment
- [ ] Verify CORS works
- [ ] Test WebSocket over HTTPS

---

## File Structure Planning

### Current Structure
```
frontend/
├── pages/
├── components/
├── lib/
└── App.tsx
```

### Target SvelteKit Structure
```
frontend/
├── src/
│   ├── routes/
│   │   ├── +page.svelte
│   │   ├── run/
│   │   │   └── [id]/
│   │   │       └── +page.svelte
│   │   └── steering/
│   │       └── +page.svelte
│   ├── lib/
│   │   ├── components/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── app.html
├── static/
├── svelte.config.js
├── tailwind.config.js
└── package.json
```

---

## Implementation Order

1. **Setup SvelteKit** - Get basic app running
2. **Migrate one page** - StartRun (simplest)
3. **Migrate API client** - REST calls
4. **Migrate WebSocket** - Event streaming
5. **Migrate remaining pages** - RunTimeline, SteeringWheel
6. **Polish & Deploy** - Testing, optimization

---

## Success Criteria

- [ ] SvelteKit app runs locally
- [ ] All pages migrated and working
- [ ] API integration functional
- [ ] WebSocket streaming works
- [ ] Deployed to Vercel
- [ ] Production environment variables configured
- [ ] CORS working correctly

---

## Rollback Plan

If migration fails:
1. Keep current React app
2. Document issues encountered
3. Consider hybrid approach
4. Re-evaluate timeline

---

**Next Steps:** Initialize SvelteKit project structure and start migration.
