<!-- 0d7533e3-6b8f-4bbe-954e-6cf2dde91d34 355fad51-bd77-42fe-a5ea-ae1d62d0c2d4 -->
# Provision App (Install/Verify) then Hand Off to Launch

## Scope

Implement only the provisioning step. Ensure the app is installed and version-verified using a local artifact (`buildUri`), with policy: reinstall only if installed version is older than expected. On success, transition to the launch/attach node.

## Inputs (typed)

- `deviceId`, `platform` ("android" | "ios")
- `appId` (`packageName` or `bundleId`)
- `buildUri` (APK/IPA local path or file URL)
- `expectedVersion`
- Policy: `reinstallIfOlder: true`, `maxRetries=3`, `baseBackoffMs=1000`, `maxBackoffMs=5000`

## Files to Update

- `backend/agent/nodes/setup/ProvisionApp/handler.ts` — implement install/verify logic
- `backend/agent/nodes/setup/ProvisionApp/policy.ts` — ensure retry/backtrack policy matches repo defaults (retry 3, backtrack to `EnsureDevice`)
- `backend/agent/nodes/setup/ProvisionApp/mappers.ts` — map state/context → input and output → state
- `backend/agent/nodes/setup/ProvisionApp/node.ts` — confirm `onSuccess` points to `LaunchOrAttach` (or equivalent)

## Implementation Steps

1. Build input

- In `buildInput`, resolve `{ deviceId, platform, appId, buildUri, expectedVersion, reinstallIfOlder: true }` from `AgentState` and `AgentContext`.

2. Check install & version

- Use `PackageManagerPort.isInstalled({ deviceId, appId })` and `PackageManagerPort.getVersion({ deviceId, appId })` (or combined call if available).
- Emit `AppInstallCheck { installed, installedVersion }`.

3. Decide action

- If not installed → install.
- If installed and `installedVersion < expectedVersion` → uninstall then install.
- If installed and `installedVersion ≥ expectedVersion` → skip install.

4. Install (if needed)

- Call `PackageManagerPort.install({ deviceId, appId, buildUri })`.
- Emit `AppInstallStarted` → `AppInstalled { version }`.
- On failure classify `install_failed` (retryable).

5. Double-check

- Re-run install check and verify version satisfies `installedVersion ≥ expectedVersion`.
- If still older, classify `version_mismatch` (retryable until policy exhausts).
- Emit `AppInstallVerified { installed: true, version }`.

6. Apply output and transition

- Update `AgentState.app = { appId, expectedVersion, installedVersion, installedJustNow }`.
- `onSuccess` transition to `LaunchOrAttach` node without launching here.

## Retries & Backtrack

- Retries: up to 3 with exponential backoff and deterministic jitter.
- On exhaustion: backtrack to `EnsureDevice`; increment `restartsUsed`.

## Observability & Logging

- Use `encore.dev/log` via contextual logger `{ module: "agent", actor: "worker", runId, nodeName: "ProvisionApp" }`.
- Emit events: `AppInstallCheck`, `AppInstallStarted`, `AppInstalled`, `AppInstallVerified`, `AppProvisionError { stage, code, message }`.

## Acceptance Criteria

- If missing or older: app is installed; final version `≥ expectedVersion`.
- State updated with app info; events and logs emitted.
- Success transition to `LaunchOrAttach` occurs without launching in Provision.

### To-dos

- [ ] Map AgentState+Context to ProvisionAppInput (deviceId, appId, buildUri, expectedVersion)
- [ ] Implement installed/version check using PackageManagerPort and emit AppInstallCheck
- [ ] Install if missing or older; uninstall+install when older; emit events
- [ ] Re-check install; verify version ≥ expected; update AgentState.app
- [ ] Ensure onSuccess transitions to LaunchOrAttach; keep launch out of Provision