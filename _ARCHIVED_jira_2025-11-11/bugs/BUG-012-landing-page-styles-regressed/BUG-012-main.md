# BUG-012: landing-page-styles-regressed

> **Line Limit:** 150 lines max (enforced)
> **Purpose:** Core bug documentation and implementation details

---

## Summary
Landing page styles disappeared after running `bun install`; UI rendered as plain black text on white background because Skeleton runtime packages were treated as dev-only and excluded from build. Restored dependencies to recover styling.

---

## Severity / Impact
- **Severity**: High
- **Impact**: Landing page demos unusable; all users see unstyled experience in local dev.

---

## Environment
- **Backend**: encore run (local)
- **Frontend**: localhost:5173
- **Browser/OS**: Chrome macOS
- **Package Versions**: Skeleton 4.2.4, Tailwind 4

---

## Steps to Reproduce
1. Run `bun run dev` after Bun reshuffled dependencies.
2. Open `http://localhost:5173`.
3. Observe landing page lacking retro styling.

---

## Expected Result
Landing page renders with retro color palette, buttons, cards, and animation.

---

## Actual Result
Plain black text on white background; no Skeleton/Tailwind styling applied.

---

## Root Cause
`bun install` moved `@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte` into `devDependencies`, removing them from runtime bundle.

---

## Proposed Fix
1. Move Skeleton packages back into `"dependencies"` in `frontend/package.json`.
2. Re-run `bun install` and restart frontend.
3. Add regression check (lint/script) verifying critical runtime deps stay out of devDependencies.

---

## Attachments / Logs
- Screenshot of unstyled landing page.
- `package.json` diff showing dependency correction.

---

## Owner / Priority
- **Reported by**: Founder
- **Assigned to**: Frontend
- **Priority**: P1

---

## Related Items
- **Discovered in**: Local dev session
- **Blocks**: Landing page demos
- **Related**: None

---

## Notes
- Add guard script to ensure Skeleton packages remain runtime dependencies before future installs.

