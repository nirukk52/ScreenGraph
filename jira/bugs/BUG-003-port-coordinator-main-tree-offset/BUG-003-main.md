## BUG-003 — Frontend Port Discovery Bug

### Summary
Frontend was scanning for ANY available backend instead of using the configured `VITE_BACKEND_BASE_URL`, causing it to connect to wrong backends in multi-worktree scenarios.

### Status
✅ **RESOLVED** (2025-11-07)

### Original Issue
```typescript
// Broken: Frontend scanned all ports
const ports = [4000, 4002, 4001, 4003];
for (const port of ports) {
  if (await testUrl(`http://localhost:${port}`)) {
    return `http://localhost:${port}`; // Connected to FIRST available
  }
}
```

**Impact**: Frontend could connect to wrong backend, breaking multi-agent development.

### Solution
```typescript
// Fixed: Use validated environment variable
import { VITE_BACKEND_BASE_URL } from './env';

export async function getEncoreClient() {
  return new Client(VITE_BACKEND_BASE_URL); // Always correct
}
```

### Additional Work Done
- Added `dotenv` + `envalid` for type-safe environment configuration
- Created `backend/config/env.ts` and `frontend/src/lib/env.ts`
- Centralized all ports in `.env` file
- Simplified worktree model to code-editing only (no runtime isolation)

### Testing
**Before Fix**: Frontend connected to port 4002 (wrong backend)  
**After Fix**: Frontend uses `VITE_BACKEND_BASE_URL` from `.env` (always correct)

### Files Changed
- `frontend/src/lib/getEncoreClient.ts` - Remove port scanning
- `frontend/src/lib/env.ts` - Add type-safe validation
- `backend/config/env.ts` - Add type-safe validation
- `.env` - Centralize all port configuration

### Resolution Date
2025-11-07

### Branch
`feature/env-dotenv-envalid`









