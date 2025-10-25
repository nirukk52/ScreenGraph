# Encore.ts Parity Implementation Plan

**Project:** ScreenGraph  
**Objective:** Achieve complete Encore.ts stack parity  
**Duration:** 2-3 days  
**Status:** Ready to Execute

---

## Overview

This document provides step-by-step instructions to migrate ScreenGraph to full Encore.ts compliance. Follow each phase sequentially and test after each step.

---

## Prerequisites

- ✅ Encore CLI installed (`encore version`)
- ✅ Access to Encore Cloud account
- ✅ Git repository backup
- ✅ All tests passing in current state

---

## Phase 1: Package Consolidation

### Step 1.1: Create Backup Branch

```bash
cd /Users/priyankalalge/ScreenGraph/Code/ScreenGraph
git checkout -b backup-pre-encore-parity
git push origin backup-pre-encore-parity
git checkout -b migrate-encore-parity
```

### Step 1.2: Audit Dependencies

**Current Backend Dependencies:**
```json
{
  "encore.dev": "^1.50.6",
  "ulidx": "^2.4.1"
}
```

**Current Frontend Dependencies:**
```json
{
  "@radix-ui/react-label": "^^2.1.2",
  "@radix-ui/react-slot": "^^1.2.3",
  "@radix-ui/react-toast": "^^1.2.14",
  "@tailwindcss/vite": "^^4.1.11",
  "class-variance-authority": "^^0.7.1",
  "clsx": "^^2.1.1",
  "encore.dev": "^1.50.6",
  "lucide-react": "^^0.484.0",
  "react": "^^19.1.0",
  "react-dom": "^^19.1.0",
  "react-markdown": "^^10.1.0",
  "remark-gfm": "^^4.0.1",
  "tailwind-merge": "^^3.2.0",
  "tailwindcss": "^^4.1.11"
}
```

### Step 1.3: Create Unified Root package.json

**Action:** Replace root `package.json` with:

```json
{
  "name": "screengraph",
  "version": "1.0.0",
  "type": "module",
  "packageManager": "bun",
  "scripts": {
    "dev": "encore run",
    "build": "cd frontend && vite build",
    "test": "vitest",
    "encore": "encore",
    "generate-client": "encore gen client --target leap --lang typescript"
  },
  "dependencies": {
    "encore.dev": "^1.50.6",
    "ulidx": "^2.4.1",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toast": "^1.2.14",
    "@tailwindcss/vite": "^4.1.11",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.484.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "tailwind-merge": "^3.2.0",
    "tailwindcss": "^4.1.11"
  },
  "devDependencies": {
    "@tailwindcss/oxide": "^4.1.11",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "lightningcss": "^1.29.2",
    "tw-animate-css": "^1.3.4",
    "typescript": "^5.8.3",
    "vite": "^6.2.5",
    "vitest": "^3.0.9"
  },
  "optionalDependencies": {
    "rollup": "^4.44.1"
  }
}
```

### Step 1.4: Update Root vite.config.ts

**Action:** Update root `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'frontend/dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/frontend/src',
    },
  },
});
```

### Step 1.5: Remove Separate package.json Files

```bash
rm backend/package.json
rm frontend/package.json
```

### Step 1.6: Install Dependencies

```bash
bun install
```

### Step 1.7: Verify Installation

```bash
encore version
bun run --version
```

**Checklist:**
- [ ] Single node_modules at root
- [ ] All dependencies installed
- [ ] No duplicate dependencies

---

## Phase 2: Restructure Frontend Service

### Step 2.1: Remove Duplicate Frontend Service

```bash
rm backend/frontend/encore.service.ts
rm -rf backend/frontend/dist
```

### Step 2.2: Update Root Frontend Service

**File:** `frontend/encore.service.ts`

```typescript
import { api } from "encore.dev/api";
import { Service } from "encore.dev/service";

export default new Service("frontend");

export const assets = api.static({
  path: "/frontend/*path",
  expose: true,
  dir: "./dist",
  notFound: "./dist/index.html",
  notFoundStatus: 200,
});
```

### Step 2.3: Update Frontend vite.config.ts

**File:** `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
  },
});
```

### Step 2.4: Update Build Process

**Action:** Now consistent with Encore's recommended approach

```bash
# Frontend builds to frontend/dist/
cd frontend && bun run build

# Backend serves from frontend/dist/
encore run
```

### Step 2.5: Test Frontend Build

```bash
cd frontend
bun run build
ls -la dist/
```

**Checklist:**
- [ ] Single frontend service definition
- [ ] Build outputs to correct location
- [ ] No duplicate service names

---

## Phase 3: Update Import Paths

### Step 3.1: Update Backend Imports

**Files to check:**
- `backend/run/start.ts`
- `backend/run/stream.ts`
- `backend/run/cancel.ts`
- `backend/steering/*.ts`

**Change:** Update database import if needed

**From:**
```typescript
import db from "../db";
```

**To:**
```typescript
import db from "../../db";
```

### Step 3.2: Verify TypeScript Compilation

```bash
encore run --no-build
```

**Checklist:**
- [ ] No TypeScript errors
- [ ] All imports resolve correctly
- [ ] Services compile successfully

---

## Phase 4: Update Encore Configuration

### Step 4.1: Move encore.app to Root

**Action:** Move `backend/encore.app` to root

```bash
mv backend/encore.app ./encore.app
```

### Step 4.2: Update encore.app Content

**File:** `encore.app`

```json
{
  "id": "steering-wheel-documentation-65b2",
  "lang": "typescript",
  "global_cors": {
    "allow_origins_without_credentials": ["*"],
    "allow_origins_with_credentials": [
      "http://localhost:5173",
      "http://localhost:3000"
    ]
  }
}
```

### Step 4.3: Update tsconfig.json Paths

**File:** Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vite/client"],
    "paths": {
      "~/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "encore.gen"
  ]
}
```

### Step 4.4: Remove Backend-Level Config Files

```bash
rm backend/tsconfig.json
rm backend/vite-env.d.ts
rm backend/vitest.config.ts
```

**Move to root if needed:**
```bash
mv backend/vitest.config.ts ./
```

### Step 4.5: Update vitest.config.ts

**File:** Root `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

---

## Phase 5: Database Configuration

### Step 5.1: Update Database Import Paths

**File:** `db/index.ts` (already correct)

```typescript
import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("db", {
  migrations: "./migrations",
});
```

### Step 5.2: Move Database to Root

**Option A:** Keep in separate directory structure
```bash
# No change needed - current structure is fine
```

**Option B:** Move to root (recommended for Encore apps)
```bash
mv backend/db ./db
```

**Action:** We'll keep Option A as it's already working.

### Step 5.3: Verify Database Migrations

```bash
encore db reset run steering
encore run
```

**Checklist:**
- [ ] Migrations apply successfully
- [ ] No database errors
- [ ] Services can access database

---

## Phase 6: Frontend Client Generation

### Step 6.1: Generate Encore Client

```bash
cd backend
encore gen client --target leap --lang typescript
```

### Step 6.2: Update Frontend client.ts Import

**File:** `frontend/client.ts`

**Current:** Auto-generated - should work as-is

**Verify:**
```typescript
import { Client } from "../encore.gen/clients";
```

### Step 6.3: Test Client Usage

**File:** Verify `frontend/pages/StartRun.tsx` imports work:

```typescript
import { Client } from "../client";
```

---

## Phase 7: Testing & Validation

### Step 7.1: Run All Tests

```bash
bun run test
```

### Step 7.2: Test Local Development

```bash
# Terminal 1: Start backend
encore run

# Terminal 2: Start frontend dev server
cd frontend && bun run dev
```

**Verify:**
- [ ] Backend starts on port 4000
- [ ] Frontend connects to backend
- [ ] All API endpoints work
- [ ] Streaming endpoints work
- [ ] Static assets serve correctly

### Step 7.3: Test Build Process

```bash
# Build frontend
cd frontend && bun run build

# Start Encore with built frontend
encore run

# Visit http://localhost:4000/frontend/
```

**Verify:**
- [ ] Frontend loads from Encore
- [ ] No 404 errors
- [ ] API calls work
- [ ] Streaming works

### Step 7.4: Full Integration Test

**Test Flow:**
1. Start run via POST /run
2. Stream events via /run/:id/stream
3. Test steering endpoints
4. Verify database persistence

---

## Phase 8: Encore Cloud Deployment

### Step 8.1: Verify Git Remote

```bash
git remote -v
```

**Should show:**
```
encore    encore://steering-wheel-documentation-65b2
```

### Step 8.2: Commit Changes

```bash
git add .
git commit -m "feat: migrate to full Encore.ts parity

- Consolidate to single root package.json
- Remove duplicate frontend service
- Update build process
- Add CORS configuration
- Update documentation"
```

### Step 8.3: Deploy to Encore Cloud

```bash
git push encore migrate-encore-parity
```

### Step 8.4: Verify Cloud Deployment

1. Visit [Encore Cloud Dashboard](https://app.encore.dev/steering-wheel-documentation-65b2/deploys)
2. Check deployment logs
3. Test API endpoints in cloud
4. Verify database migrations in cloud

### Step 8.5: Test Cloud Frontend

```bash
# Get cloud URL
encore app app-url

# Visit frontend in cloud
open https://{app-id}.encr.app/frontend/
```

---

## Phase 9: Documentation Updates

### Step 9.1: Update DEVELOPMENT.md

**Changes needed:**
- Update package installation instructions
- Update build process documentation
- Update Encore Cloud deployment steps
- Add CORS configuration notes

### Step 9.2: Update README.md

**Add section:**
```markdown
## Architecture

This project uses Encore.ts for the backend and React for the frontend.
The frontend is served as static assets through Encore's built-in static
asset serving capability.

### Project Structure

- `db/` - Database migrations
- `run/` - Run service (agent orchestration)
- `steering/` - Steering service (documentation management)
- `frontend/` - React frontend (served as static assets)
- `encore.gen/` - Auto-generated Encore clients
```

### Step 9.3: Create ARCHITECTURE.md

**Document:**
- Service architecture
- Database schema
- PubSub topics
- Streaming APIs
- Frontend-backend communication

---

## Rollback Plan

If issues arise during migration:

### Rollback Steps

```bash
# Return to backup branch
git checkout backup-pre-encore-parity

# Restore original state
git checkout main
git branch -D migrate-encore-parity
```

### Recovery Checklist

- [ ] Restore original package.json files
- [ ] Restore frontend service
- [ ] Verify original build process
- [ ] Test original functionality

---

## Success Criteria

### Development
- ✅ Single `package.json` at root
- ✅ Single `node_modules` directory
- ✅ All imports resolve correctly
- ✅ Frontend builds successfully
- ✅ Backend serves frontend correctly

### Functionality
- ✅ All API endpoints work
- ✅ Streaming endpoints function
- ✅ Database operations succeed
- ✅ PubSub publishes/consumes correctly
- ✅ Frontend communicates with backend

### Deployment
- ✅ Encore Cloud deployment succeeds
- ✅ All environments work correctly
- ✅ Database migrations apply in cloud
- ✅ Frontend loads from cloud URL

### Documentation
- ✅ DEVELOPMENT.md updated
- ✅ README.md updated
- ✅ Architecture documented
- ✅ Migration process documented

---

## Troubleshooting

### Issue: "encore.app not found"

**Solution:**
```bash
mv backend/encore.app ./encore.app
```

### Issue: "Cannot find module '../db'"

**Solution:** Update import paths:
```typescript
import db from "../../db";
```

### Issue: "Frontend not serving"

**Solution:** Verify frontend/dist exists:
```bash
cd frontend && bun run build
```

### Issue: "Dependencies conflict"

**Solution:** Clear and reinstall:
```bash
rm -rf node_modules bun.lock
bun install
```

### Issue: "CORS errors"

**Solution:** Add CORS to encore.app:
```json
{
  "global_cors": {
    "allow_origins_without_credentials": ["*"]
  }
}
```

---

## Next Steps After Migration

1. **Monitor Cloud Deployment**
   - Check Encore Cloud dashboard
   - Review deployment logs
   - Test all endpoints

2. **Update CI/CD**
   - Update GitHub Actions workflows
   - Update build scripts
   - Update deployment steps

3. **Team Communication**
   - Share new development process
   - Update onboarding docs
   - Schedule team sync

4. **Optimization**
   - Review bundle sizes
   - Optimize imports
   - Add monitoring

---

## Timeline

### Day 1
- ✅ Morning: Phase 1 (Package Consolidation)
- ✅ Afternoon: Phase 2 (Frontend Restructure)

### Day 2
- ✅ Morning: Phase 3-4 (Config Updates)
- ✅ Afternoon: Phase 5-6 (Database & Client)

### Day 3
- ✅ Morning: Phase 7 (Testing)
- ✅ Afternoon: Phase 8-9 (Deployment & Docs)

---

## Support

- **Encore Documentation:** https://encore.dev/docs
- **Encore Discord:** https://encore.dev/discord
- **MCP Encore Tools:** Available via `/mcp_encore-mcp`

---

**Good luck with the migration! 🚀**

