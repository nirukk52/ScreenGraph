# Frontend Split Strategy

## Current Situation

We attempted to migrate React → SvelteKit in the same directory, causing conflicts.

## Solution: Clean SvelteKit Setup

### Option 1: Fresh SvelteKit Setup (Recommended)

Create a clean SvelteKit app:

```bash
# Outside current frontend directory
cd ..
npx sv create screengraph-frontend
cd screengraph-frontend

# Copy API client
cp ../ScreenGraph/frontend/src/lib/api.ts src/lib/

# Copy pages one by one
# Start with simplest: StartRun
```

### Option 2: Keep React, Deploy Now

The React app is fully functional. Deploy it:

```bash
cd frontend
npm i -g vercel
vercel
```

### Option 3: Separate Repos

Create separate repositories:
- `screengraph-backend` (Encore)
- `screengraph-frontend-react` (current React)
- `screengraph-frontend-sveltekit` (future SvelteKit)

---

## Recommendation

**Deploy React now** (15 minutes to production)  
**Then migrate to SvelteKit properly** (clean repo, separate directory)

---

**Status:** Migration paused - conflicts detected  
**Next:** Choose migration strategy above
