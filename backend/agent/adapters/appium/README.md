# Appium Adapters Architecture

## Overview

This directory contains the WebDriverIO-based Appium adapters implementing granular port interfaces. The architecture replaces the monolithic `DriverPort` with small, cohesive ports for better separation of concerns.

## Port Design

All ports are defined in `backend/agent/ports/appium/`:

- **session.port.ts**: Device connection and session management
- **app-lifecycle.port.ts**: Application launch and management
- **perception.port.ts**: UI capture (screenshots and hierarchy)
- **device-info.port.ts**: Device state queries (screen size, readiness)
- **input-actions.port.ts**: Touch gestures and text input
- **navigation.port.ts**: System-level navigation (back, home)
- **idle-detector.port.ts**: UI stability detection

## Adapter Implementations

All adapters are located in `backend/agent/adapters/appium/webdriverio/`:

- **session.adapter.ts**: Creates/manages WebDriverIO sessions
- **perception.adapter.ts**: Screenshot and page source capture
- **input-actions.adapter.ts**: Tap, swipe, long press, text input
- **navigation.adapter.ts**: Back button, home button
- **app-lifecycle.adapter.ts**: Launch, restart, get current app
- **device-info.adapter.ts**: Screen dimensions, device readiness
- **idle-detector.adapter.ts**: UI idle detection with heuristics

## Error Handling

Custom error classes in `errors.ts`:
- `DeviceOfflineError`: Device unreachable
- `AppNotInstalledError`: App not found
- `AppCrashedError`: App crashed unexpectedly
- `TimeoutError`: Operation timeout
- `ElementNotFoundError`: Element not found
- `InvalidArgumentError`: Invalid parameter

## Usage Example

```typescript
import { WebDriverIOSessionAdapter } from "./webdriverio/session.adapter";
import { WebDriverIOPerceptionAdapter } from "./webdriverio/perception.adapter";
import { WebDriverIOInputActionsAdapter } from "./webdriverio/input-actions.adapter";

// Create session
const sessionAdapter = new WebDriverIOSessionAdapter();
const context = await sessionAdapter.ensureDevice({
  platformName: "Android",
  deviceName: "emulator-5554",
  platformVersion: "13.0",
  appiumServerUrl: "http://localhost:4723",
});

// Get session context for other adapters
const sessionContext = sessionAdapter.getContext();

// Use perception adapter
const perceptionAdapter = new WebDriverIOPerceptionAdapter(sessionContext!);
const screenshot = await perceptionAdapter.captureScreenshot();

// Use input actions adapter
const inputAdapter = new WebDriverIOInputActionsAdapter(sessionContext!);
await inputAdapter.performTap(500, 1000);

// Close session
await sessionAdapter.closeSession();
```

## Testing

Fake implementations for each port are in `backend/agent/adapters/fakes/`:
- `fake-session.port.ts`
- `fake-app-lifecycle.port.ts`
- `fake-perception.port.ts`
- `fake-device-info.port.ts`
- `fake-input-actions.port.ts`
- `fake-navigation.port.ts`
- `fake-idle-detector.port.ts`

## Migration Strategy

A temporary `DriverPortFacade` in `backend/agent/ports/appium/driver.facade.ts` allows gradual migration from the monolithic driver to granular ports. Nodes can be migrated incrementally without breaking existing code.

## WebDriverIO Version

Using WebDriverIO v9.20.0 with Appium 2.x support and UiAutomator2 automation.

