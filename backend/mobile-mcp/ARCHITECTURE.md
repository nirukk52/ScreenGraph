## Mobile MCP Microservice Architecture

### Purpose
- Run the upstream `mobile-mcp` server inside Encore as an isolated microservice for device I/O.
- Bridge AWS Device Farm sessions through the existing Encore MCP and AWS MCP utilities.
- Expose deterministic HTTPS endpoints plus SSE streams for the core MCP tools (`screenshot`, `a11y_tree`, `tap`, `type`, `swipe`, `launch_app`).

### High-Level Components
- **MobileMcpSessionRegistry** — Tracks active Device Farm sessions keyed by `runId` and manages lifecycle (start, keep-alive, teardown).
- **AwsDeviceFarmConnector** — Uses the AWS MCP tool to allocate devices, resolve Appium endpoints, and fetch credentials required by `mobile-mcp`.
- **MobileMcpRuntime** — Spawns the `mobile-mcp` process (or reuses in-process SDK) and exposes MCP tool invocation APIs.
- **MobileMcpController** — Encore service layer exposing HTTPS APIs and SSE stream for tool execution events.
- **AgentAdapters** — New adapters in `backend/agent/adapters/mobile-mcp/` that implement the existing Appium-oriented ports by calling Encore-generated clients for this microservice.

### Service Boundaries
- **Input**: Requests from agent orchestrator (Encore client) identifying the run, desired tool, and tool arguments.
- **Output**: Structured responses (or streams) mirroring MCP tool payloads, plus translated domain types (`ScreenshotData`, `DeviceRuntimeContext`, etc.).
- **External Dependencies**: AWS Device Farm via AWS MCP, the upstream `mobile-mcp` npm package, existing Encore DB for persistence of session metadata.

### API Surface (Encore)
- `POST /mobile-mcp/session/start` — Start or reuse a Device Farm session. Returns `MobileMcpSession` (encapsulates AWS session ARN, Appium endpoint, MCP channel IDs).
- `DELETE /mobile-mcp/session/:sessionId` — Tear down an active session and release AWS resources.
- `POST /mobile-mcp/session/:sessionId/tools/:toolName` — Invoke a specific MCP tool and return the final result payload.
- `GET /mobile-mcp/session/:sessionId/tools/:toolName/stream` — SSE stream forwarding incremental MCP tool events (progress, partial outputs, errors).
- Convenience endpoints mapping to core Mobile MCP tools:
  - `POST .../tools/mobile_take_screenshot`
  - `POST .../tools/mobile_list_elements_on_screen`
  - `POST .../tools/mobile_get_screen_size`
  - `POST .../tools/mobile_click_on_screen_at_coordinates`
  - `POST .../tools/mobile_long_press_on_screen_at_coordinates`
  - `POST .../tools/mobile_swipe_on_screen`
  - `POST .../tools/mobile_type_keys`
  - `POST .../tools/mobile_press_button`
  - `POST .../tools/mobile_launch_app`

### Data Contracts
- `MobileMcpSession` — `{ sessionId, runId, deviceFarmJobArn, appiumEndpointUrl, mcpSessionToken, lastHeartbeatIso }`.
- `ToolInvocationRequest` — `{ toolInput: Record<string, unknown>, correlationId, runId }`.
- `ToolInvocationResult` — `{ status: "SUCCEEDED" | "FAILED", payload, error? }`.
- `ToolInvocationEvent` (SSE) — `{ correlationId, stage: "started" | "progress" | "completed" | "failed", payload }`.

### AWS Device Farm Flow
1. **start**: `AwsDeviceFarmConnector` calls AWS MCP tool `device_farm.start_session`.
2. Extract Appium endpoint + credentials, persist in registry.
3. Configure `MobileMcpRuntime` with Device Farm endpoint; launch/attach to `mobile-mcp`.
4. Return `sessionId` + device metadata to callers.
5. **stop**: Call `device_farm.stop_session` via AWS MCP and kill runtime process.

### MCP Tool Invocation Flow
1. Agent adapter calls `POST /tools/:toolName` with `runId` + tool args.
2. Controller fetches session from registry, forwards request to `MobileMcpRuntime`.
3. Runtime sends `callTool` request to `mobile-mcp`.
4. Streaming events (if requested) are proxied over SSE; final payload persisted for replay if required.
5. Controller translates final response to domain DTOs (e.g., base64 screenshot to `ScreenshotData`).

### Agent Integration Plan
- Introduce `backend/agent/adapters/mobile-mcp/` with adapters implementing `SessionPort`, `PerceptionPort`, `InputActionsPort`, etc.
- Update agent composition root to choose Mobile MCP adapters when backend configuration toggles `DEVICE_PROVIDER=mobile-mcp`.
- Ensure adapters translate Encore DTOs to domain types without leaking `mobile-mcp` specifics.

### Observability & Logging
- All Encore handlers use `log.with({ module: "mobile-mcp", actor: "...", runId })`.
- Stream events include `correlationId` for traceability.
- Failures bubble up as `APIError` with canonical error codes (`device_unavailable`, `tool_failed`, `session_expired`).

### Persistence
- Create `mobile_mcp_sessions` table storing session metadata and heartbeat timestamps for replay/auditing.
- Optionally persist tool invocation history for debugging (future iteration).

### Testing Strategy
- Unit tests for registry + runtime using fake Mobile MCP client.
- Integration test that simulates tool invocation using stubbed AWS connector.
- SSE smoke test verifying stream order and terminal events.
- Agent integration test hitting the new Encore client to perform `screenshot` + `tap` flows using fakes.

### Rollout Plan
1. Scaffold Encore service + DTOs + session registry.
2. Wire AWS connector with configuration from `config/env.ts`.
3. Implement adapters and update agent dependency injection.
4. Write tests + documentation.
5. Validate via encore-mcp call endpoints + QA smoke tests.

