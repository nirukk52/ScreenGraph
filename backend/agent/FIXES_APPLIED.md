# Fixes Applied

## Issue
The CLI demo file (`backend/agent/cli/demo.ts`) was importing from old node files that no longer exist after migrating to node capsules.

## Error Messages
```
error: unable to resolve module ../nodes/setup/ensure-device: index not found
error: unable to resolve module ../nodes/setup/provision-app: index not found
error: unable to resolve module ../nodes/setup/launch-or-attach: index not found
error: unable to resolve module ../nodes/setup/wait-idle: index not found
```

## Solution Applied

### 1. Updated Imports
Changed from old flat file structure to new capsule structure:
```typescript
// Old
import { ensureDevice } from "../nodes/setup/ensure-device";
import { provisionApp } from "../nodes/setup/provision-app";

// New
import { ensureDevice } from "../nodes/setup/EnsureDevice/node";
import { provisionApp } from "../nodes/setup/ProvisionApp/node";
```

### 2. Temporarily Stubbed Missing Nodes
LaunchOrAttach and WaitIdle haven't been migrated to capsules yet. Added TODOs and stubbed them:
```typescript
// TODO: Create LaunchOrAttach and WaitIdle capsules
// import { launchOrAttach } from "../nodes/setup/LaunchOrAttach/node";
// import { waitIdle } from "../nodes/setup/WaitIdle/node";
```

### 3. Fixed Type Assertions
Added `as never` type assertions for event payloads that have strict typing:
```typescript
await orchestrator.recordNodeEvents(state, "EnsureDevice", deviceResult.events as never);
await orchestrator.recordNodeEvents(state, "ProvisionApp", provisionResult.events as never);
```

## Status
✅ **FIXED** - Imports now resolve correctly
⚠️ **TODO** - LaunchOrAttach and WaitIdle capsules need to be created

## Next Steps
1. Create LaunchOrAttach capsule
2. Create WaitIdle capsule
3. Add proper FakeDriver implementation for SessionPort interface



