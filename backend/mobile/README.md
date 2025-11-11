## Mobile Device Automation Service

### Overview

The mobile service is an Encore microservice that provides mobile device automation capabilities by wrapping the [mobile-mcp](https://github.com/mobile-next/mobile-mcp) MCP server. It exposes mobile-mcp's tools as typed REST APIs, enabling agent-based mobile automation across iOS and Android devices (simulators, emulators, and real devices).

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ScreenGraph Backend                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │          Agent Service (backend/agent/)            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │    Ports (SessionPort, PerceptionPort, etc.) │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                       │                             │  │
│  │                       ▼                             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │   Mobile Service Adapter (calls HTTP APIs)   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐  │
│  │       Mobile Service (backend/mobile/)             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  REST API Endpoints (Encore service)         │  │  │
│  │  │   - /mobile/devices/list                     │  │  │
│  │  │   - /mobile/apps/launch                      │  │  │
│  │  │   - /mobile/screen/screenshot                │  │  │
│  │  │   - /mobile/input/tap                        │  │  │
│  │  │   - ... (25+ endpoints)                      │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                       │                             │  │
│  │                       ▼                             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │   Mobile MCP Client (JSON-RPC stdio)         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                       │                             │  │
│  │                       ▼                             │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │   mobile-mcp Server (npx @mobilenext/...)    │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          ▼
    ┌──────────────────────────────────────────┐
    │  Local Devices (Appium, ADB, simctl)     │
    │  - Android Emulators                     │
    │  - iOS Simulators                        │
    │  - Real Devices (USB/WiFi)               │
    └──────────────────────────────────────────┘
                          │
                          │  (Future)
                          ▼
    ┌──────────────────────────────────────────┐
    │  AWS Device Farm (via aws-mcp)           │
    │  - Cloud-hosted real devices             │
    │  - Scalable device pools                 │
    └──────────────────────────────────────────┘
```

### Key Components

#### 1. Mobile MCP Client (`mcp-client.ts`)
- Spawns and manages mobile-mcp server process via `npx`
- Communicates via JSON-RPC 2.0 over stdio
- Translates between Encore types and mobile-mcp protocol
- Handles initialization, tool invocation, and lifecycle management

#### 2. Device Session Repository (`session-repo.ts`)
- Manages device session tracking in PostgreSQL
- Caches device information for allocation
- Logs all operations for audit trail
- Supports session state management (idle, connected, busy, disconnected, error)

#### 3. Encore Service (`encore.service.ts`)
- Exposes 25+ typed REST API endpoints
- Provides structured logging via `encore.dev/log`
- Measures operation duration for telemetry
- Handles error translation and logging

### Database Schema

**Tables:**
- `device_sessions` - Active device sessions with state tracking
- `device_info` - Cached device information for allocation
- `mobile_operations_log` - Audit log of all mobile operations

**Indexes:**
- Device lookups by ID, platform, availability
- Session filtering by state and activity
- Operation history by session, device, type, and time

### API Endpoints

#### Device Management
- `POST /mobile/devices/list` - List all available devices
- `POST /mobile/devices/info` - Get device information

#### App Management
- `POST /mobile/apps/list` - List installed apps
- `POST /mobile/apps/launch` - Launch app
- `POST /mobile/apps/terminate` - Terminate app
- `POST /mobile/apps/install` - Install app from file
- `POST /mobile/apps/uninstall` - Uninstall app

#### Screen Interaction
- `POST /mobile/screen/screenshot` - Capture screenshot
- `POST /mobile/screen/elements` - Get UI element tree
- `POST /mobile/screen/size` - Get screen dimensions
- `POST /mobile/screen/orientation` - Get/set orientation

#### Input Actions
- `POST /mobile/input/tap` - Tap at coordinates
- `POST /mobile/input/long-press` - Long press at coordinates
- `POST /mobile/input/double-tap` - Double tap at coordinates
- `POST /mobile/input/swipe` - Perform swipe gesture
- `POST /mobile/input/type` - Type text
- `POST /mobile/input/button` - Press device button (HOME, BACK, etc.)

#### Session Management
- `POST /mobile/sessions/create` - Create device session
- `POST /mobile/sessions/get` - Get session info
- `POST /mobile/sessions/list` - List active sessions
- `POST /mobile/sessions/close` - Close session

#### Browser
- `POST /mobile/browser/open` - Open URL in browser

### Type Safety

All endpoints use strongly-typed DTOs defined in `dto.ts`:
- Request/response types for every endpoint
- Literal union types for enums (platform, device type, orientation, etc.)
- No `any` types - full type safety end-to-end

### Integration with Agent Service

The agent service will use the mobile service instead of direct Appium:

**Before (Direct Appium):**
```typescript
// backend/agent/adapters/appium/webdriverio/perception.adapter.ts
const screenshot = await this.session.takeScreenshot();
const hierarchy = await this.session.getPageSource();
```

**After (Mobile Service):**
```typescript
// backend/agent/adapters/mobile/perception.adapter.ts
import { mobile } from '~encore/clients';

const screenshot = await mobile.captureScreenshot({ deviceId });
const elements = await mobile.getUIElements({ deviceId });
```

### Benefits Over Direct Appium

1. **Reliability**: mobile-mcp handles device connection stability better
2. **Cross-Platform**: Unified API for iOS and Android
3. **Observability**: All operations logged to database
4. **Testability**: Easy to mock mobile service for tests
5. **Scalability**: Ready for AWS Device Farm integration
6. **Type Safety**: Encore generated clients provide full TypeScript types

### Future Enhancements

#### AWS Device Farm Integration
- Add AWS MCP client to provision cloud devices
- Implement device allocation strategy (local vs cloud)
- Handle device farm session lifecycle
- Support parallel test execution on cloud devices

#### SSE Streaming
- Real-time device logs streaming
- Live screenshot updates
- Operation status notifications
- Device connection events

#### Advanced Features
- Device pool management
- Session timeout and cleanup
- Operation retry logic
- Screenshot comparison and diffing
- A11y tree parsing and querying
- Gesture recording and playback

### Local Development

**Prerequisites:**
- Android SDK with ADB (for Android devices/emulators)
- Xcode with simctl (for iOS simulators)
- Appium (optional, mobile-mcp can run standalone)

**Start Mobile Service:**
```bash
cd backend && encore run
# Mobile service available at http://localhost:4000/mobile
```

**Example API Call:**
```bash
# List devices
curl -X POST http://localhost:4000/mobile/devices/list \
  -H "Content-Type: application/json" \
  -d '{}'

# Launch app
curl -X POST http://localhost:4000/mobile/apps/launch \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "emulator-5554", "packageName": "com.example.app"}'

# Capture screenshot
curl -X POST http://localhost:4000/mobile/screen/screenshot \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "emulator-5554"}'
```

### Testing

**Unit Tests:**
```bash
cd backend && encore test mobile/
```

**Integration Tests:**
```bash
# Requires real devices/emulators connected
cd backend && encore test mobile/*.integration.test.ts
```

### Troubleshooting

**mobile-mcp not starting:**
- Ensure Node.js 18+ installed
- Check `npx` is in PATH
- Verify network access to npm registry

**Device not found:**
- Run `adb devices` (Android) or `xcrun simctl list` (iOS)
- Ensure device is booted and unlocked
- Check mobile-mcp can detect device: `npx @mobilenext/mobile-mcp`

**Operation timeout:**
- Check device is responsive (not frozen)
- Increase timeout in mcp-client.ts if needed
- Review mobile-mcp stderr logs

### References

- [mobile-mcp GitHub](https://github.com/mobile-next/mobile-mcp)
- [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol)
- [Encore.ts Documentation](https://encore.dev/docs)
- [Backend Coding Rules](.cursor/rules/backend_coding_rules.mdc)
