# Mobile-MCP Integration Test Plan

## Phase 0: Bug Fixes Validation

### Test 1: SQL Parameter Binding
```bash
cd backend && encore test mobile/session-repo.test.ts
```
**Verify**:
- `findAvailableDevice({ platform: "android" })` executes without parameter errors
- Query returns device when filter matches
- Query returns null when no match

---

### Test 2: Device Allocation Race
```bash
# Manual test with 2 concurrent sessions
```
**Steps**:
1. Start session 1 for device A
2. Verify device A marked unavailable
3. Start session 2 (should NOT get device A)
4. Close session 1
5. Verify device A marked available
6. Start session 3 (should get device A)

**Expected**: No device conflicts, proper availability tracking

---

### Test 3: MCP Process Cleanup
```bash
# Kill MCP process mid-operation
kill -9 $(pgrep -f mobile-mcp)
```
**Verify**:
- Process exit handler clears responseHandlers
- Buffer reset properly
- Next operation starts fresh MCP process

---

### Test 4: Partial Device Info
```bash
# Mock MCP with missing screenSize
```
**Verify**:
- `getDeviceInfo()` returns device info without screen data
- No error thrown for missing optional fields

---

## Phase 1: Device Provisioning

### Test 5: Mobile Service Device Listing
```bash
curl -X POST http://localhost:4000/mobile/devices/list \
  -H "Content-Type: application/json" -d '{}'
```
**Expected**: List of connected devices with platform, ID, status

---

### Test 6: Session Creation
```bash
curl -X POST http://localhost:4000/mobile/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"platform": "android", "deviceType": "emulator"}'
```
**Expected**:
- Session created successfully
- Device ID returned
- Device marked unavailable in DB

---

### Test 7: Agent Integration - Device Provisioning
```bash
cd backend && encore test agent/nodes/setup/EnsureDevice/
```
**Verify**:
- Agent calls mobile service for device
- Session tracked in database
- WebDriverIO session created with mobile-mcp device

**Status**: ✅ 2025-11-14 — `encore test` (includes `agent/nodes/setup/EnsureDevice/node.test.ts`) with mobile provision feature flag unit coverage and full backend suite passing.

---

## Phase 2: Operations Migration

### Test 8: Screenshot via Mobile Service
```bash
curl -X POST http://localhost:4000/mobile/screen/screenshot \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "emulator-5554"}'
```
**Expected**: Base64 screenshot returned

---

### Test 9: Tap via Mobile Service
```bash
curl -X POST http://localhost:4000/mobile/input/tap \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "emulator-5554", "x": 500, "y": 1000}'
```
**Expected**: Tap executed, success response

---

### Test 10: Agent E2E with Mobile Service
```bash
cd backend && encore test agent/tests/metrics.test.ts
```
**Verify**:
- Device provisioned via mobile service
- Screenshots captured via mobile service
- Taps executed via mobile service
- Run completes successfully
- Session closed properly

---

## Phase 3: Cloud Devices (Future)

### Test 11: AWS Device Farm Provisioning
```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=yyy

curl -X POST http://localhost:4000/mobile/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"platform": "android", "provider": "aws", "deviceType": "physical"}'
```
**Expected**: AWS Device Farm device provisioned

---

### Test 12: Cloud Device Operations
```bash
# Run full agent test on AWS device
cd backend && encore test agent/tests/metrics.test.ts
```
**Verify**: All operations work identically on cloud device

---

## Performance Benchmarks

### Local Device Baseline
- Screenshot: <2s
- Tap: <500ms
- Element tree: <3s
- Session creation: <5s

### Cloud Device Target
- Within 20% of local device performance

---

## Smoke Test Script

```bash
#!/bin/bash
# smoke-test-mobile-mcp.sh

echo "=== Mobile-MCP Smoke Test ==="

# 1. Check mobile service health
echo "1. Health check..."
encore run &
sleep 5

# 2. List devices
echo "2. List devices..."
curl -s -X POST http://localhost:4000/mobile/devices/list \
  -H "Content-Type: application/json" -d '{}' | jq

# 3. Create session
echo "3. Create session..."
SESSION=$(curl -s -X POST http://localhost:4000/mobile/sessions/create \
  -H "Content-Type: application/json" \
  -d '{"platform": "android"}' | jq -r '.sessionId')

echo "Session ID: $SESSION"

# 4. Screenshot
echo "4. Capture screenshot..."
curl -s -X POST http://localhost:4000/mobile/screen/screenshot \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION\"}" | jq -r '.image' | head -c 100

# 5. Close session
echo "5. Close session..."
curl -s -X POST http://localhost:4000/mobile/sessions/close \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION\"}"

echo "=== Smoke Test Complete ==="
```

---

## CI Integration

Add to `.github/workflows/ci.yml`:
```yaml
- name: Test Mobile Service
  run: |
    cd backend
    bun install
    encore test mobile/

- name: Smoke Test Mobile-MCP
  run: |
    ./specs/002-integrate-mobile-mcp/smoke-test.sh
```

---

## Manual Testing Checklist

**Before merging:**
- [ ] All 4 critical bugs fixed
- [ ] Integration tests pass
- [ ] Smoke test passes with local emulator
- [ ] Agent E2E test passes via mobile service
- [ ] Device allocation prevents conflicts
- [ ] Session cleanup works properly
- [ ] Performance within baseline
- [ ] Documentation updated

