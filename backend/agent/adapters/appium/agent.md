# Appium Adapters - Agent Implementation Guide

## Overview

This directory contains two adapter implementations for Appium mobile automation:

- **`webdriver/`** - **RECOMMENDED** - Thin WebDriver client (standalone)
- **`webdriverio/`** - **DEPRECATED** - WebDriverIO testrunner (stubbed for post-MVP)

## Current Status (POC/MVP)

**Use the `webdriver/` adapters for all new development.**

The agent defaults to `DriverImpl.WebDriverStandalone` which uses the thin WebDriver client. This provides:

- ✅ Direct W3C WebDriver protocol access
- ✅ No testrunner overhead
- ✅ Deterministic timing control in domain layer
- ✅ Better error handling and retry control
- ✅ Cleaner separation of concerns

## Quick Start

### Using WebDriver Adapters (Recommended)

```typescript
import { WebDriverSessionAdapter } from "./webdriver/session.adapter";
import { WebDriverInputActionsAdapter } from "./webdriver/input-actions.adapter";
import { WebDriverPerceptionAdapter } from "./webdriver/perception.adapter";

// Session management
const sessionPort = new WebDriverSessionAdapter();
await sessionPort.ensureDevice({
  platformName: "Android",
  deviceName: "emulator-5554",
  platformVersion: "14",
  appiumServerUrl: "http://localhost:4723"
});

// Input actions using W3C performActions
const inputPort = new WebDriverInputActionsAdapter(() => sessionPort.getContext());
await inputPort.performTap(100, 200);

// UI capture
const perceptionPort = new WebDriverPerceptionAdapter(() => sessionPort.getContext());
const screenshot = await perceptionPort.captureScreenshot();
```

### Available WebDriver Adapters

| Adapter | Purpose | Key Methods |
|---------|---------|-------------|
| `WebDriverSessionAdapter` | Session lifecycle | `ensureDevice()`, `closeSession()` |
| `WebDriverInputActionsAdapter` | Touch gestures | `performTap()`, `performSwipe()`, `performLongPress()`, `performTextInput()` |
| `WebDriverNavigationAdapter` | System navigation | `performBack()`, `pressHome()` |
| `WebDriverPerceptionAdapter` | UI capture | `captureScreenshot()`, `dumpUiHierarchy()` |
| `WebDriverDeviceInfoAdapter` | Device queries | `getScreenDimensions()`, `isDeviceReady()` |
| `WebDriverIdleDetectorAdapter` | UI stability | `waitIdle()` |
| `WebDriverAppLifecycleAdapter` | App management | `launchApp()`, `restartApp()`, `getCurrentApp()` |

## Protocol Implementation

### Android (UiAutomator2)

The WebDriver adapters use:

- **W3C Actions**: `performActions()` for touch gestures (tap, swipe, long press)
- **W3C Commands**: `back()`, `takeScreenshot()`, `getPageSource()`, `getWindowSize()`
- **Appium Extensions**: `mobile: pressKey`, `mobile: activateApp`, `mobile: terminateApp`

### iOS (XCUITest) - MVP Phase

iOS support is scaffolded but not yet implemented. Placeholders exist for:

```typescript
// Future iOS implementation
await driver.execute("mobile: pressKey", { keycode: "home" }); // iOS
await driver.execute("mobile: activateApp", { bundleId: "com.example.app" }); // iOS
```

## Architecture Benefits

### Deterministic Control

```typescript
// Domain layer controls timing - no implicit waits in adapters
const result = await inputPort.performTap(x, y);
// Adapter uses W3C performActions with exact timing
// Domain layer handles retries via AgentState budgets
```

### Context Provider Pattern

```typescript
// Safe lazy access to session context
const contextProvider = () => sessionPort.getContext();
const adapter = new WebDriverInputActionsAdapter(contextProvider);

// Context is populated after ensureDevice() runs
// No null assertions or initialization order issues
```

### Type Safety

```typescript
// Clear mobile semantics
import type { MobileDriver } from "./webdriver/session-context";

// No "Browser" confusion - this is a mobile app driver
interface SessionContext {
  driver: MobileDriver;  // Clear naming
  capabilities: Record<string, unknown>;
}
```

## Migration from WebDriverIO

If you're currently using WebDriverIO adapters:

1. **Update imports**:
   ```typescript
   // Old
   import { WebDriverIOSessionAdapter } from "./webdriverio/session.adapter";
   
   // New
   import { WebDriverSessionAdapter } from "./webdriver/session.adapter";
   ```

2. **Update constructor calls**:
   ```typescript
   // Old
   const adapter = new WebDriverIOInputActionsAdapter(context);
   
   // New
   const adapter = new WebDriverInputActionsAdapter(contextProvider);
   ```

3. **Protocol differences**:
   ```typescript
   // WebDriverIO helpers (deprecated)
   await driver.touchAction({ action: "tap", x, y });
   
   // W3C Actions (recommended)
   await driver.performActions([{
     type: "pointer",
     id: "finger1",
     parameters: { pointerType: "touch" },
     actions: [
       { type: "pointerMove", duration: 0, x, y },
       { type: "pointerDown", button: 0 },
       { type: "pointerUp", button: 0 }
     ]
   }]);
   ```

## Configuration

### Driver Selection

```typescript
// In worker.ts - defaults to WebDriverStandalone
const ports = buildAgentPorts(DriverImpl.WebDriverStandalone);

// To use WebDriverIO (not recommended for POC/MVP)
const ports = buildAgentPorts(DriverImpl.WebdriverIO);
```

### Android Capabilities

```typescript
const capabilities = {
  platformName: "Android",
  "appium:deviceName": "emulator-5554",
  "appium:platformVersion": "14",
  "appium:automationName": "UiAutomator2",
  "appium:noReset": true,
  "appium:fullReset": false,
  "appium:autoGrantPermissions": true,
  "appium:ignoreHiddenApiPolicyError": true,
  "appium:disableWindowAnimation": true,
};
```

## Error Handling

All adapters throw typed errors:

```typescript
import { 
  DeviceOfflineError, 
  TimeoutError, 
  AppNotInstalledError,
  AppCrashedError 
} from "../errors";

try {
  await sessionPort.ensureDevice(config);
} catch (error) {
  if (error instanceof DeviceOfflineError) {
    // Handle device connection issues
  } else if (error instanceof TimeoutError) {
    // Handle timeout issues
  }
}
```

## Testing

### Unit Tests

```typescript
// Use fake adapters for isolated testing
import { FakeSessionPort } from "../fakes/fake-session.port";

const fakeSession = new FakeSessionPort();
// Test domain logic without device dependencies
```

### Integration Tests

```typescript
// Use real WebDriver adapters with test devices
const sessionPort = new WebDriverSessionAdapter();
// Test against actual Android emulator/iOS simulator
```

## Future Work

### MVP Phase
- [ ] iOS XCUITest implementation
- [ ] Enhanced error taxonomy
- [ ] Artifact storage integration

### Post-MVP
- [ ] WebDriverIO adapter removal
- [ ] Multi-device support
- [ ] Performance optimizations

## Troubleshooting

### Common Issues

1. **Session context not initialized**
   ```typescript
   // Ensure ensureDevice() runs before other operations
   await sessionPort.ensureDevice(config);
   const context = sessionPort.getContext(); // Now available
   ```

2. **W3C Actions not working**
   ```typescript
   // Always call releaseActions() after performActions()
   await driver.performActions([...]);
   await driver.releaseActions();
   ```

3. **Android keycodes**
   ```typescript
   // Use correct Android keycodes
   await driver.execute("mobile: pressKey", { keycode: 3 }); // KEYCODE_HOME
   ```

### Debugging

Enable detailed logging:

```typescript
const logger = log.with({ 
  module: MODULES.AGENT, 
  actor: AGENT_ACTORS.ORCHESTRATOR 
});
logger.info("WebDriver operation", { operation, result });
```

## References

- [W3C WebDriver Specification](https://w3c.github.io/webdriver/)
- [Appium Mobile Commands](https://appium.io/docs/en/2.0/reference/execute-methods/)
- [Android UiAutomator2](https://appium.io/docs/en/2.0/drivers/android-uiautomator2/)
- [iOS XCUITest](https://appium.io/docs/en/2.0/drivers/ios-xcuitest/)
