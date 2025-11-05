# Bug Report: Steering Docs Directory Needs Cleanup

**Created**: 2025-11-05  
**Reporter**: @copilot  
**Status**: Open

## Issue Summary
The `steering-docs/` directory is causing linting issues in CI and needs to be properly handled or cleaned up.

## Impact
- **Severity**: Low
- **Affected Area**: CI-CD, Documentation

## Current Behavior
The `steering-docs/` directory is tracked in git and being linted by Biome, which may cause CI failures.

## Expected Behavior
Either:
1. The directory should be properly formatted/linted if it contains active documentation, OR
2. The directory should be excluded from linting if it's not part of the active codebase

## Steps to Reproduce
1. Run `bun run lint` in root or backend/frontend
2. Observe potential linting issues with steering-docs files

## Root Cause
The `steering-docs/` directory was not included in the Biome ignore list in `biome.json`, causing it to be checked during linting.

## Proposed Solution

**Temporary Fix (Applied)**:
- Added `steering-docs` to the ignore list in `biome.json`

**Future Work**:
1. Review the purpose and status of `steering-docs/` directory
2. Determine if it should be:
   - Kept and properly maintained with linting
   - Archived or moved to a different location
   - Removed if no longer needed
3. Update documentation to reflect the decision

## Related Resources
- `biome.json` configuration file
- `steering-docs/` directory structure

## Action Items
- [x] Add `steering-docs` to Biome ignore list (temporary fix)
- [ ] Review steering-docs directory purpose and contents
- [ ] Make decision on long-term handling of steering-docs
- [ ] Update project documentation accordingly

## Notes
- This is a low-priority cleanup task
- The temporary fix unblocks CI while proper cleanup can be planned
- Consider whether steering-docs should be in a separate repository or documentation system
