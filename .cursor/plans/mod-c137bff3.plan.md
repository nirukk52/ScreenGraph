<!-- c137bff3-918a-4d91-b780-52f96ba604de 197b00e9-a21c-4318-8c57-c4a7e88fd6b4 -->
# Modularize Engine and Setup Phase

### Goals

- Keep `NodeEngine` tiny and phase-agnostic (single-step execution and transitions only).
- Move setup-specific wiring (registry, context, policies, mappers) into `phases/setup`.
- Keep nodes pure under `nodes/setup/*`.
- Orchestrator remains composition root; later we can add `phases/main` with zero churn.

### File/Folder Changes

- Create engine module (shared)
- `backend/agent/engine/node-engine.ts` (move and generalize engine)
- `backend/agent/engine/transition-policy.ts` (computeBackoffDelayMs)
- `backend/agent/engine/types.ts` (EnginePorts, EngineContext base, NodeEvent, NodeHandler, NodeRegistry)
- Create setup phase module (wiring only)
- `backend/agent/phases/setup/index.ts` (Facade: buildRegistry, buildContext)
- `backend/agent/phases/setup/registry/build.ts` (compose handlers)
- `backend/agent/phases/setup/registry/handlers/EnsureDevice.handler.ts`
- `backend/agent/phases/setup/registry/handlers/ProvisionApp.handler.ts`
- `backend/agent/phases/setup/context/build.ts` (derive EngineContext from run/app config)
- `backend/agent/phases/setup/policies/*.ts` (retry/backtrack specs as data)
- `backend/agent/phases/setup/mappers/inputs/*.ts` (state+ctx → node input)
- `backend/agent/phases/setup/mappers/outputs/*.ts` (node output → state)
- `backend/agent/phases/setup/config/*.ts` (phase config constants)
- Prepare main phase skeleton
- `backend/agent/phases/main/README.md` (placeholder)
- Orchestrator composition
- Keep `backend/agent/orchestrator/orchestrator.ts` as-is (persistence)
- Update `backend/agent/orchestrator/worker.ts` to use setup Facade to get registry/context
- Optional: `backend/agent/orchestrator/router.ts` to choose phase (setup now, pluggable later)
- Remove bloat
- Decommission `backend/agent/orchestrator/node-registry.ts` after migration
- Keep `backend/agent/orchestrator/node-engine.ts` only as a thin re-export or remove after consumers migrate

### Implementation Steps

1) Engine extraction and generalization

- Move `NodeEngine` to `engine/node-engine.ts` and replace hardcoded switch with a map-based registry lookup.
- Extract `computeBackoffDelayMs` to `engine/transition-policy.ts`.
- Define shared base types in `engine/types.ts` and parameterize `NodeEngine` over `NodeName extends string` and `Registry`.

2) Setup phase module

- Implement `phases/setup/mappers/inputs/*` and `mappers/outputs/*` to keep registry declarative.
- Implement `phases/setup/policies/*` as plain data (no logic).
- Implement `phases/setup/registry/handlers/*` that compose: name, buildInput, execute, applyOutput, onSuccess/onFailure.
- Implement `phases/setup/registry/build.ts` to return a `NodeRegistry` for setup.
- Implement `phases/setup/context/build.ts` to assemble `EngineContext` from run/app config.
- Implement `phases/setup/index.ts` Facade exporting `buildRegistry` and `buildContext` only.

3) Orchestrator integration

- In `worker.ts`, compose ports (e.g., Appium session), call `setup.buildRegistry` and `setup.buildContext`, instantiate `NodeEngine` and run the loop (single-step or iterative, depending on current milestone scope).
- Add a minimal `router.ts` that returns the active phase (“setup” for now) to centralize future switching.

4) Cleanup and imports

- Update imports in orchestrator files to use `engine/*` and `phases/setup/*`.
- Remove `orchestrator/node-registry.ts` once all references are migrated.
- Keep nodes under `nodes/setup/*` (no move), phase module depends on them.

5) Tests and docs

- Add unit tests for `engine/node-engine.ts` (success, retry with backoff, backtrack, terminal failure).
- Add a smoke test for setup registry wiring (EnsureDevice → ProvisionApp happy path).
- Update `backend/agent/ARCHITECTURE_SUMMARY.md` and `orchestrator/README.md` to reflect new structure.

### Non-Goals

- No API contract changes, no DB schema changes.
- No extraction to a separate Encore service yet (structure prepares for it).

### Rollout

- Land engine generalization first (backward compatible re-exports if needed).
- Introduce `phases/setup` and migrate wiring.
- Flip worker to use Facade.
- Remove legacy files.

### To-dos

- [ ] Create engine module and move/generalize NodeEngine with map-based registry
- [ ] Extract computeBackoff to engine/transition-policy and update usages
- [ ] Add engine/types for shared base types and generics
- [ ] Implement setup mappers for inputs and outputs per node
- [ ] Define setup policies as data-only modules
- [ ] Compose setup registry handlers using mappers and policies
- [ ] Add phases/setup Facade exporting buildRegistry and buildContext
- [ ] Wire worker to use setup Facade and new engine
- [ ] Remove orchestrator/node-registry and update imports
- [ ] Add unit tests and update architecture docs