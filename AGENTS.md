# AGENTS.md

Project-wide guidance for AI agents. For standards see `.cursor/rules/founder_rules.mdc`; for
commands/ports see `README.md` and `CLAUDE.md`. This file focuses on durable, non-obvious
operating notes.

## Cursor Cloud specific instructions

ScreenGraph is a Bun monorepo with two independent services:

- Backend — Encore.ts (`backend/`), API at `http://localhost:4000`, dev dashboard at `http://localhost:9400`.
- Frontend — SvelteKit 2 + Vite (`frontend/`), UI at `http://localhost:5173`.

Standard install/run/test/lint commands are documented in `README.md`, `CLAUDE.md`, and the
service `package.json` scripts. The notes below are only the non-obvious things that bite you.

### Docker is required before running/testing the backend
`encore run` and `encore test` provision Postgres, Pub/Sub, and Object Storage in local Docker
containers. The Docker daemon is NOT started automatically on a fresh VM. Start it once per boot
before touching the backend, e.g.:

```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &
# one-time (already applied in the base snapshot): add your user to the docker group and
# `sudo chmod 666 /var/run/docker.sock` so Encore can reach Docker without sudo.
```

Docker 29 needs `"features": { "containerd-snapshotter": false }` with the `fuse-overlayfs`
storage driver in `/etc/docker/daemon.json` (already configured in the snapshot).

### Encore Cloud link vs. local-only dev
`backend/encore.app` is linked to Encore Cloud app id `screengraph-ovzi`. On startup `encore run`
fetches that app's cloud secrets, so it fails with `not logged in: run 'encore auth login'` unless
you are authenticated. Two ways to work:

- Preferred (matches CI): authenticate once with an app auth key, then run normally. The login is
  stored under `~/.encore` and persists in the VM snapshot for future agents:
  ```bash
  encore auth login --auth-key "$ENCORE_AUTH_KEY"
  cd backend && encore run
  ```
- Offline fallback (no cloud account needed): the backend defines ZERO `secret()` values, so the
  cloud link provides nothing for local dev. You can run fully locally by temporarily setting
  `"id": ""` in `backend/encore.app` (keep `"lang": "typescript"`). Do NOT commit this change — an
  empty id breaks `encore gen client screengraph-ovzi` and `git push encore main`.

### `encore run`/`encore test` mutate tracked files
Both commands rewrite `backend/package.json` (bumping `encore.dev` to match the installed CLI
version) and `bun.lock`. This is expected Encore behavior, not your edit — revert it before
committing (`git checkout -- backend/package.json bun.lock`).

### Android / Appium / adb are OPTIONAL
Real mobile exploration needs Appium + an Android emulator/`adb`, none of which are present by
default. The full pipeline (run lifecycle → Pub/Sub → XState orchestrator → event sourcing → graph
projection → SSE/WebSocket timeline) works without them; runs simply terminate at the
`EnsureDevice` node with `adb: not found`. Consequently these are expected to fail/skip without a
device: `backend/agent/tests` device-integration suites (auto-skipped), and the frontend Playwright
E2E `tests/e2e/run-page.spec.ts` (needs a device to capture screenshots). The `appinfo` Play Store
ingestion depends on live Google Play scraping and may fail from a sandboxed network.

### Quick verification
- Lint: `cd backend && bunx biome lint .` and `cd frontend && bunx biome lint .`
- Frontend typecheck: `cd frontend && bun run check`
- Backend tests: `cd backend && encore test` (device suites auto-skip)
- Run both services: `cd backend && encore run` and `cd frontend && bun run dev`
