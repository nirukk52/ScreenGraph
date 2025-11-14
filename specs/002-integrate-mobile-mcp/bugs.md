# Mobile-MCP Known Bugs

## P1 - SQL Parameter Binding Failure

**File**: `backend/mobile/session-repo.ts:findAvailableDevice()`  
**Issue**: Builds `$1, $2` placeholders but interpolates raw WHERE clause without binding params  
**Impact**: Device allocation queries fail with parameter mismatch  
**Fix**: Use string concatenation with escaped values OR SQL builder  

---

## P1 - Device Availability Never Updated

**File**: `backend/mobile/session-repo.ts:createSession()`  
**Issue**: Filters `available=TRUE` but never marks device unavailable on allocation  
**Impact**: Multiple concurrent sessions can grab same physical device  
**Fix**: Add `markDeviceUnavailable()` on allocation, `markDeviceAvailable()` on close  

---

## P1 - MCP Process Cleanup Leaks

**File**: `backend/mobile/mcp-client.ts` process exit handler  
**Issue**: Exit handler doesn't clear `responseHandlers` map or reset buffer  
**Impact**: Memory leaks and state corruption on MCP crashes  
**Fix**: Call `cleanup()` in exit handler to fully reset state  

---

## P2 - Incomplete Data Causes Total Failure

**File**: `backend/mobile/encore.service.ts:getDeviceInfo()`  
**Issue**: Fails entirely if `screenSize` or `orientation` unavailable after device found  
**Impact**: Valid devices reported as errors when screen metadata temporarily unavailable  
**Fix**: Make screen metadata optional, return partial device info  

