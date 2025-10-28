# Appium Adapters - Agent Implementation Guide

## Overview

This directory contains the WebDriverIO adapter implementations for Appium mobile automation.

## Current Status (POC/MVP)

**Use the `webdriverio/` adapters for all development.**

The agent relies exclusively on the WebDriverIO stack. This provides:

- ✅ Consistent client behavior across the agent
- ✅ Mature driver lifecycle management
- ✅ Rich helper APIs for gestures and session control

## Quick Start

### Using WebDriverIO Adapters

```typescript
import {
  WebDriverIOSessionAdapter,
  WebDriverIOInputActionsAdapter,
  WebDriverIOPerceptionAdapter,
  WebDriverIOAppLifecycleAdapter,
  WebDriverIOIdleDetectorAdapter,
} from "./webdriverio";

// Session management
const sessionPort = new WebDriverIOSessionAdapter();
await sessionPort.ensureDevice({
  platformName: "Android",
  deviceName: "emulator-5554",
  platformVersion: "14",
  appiumServerUrl: "http://localhost:4723",
});

// Input actions using WebDriverIO helpers
const inputPort = new WebDriverIOInputActionsAdapter(() => sessionPort.getContext());
await inputPort.performTap({ x: 100, y: 200 });

// UI capture
const perceptionPort = new WebDriverIOPerceptionAdapter(() => sessionPort.getContext());
const screenshot = await perceptionPort.captureScreenshot();
```

### Available WebDriver Adapters

| Adapter | Purpose | Key Methods |
|---------|---------|-------------|
| `WebDriverIOSessionAdapter` | Session lifecycle | `ensureDevice()`, `closeSession()` |
| `WebDriverIOInputActionsAdapter` | Touch gestures | `performTap()`, `performSwipe()`, `performLongPress()`, `inputText()` |
| `WebDriverIONavigationAdapter` | System navigation | `performBack()`, `pressHome()` |
| `WebDriverIOPerceptionAdapter` | UI capture | `captureScreenshot()`, `dumpUiHierarchy()` |
| `WebDriverIODeviceInfoAdapter` | Device queries | `getScreenDimensions()`, `isDeviceReady()` |
| `WebDriverIOIdleDetectorAdapter` | UI stability | `waitIdle()` |
| `WebDriverIOAppLifecycleAdapter` | App management | `launchApp()`, `restartApp()`, `getCurrentApp()` |

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
import type { MobileDriver } from "./webdriverio/session-context";

interface SessionContext {
  driver: MobileDriver; // Clear naming
  capabilities: Record<string, unknown>;
}
```

## Migration Notes

If you find legacy references to the old standalone WebDriver adapters, replace them with their
WebDriverIO equivalents to keep the agent on a single automation stack.

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
// Use real WebDriverIO adapters with test devices
const sessionPort = new WebDriverIOSessionAdapter();
// Test against actual Android emulator/iOS simulator
```

## Future Work

### MVP Phase
- [ ] iOS XCUITest implementation
- [ ] Enhanced error taxonomy
- [ ] Artifact storage integration

### Post-MVP
- [ ] Multi-device support
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
