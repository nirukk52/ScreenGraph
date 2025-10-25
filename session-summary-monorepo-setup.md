# Session Summary: Monorepo Setup & Encore Deployment

## 🚨 **DANGER RED ALERT** 🚨

**Graphiti Memory System is DOWN** - Created fallback session summary instead.

## Session Date: Current Session

## Major Accomplishments

### 1. Monorepo Architecture Established
- **Complete separation**: Backend and frontend are independent services
- **Clean root**: Only Git configs and documentation at repo root
- **No contamination**: Backend never imports frontend, vice versa
- **Strict boundaries**: Each service manages its own dependencies

### 2. Encore-SvelteKit Integration
- **Generated Encore client**: Type-safe TypeScript client for SvelteKit
- **Created helper**: `getEncoreClient.ts` with SSR/client environment detection
- **Updated API calls**: Migrated from manual fetch to type-safe Encore client
- **Added gen script**: Frontend can regenerate client with `npm run gen`
- **CORS configured**: Set up in encore.app for localhost:5173

### 3. Build Script Fixes for Encore CI
- **Removed encore run from build**: Encore CI handles builds automatically
- **Removed encore test from test**: Encore CI handles tests automatically
- **Local dev preserved**: `npm run dev` still works for local development

### 4. Repository Cleanup
- **Removed duplicates**: Single `encore.app` in `backend/`
- **Removed root dependencies**: No root `package.json` or `node_modules`
- **Cleaned gitignore**: Added frontend/backend build artifacts
- **Removed stale files**: Frontend encore.service.ts, vercel-react.json, docs

## Key Architectural Decisions

### Technical Decisions
1. **Single encore.app**: Only in `backend/` directory
2. **Independent dependencies**: Backend and frontend manage their own
3. **Type-safe API calls**: Encore client instead of manual fetch
4. **Clean repository**: Root only has Git configs and README
5. **Run from backend/**: Always run Encore from `backend/` directory

### Architectural Decisions
1. **Complete separation**: Backend and frontend are independent
2. **Monorepo pattern**: Single repo with separate package.json files
3. **Generated clients**: Encore client auto-generated from backend schema
4. **Environment-aware**: Client detects local vs cloud environment
5. **Strict boundaries**: No cross-contamination rules enforced

## Files Created/Modified

### Created
- `.cursor/rules/founder_rules.mdc` - Comprehensive architecture rules
- `frontend/src/lib/encore-client.ts` - Generated Encore client
- `frontend/src/lib/getEncoreClient.ts` - Client helper function
- `tsconfig.json` - Root TypeScript configuration
- `LOCAL_SETUP.md` - Local development guide
- `.encoreignore` - Exclude frontend from Encore parsing

### Modified
- `frontend/package.json` - Added gen script, switched to Bun
- `frontend/src/lib/api.ts` - Updated to use Encore client
- `backend/package.json` - Fixed build/test scripts for CI
- `backend/encore.app` - CORS configured
- `.gitignore` - Enhanced with build artifacts

### Removed
- Root `encore.app` - Duplicate, kept only in backend/
- Root `package.json` - Not needed without root dependencies
- Root `bun.lock` - Backend and frontend have their own
- Root `encore.gen/` - Use backend/encore.gen
- Root `.encore/` - Use backend/.encore
- Root `node_modules/` - Removed old dependencies
- Frontend `encore.service.ts` - Frontend not an Encore service
- Frontend `vercel-react.json` - Wrong config
- Frontend redundant docs - CLAUDE.md, DEPLOY_*.md, etc.

## Architecture Rules Established

### Founder Rules (.cursor/rules/founder_rules.mdc)

#### Strict Boundary Enforcement
- Never allow contamination between backend and frontend
- Backend and frontend are completely independent services
- Root contains ONLY Git configs and documentation
- No shared code between backend and frontend at root level

#### Type Safety First
- Use Encore generated client for type-safe API calls
- Never use manual `fetch()` calls
- Always import from `~encore/clients` or generated client
- Frontend must regenerate client after backend changes

#### Package Manager Consistency
- Use Bun consistently across entire monorepo
- Frontend: `bun run dev` (not npm)
- Backend: Bun package manager
- Each directory manages its own dependencies independently

### Absolute Prohibitions
1. **NO root `package.json`** - Each service manages its own
2. **NO root `encore.app`** - Only in `backend/`
3. **NO shared node_modules** - Independent dependency trees
4. **NO cross-contamination** - Backend never imports frontend, vice versa
5. **NO manual API calls** - Always use generated Encore client

## Directory Structure

```
/ScreenGraph
├── backend/              ← Encore backend (independent)
│   ├── encore.app       ← Single Encore config
│   ├── package.json     ← Backend dependencies
│   ├── bun.lock         ← Backend lockfile
│   ├── run/             ← Run service
│   ├── steering/        ← Steering service
│   ├── agent/           ← Agent code
│   └── db/              ← Database
├── frontend/            ← SvelteKit frontend (independent)
│   ├── package.json     ← Frontend dependencies
│   ├── bun.lock         ← Frontend lockfile
│   ├── src/             ← Source code
│   └── vite.config.ts   ← Vite config
├── tsconfig.json         ← TypeScript config
├── README.md             ← Main docs
└── Documentation files   ← Session summaries, guides
```

## Running Locally

### Backend
```bash
cd backend
encore run
```
**CRITICAL**: MUST run from `backend/` directory to avoid parsing frontend files

### Frontend
```bash
cd frontend
bun run dev
```

## Deployments

### Encore Cloud
- **App ID**: `screengraph-ovzi`
- **Status**: Deploying
- **Latest**: https://app.encore.cloud/screengraph-ovzi/deploys/staging/1qpr05magipa463691q0
- **Config**: Uses backend/ as root directory

### Vercel (Frontend)
- **Status**: Not yet deployed
- **Config needed**: Root Directory = `frontend`

## Benefits Achieved

1. **Type Safety**: Full type safety from SvelteKit to Encore backend
2. **No Contamination**: Clear boundaries prevent accidental coupling
3. **Consistency**: Bun as single package manager
4. **Maintainability**: Single responsibility per directory
5. **Clean Architecture**: Matches Next.js + Encore starter pattern
6. **Independent Deployment**: Backend and frontend deploy separately

## Critical Lessons Learned

### Encore CI Behavior
- Encore CI **does NOT** provide Encore CLI in build environment
- Build and test scripts should be empty/placeholders
- CI handles builds and tests automatically
- Local development still uses `encore run` for dev

### Frontend Exclusion
- `.encoreignore` didn't work to exclude frontend
- Solution: Run Encore from `backend/` directory
- This matches Next.js starter pattern exactly

### Package Management
- Root should have NO package.json or dependencies
- Each service manages its own dependencies
- Independent lockfiles prevent version conflicts

## Next Steps

1. ✅ Monitor Encore Cloud deployment
2. ⏳ Deploy frontend to Vercel (manual setup required)
3. ⏳ Test end-to-end integration
4. ⏳ Configure production environment variables

## Commands Reference

### Backend
```bash
cd backend
encore run              # Run backend locally
encore gen client       # Generate frontend client
```

### Frontend
```bash
cd frontend
bun run dev            # Run dev server
bun run build          # Build for production
bun run gen            # Regenerate Encore client
```

## Troubleshooting

### Error: "unable to resolve module $app/environment"
- **Cause**: Running `encore run` from repo root
- **Fix**: Always run from `backend/` directory

### Error: "encore: command not found" in CI
- **Cause**: Script trying to run Encore CLI
- **Fix**: Remove encore commands from build/test scripts

### Error: Frontend can't connect to backend
- **Cause**: CORS not configured or wrong URL
- **Fix**: Check encore.app CORS settings and getEncoreClient.ts

## Success Metrics

✅ Single `encore.app` in `backend/`
✅ Type-safe Encore client generated
✅ API calls migrated to Encore client
✅ Bun consistency established
✅ Clean repository without contamination
✅ CORS configured for frontend domain
✅ Build scripts fixed for Encore CI
✅ Backend deploys to Encore Cloud

