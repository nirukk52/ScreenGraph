# WebDriver Session Errors - Troubleshooting Guide

**Error:** `WebDriverError: The session identified by ... is not known`

**Symptom:** Metrics test fails at `LaunchOrAttach` node with session error

---

## Root Cause

The Appium session is being created but then gets lost or expires during the test execution.

**Why this happens:**
1. Appium session timeout (default 60s of inactivity)
2. Session closed prematurely by previous test
3. Appium server restarted/crashed
4. Device connection dropped

---

## Quick Fixes

### 1. Restart Everything

```bash
# Kill Appium
pkill -f appium

# Restart Appium Inspector
# In Appium Inspector: Start Server

# Restart emulator
# In Android Studio: Stop → Start emulator

# Wait 10 seconds for everything to stabilize
sleep 10

# Run test
cd .cursor && task backend:integration:metrics
```

### 2. Check Appium Session Timeout

```bash
# Check Appium logs for session timeout settings
tail -100 $TMPDIR/appium.log | grep -i "timeout\|session"
```

**Fix:** Start Appium with longer timeout:
```bash
bunx appium --new-command-timeout 300
```

### 3. Verify Device Connection

```bash
# Check device is online
adb devices

# Should show:
# emulator-5554    device
```

### 4. Check App is Installed

```bash
adb shell pm list packages | grep kotlinconf

# Should show:
# package:com.jetbrains.kotlinconf
```

---

## Debugging with Encore MCP

**Requirement:** Start `encore run` in separate terminal first

```bash
# Terminal 1
cd backend && encore run
```

Then use MCP tools to query the failed run:

```typescript
// Get latest run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, status, stop_reason FROM runs ORDER BY created_at DESC LIMIT 1"
  }]
})

// Get run events to see where it failed
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT kind, sequence, created_at
      FROM run_events 
      WHERE run_id = 'xxx'
      ORDER BY sequence
    `
  }]
})

// Get agent state to see last node
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT snapshot->>'nodeName' as node
      FROM agent_state_snapshots 
      WHERE run_id = 'xxx'
      ORDER BY created_at DESC 
      LIMIT 1
    `
  }]
})
```

---

## Long-Term Fix

The WebDriver session error suggests the agent's session management might need improvement. Consider:

1. **Add session keep-alive** - Periodic heartbeat to prevent timeout
2. **Session recovery** - Detect lost session and recreate
3. **Better error handling** - Catch session errors and retry

---

## Current Workaround

Since the frontend E2E test passes (using the same services), the infrastructure is working. The issue is specific to how `encore test` interacts with Appium.

**Options:**
1. Skip metrics test for now, use frontend E2E as integration test
2. Increase Appium session timeout
3. Debug session lifecycle in agent code

---

**Next Steps:**
- Run frontend E2E test to confirm infrastructure works
- Compare successful run vs failed run using Encore MCP
- Fix session management in agent code

