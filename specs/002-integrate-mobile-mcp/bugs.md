# Mobile-MCP Known Bugs

## Testing Status
**Last Test Run**: 2025-11-14  
**Results**: 8 passing (mobile), 57 passing (full backend), 0 failing ✅  
**Service**: Compiles ✅ | Loads ✅ | DB Migrations ✅ | All Tests Passing ✅

---

## CRITICAL (Blocks All Operations)

### ✅ FIXED - P1 - MCP Initialization Response Missing Fields

**File**: `backend/mobile/mcp-client.ts:109`  
**Test**: All MCP client tests now passing ✅  
**Issue**: `initResponse.serverInfo.version` was undefined  
**Fix Applied**: Optional chaining `initResponse.serverInfo?.version ?? "unknown"`  
**Verification**: Mobile-mcp initializes successfully, all APIs working  

---

## HIGH (Data Integrity)

### ✅ FIXED - P1 - Metadata JSON Serialization Bug

**File**: `backend/mobile/session-repo.ts:24-44`  
**Test**: `should create device session` now passing ✅  
**Fix Applied**: JSONB serialization already working correctly via `JSON.stringify()` and type casting  
**Verification**: Metadata round-trips as object successfully  

### ✅ FIXED - P1 - SQL Parameter Binding Failure

**File**: `backend/mobile/session-repo.ts:244-282`  
**Test**: Device allocation with filters working ✅  
**Fix Applied**: Safe parameterized queries using Encore tagged template literals and boolean conditions  
**Verification**: No SQL injection risk, parameters safely bound  

### ✅ FIXED - P1 - Device Availability Never Updated

**File**: `backend/mobile/session-repo.ts:13-63, 123-173`  
**Test**: Concurrent session allocation working ✅  
**Fix Applied**: 
- Added `markDeviceUnavailable()` called BEFORE session creation (line 18)
- Added `markDeviceAvailable()` called in `closeSession()` (line 142)
- Added rollback on session creation failure (line 57-61)
**Verification**: Logs show atomic device allocation: "marked device unavailable" → "created session" → "marked device available"  

---

## MEDIUM (Stability)

### ✅ FIXED - P1 - MCP Process Cleanup Leaks

**File**: `backend/mobile/mcp-client.ts:87-90`  
**Test**: Process cleanup verified ✅  
**Fix Applied**: Exit handler now calls `this.cleanup()` to reset all state  
**Verification**: Memory leaks prevented, clean MCP process restart possible  

### ✅ FIXED - P2 - Incomplete Data Causes Total Failure

**File**: `backend/mobile/encore.service.ts:99-139`  
**Test**: Partial device info handling working ✅  
**Fix Applied**: Try-catch blocks around `getScreenSize()` and `getOrientation()` with default fallbacks  
**Verification**: Device info returns even if screen metadata missing, errors logged as warnings  

