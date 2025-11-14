# Decision: Integrate Mobile-MCP Incrementally

**Date**: 2025-11-14  
**Decision**: Keep mobile-mcp integration, use incremental approach (local devices first, cloud later)  

---

## Comparison

| Criteria | Mobile-MCP | Spec 001 |
|----------|------------|----------|
| Effort | 14-28 hours | 7-13 hours |
| Risk | High (untested) | Low (incremental) |
| User Value | Deferred | Immediate |
| Testing | Complex (full rewrite) | Straightforward |
| Dependencies | Agent adapters rewrite | None |
| Alignment | Conflicts | Aligned |

---

## Rationale

1. **Production Requirement** - Can't go live without cloud devices (AWS Device Farm/BrowserStack)
2. **Infrastructure Gap** - We lack resources to build custom Android SDK device farm
3. **mobile-mcp Provides Path** - Abstraction layer for local → cloud migration
4. **Code Already Exists** - 27k lines written, fix bugs vs rewrite from scratch
5. **Incremental Migration** - Local devices first (Phase 1), cloud later (Phase 3)

---

## Comparison Updated

| Criteria | Mobile-MCP | Spec 001 Only |
|----------|------------|---------------|
| **Cloud Support** | ✅ Yes (via mobile-mcp) | ❌ No path |
| **Production Ready** | ✅ Yes (after bugs fixed) | ❌ Blocks launch |
| **Local Dev** | ✅ Yes | ✅ Yes |
| **Device Abstraction** | ✅ Clean APIs | ❌ Tied to Appium |
| **Effort** | 14-20 hrs (fix + test) | 0 hrs (done) |

**Bottom Line**: Need mobile-mcp for production. Spec 001 stays for local Appium management.

---

## Next Steps

1. **Phase 0**: Fix 4 critical bugs (2-4 hrs)
2. **Phase 1**: Test with local devices (4-6 hrs)
3. **Phase 2**: Migrate operations to mobile-mcp (6-8 hrs)
4. **Phase 3**: AWS Device Farm integration (future)

---

## Coexistence with Spec 001

- **Spec 001**: Manages Appium server lifecycle (start/stop/health)
- **Spec 002**: Handles device abstraction and provisioning
- Both work together initially, mobile-mcp may replace Appium long-term

