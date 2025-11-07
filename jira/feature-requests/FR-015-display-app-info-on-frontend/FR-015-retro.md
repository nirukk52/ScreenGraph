# FR-015: Display App Info on Frontend - Retrospective

**Completed Date:** 2025-11-07  
**Actual Effort:** Small  
**Team:** AI Agent (Frontend), Encore MCP, Browser Extension MCP

---

## ✅ What Went Well
- Fast debugging using frontend logs (frontend.log showed exact error and line number)
- Browser MCP tools provided excellent verification workflow (navigate → snapshot → screenshot → evaluate)
- Encore MCP attempted to inspect backend services (failed due to Docker not running, but concept is sound)
- Clear error messages made root cause identification immediate
- Type conversion fix was straightforward once issue identified
- Skeleton UI styling worked perfectly out of the box
- Page rendered beautifully with Pinterest metadata and screenshots

---

## 🚧 What Could Be Improved
- Initial oversight: should have regenerated Encore client immediately when encountering "undefined" error
- Could have added dev-time type guards to warn about string-number conversions
- Documentation about PostgreSQL numeric type behavior could be more prominent
- Consider adding a linting rule to catch .toFixed() calls on potentially-string values

---

## 📊 Metrics & Outcomes
- **Estimated vs Actual Effort:** Estimated Small, Actual Small
- **Bugs Introduced:** 0 (caught and fixed before commit)
- **Performance Impact:** No impact - using cached data from backend (6-hour TTL)
- **User Impact:** Unblocks app discovery and metadata visualization features
- **Debug Time:** ~10 minutes from error to resolution
- **Verification Time:** ~5 minutes with MCP tools

---

## 🎓 Lessons Learned
1. **Always regenerate Encore client after backend changes** - Add this to standard workflow checklist
2. **PostgreSQL returns DECIMAL as strings** - This is standard behavior, not a bug. Frontend must handle conversion.
3. **Number() is defensive and safe** - Works on both strings and numbers, so use it liberally for database values
4. **MCP tools accelerate verification** - Browser + Encore MCPs provide faster, documented verification than manual testing
5. **Frontend logs are invaluable** - `tail -f frontend.log` shows SSR errors with full stack traces

---

## 🔄 Action Items for Future
- [✅] Document "bun run gen" workflow in frontend onboarding docs
- [✅] Add Graphiti episodes for type conversion patterns
- [ ] Consider ESLint rule: warn on `.toFixed()` without Number() wrapper
- [ ] Add integration test for /app-info route
- [ ] Create reusable AppInfoCard component for future app browsing features

---

## 📝 Additional Notes

**Technical Discovery:**
The "ratingScore as string" behavior is not a bug—it's PostgreSQL driver standard behavior. The `pg` driver returns DECIMAL/NUMERIC columns as strings to prevent floating-point precision loss. This is documented but not widely known.

**Workflow Win:**
Using Encore MCP to inspect backend and Browser MCP to verify frontend created a complete verification trail with screenshots. This approach should become standard for feature verification.

**Performance Note:**
The backend caches app info for 6 hours, so repeated page loads are fast (3-7ms). The 500 error only appeared during SSR, not after client-side hydration, which helped narrow down the issue quickly.

**Visual Quality:**
Skeleton UI cards, typography, and layout look professional. The horizontal screenshot gallery with snap-scroll works smoothly. The yellow star icon for ratings is a nice touch.

