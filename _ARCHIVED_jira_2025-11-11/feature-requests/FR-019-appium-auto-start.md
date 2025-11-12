# FR-019: Auto-Start Appium Server (Remove Manual Dependency)

**Status:** ✅ Implemented  
**Priority:** P1 (Developer Experience)  
**Milestone:** M2 - Agent Infrastructure  
**Owner:** Backend  
**Estimated Effort:** Medium

---

## 📝 Description
Previously, developers had to manually start an Appium server (via Appium Inspector or CLI) before running the agent. This created friction in the development workflow and was an unnecessary external dependency. This feature implements automatic Appium server lifecycle management: the agent now auto-starts a local Appium CLI process when needed, probes for existing servers first, and gracefully stops owned processes on run completion.

---

## 🎯 Acceptance Criteria
- [x] New `AppiumServerPort` interface abstracting server lifecycle (ensureServer, getServerInfo, stopIfOwned)
- [x] `AppiumCliServerAdapter` implementation using `child_process.spawn` to start Appium CLI
- [x] Health probing via `GET /status` with configurable timeout and retry logic
- [x] Free port selection when preferred port is occupied (bind to `0`, detect assigned port)
- [x] Graceful shutdown tracking: only stop processes started by the adapter
- [x] `WebDriverIOSessionAdapter` integration: probe external server first, fallback to auto-start
- [x] Worker lifecycle integration: instantiate server port in `buildAgentPorts`, stop in finalize
- [x] Environment variable configuration:
  - `AUTO_START_APPIUM` (default: `true`)
  - `APPIUM_BIN` (custom binary path)
  - `APPIUM_HOST`, `APPIUM_BASE_PATH`, `APPIUM_HOME`
  - Timeout/polling overrides
- [x] Documentation updates in `CLAUDE.md` (removed manual Appium steps, added env vars)
- [x] Unit tests for server manager (mocked spawn/probe/shutdown flows)

---

## 🔗 Dependencies
- Appium 2.x installed as devDependency in `backend/package.json`
- `node:child_process`, `node:net` for process spawning and port detection
- Existing `WebDriverIOSessionAdapter` and agent worker lifecycle

---

## 🧪 Testing Requirements
- [x] Unit: server manager spawns process, probes status, stops owned servers
- [x] Unit: session adapter probes external server before auto-starting
- [x] Integration: worker lifecycle stops server on finalize (success/failure/cancel)
- [ ] E2E: run starts with no Appium server running, auto-starts, captures screenshot, stops cleanly

---

## 📋 Technical Notes

### Architecture
- **Port**: `backend/agent/ports/appium/appium-server.port.ts` - Clean interface for DI
- **Adapter**: `backend/agent/adapters/appium/server-manager.adapter.ts` - CLI spawn logic
- **Session Integration**: `WebDriverIOSessionAdapter` calls `serverPort.ensureServer()` lazily
- **Worker**: Instantiates server port in `buildAgentPorts`, stops in `finally` block

### Behavior
1. **External server present**: Probes `http://127.0.0.1:4723/status` → uses it if healthy
2. **No server + auto-start enabled**: Spawns `appium server --port <port>`, waits for ready
3. **No server + auto-start disabled**: Fails with clear error message
4. **Run completion**: Calls `serverPort.stopIfOwned()` → only kills owned processes

### Safety
- Only auto-starts loopback URLs (`127.0.0.1`, `localhost`) to prevent remote server conflicts
- Ownership tracking ensures external servers are never terminated
- Structured logging for all probe/start/stop events

### Configuration Precedence
1. Probe config URL from `jobConfig.appiumServerUrl`
2. Fallback to `defaultServerUrl` from session adapter options
3. If all probes fail and auto-start enabled, spawn local server
4. Resolve binary: `options.binPath` → `APPIUM_BIN` → `node_modules/.bin/appium`

---

## 🏷️ Labels
`backend`, `agent`, `appium`, `devex`, `milestone-2`, `p1`

---

## 📝 Implementation Breakdown
1. ✅ Port interface + adapter implementation (spawn, probe, shutdown)
2. ✅ Session adapter probe-and-fallback logic
3. ✅ Worker lifecycle wiring (instantiate, finalize)
4. ✅ Environment variable parsing and defaults
5. ✅ Logging actor constant (`APPIUM_SERVER_MANAGER`)
6. ✅ Documentation updates (`CLAUDE.md` Quick Start + Troubleshooting)
7. ✅ Unit tests for server manager

---

## 📎 Related Links
- Implementation: `backend/agent/adapters/appium/server-manager.adapter.ts`
- Port: `backend/agent/ports/appium/appium-server.port.ts`
- Session integration: `backend/agent/adapters/appium/webdriverio/session.adapter.ts`
- Worker wiring: `backend/agent/orchestrator/worker.ts`
- Tests: `backend/agent/adapters/appium/server-manager.adapter.test.ts`

---

## 🚀 Impact
- **Before**: Developers had to manually start Appium Inspector or run `bunx appium` in a separate terminal
- **After**: Run `encore run` → agent auto-starts Appium on first device connection → stops on run completion
- **Developer Experience**: One less manual step, faster iteration, cleaner local setup
