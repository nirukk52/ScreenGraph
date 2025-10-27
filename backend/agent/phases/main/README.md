# Main Phase

**Status:** Planned

This directory will contain the main phase orchestration when implemented.

Similar structure to `setup/`:
- `registry/` - Handler composition
- `context/` - Context building
- `policies/` - Retry/backtrack policies
- `mappers/` - Input/output transformation
- `index.ts` - Facade exporting `buildRegistry` and `buildContext`

