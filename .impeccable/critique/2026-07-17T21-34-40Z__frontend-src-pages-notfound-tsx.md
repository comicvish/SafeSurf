---
target: NotFound.tsx
total_score: 31
p0_count: 0
p1_count: 0
timestamp: 2026-07-17T21-34-40Z
slug: frontend-src-pages-notfound-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Page state was clear, but `document.title` was never updated unlike the other pages that now set it. |
| 2 | Match System / Real World | 4/4 | Plain, honest language, no jargon. |
| 3 | User Control and Freedom | 3/4 | Header/Footer persist around the route, but the in-page CTA offered only one path (home). |
| 4 | Consistency and Standards | 4/4 | Matched CourseDetail's not-found branch almost verbatim — genuinely well done. |
| 5 | Error Prevention | 3/4 | N/A-heavy category for a 404. |
| 6 | Recognition Rather Than Recall | 4/4 | Single visible action, zero memory demand. |
| 7 | Flexibility and Efficiency | 2/4 | Only one recovery path (home); no secondary route to `/courses`. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean, on-system. |
| 9 | Error Recovery | 2/4 | Copy didn't distinguish "you mistyped" from "this lesson/course moved," the more likely real cause on this site. |
| 10 | Help and Documentation | 2/4 | Matches the site's baseline elsewhere, not a page-specific regression. |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment**: Not slop — a deliberately minimal 404 reusing the exact container and button classes already established elsewhere, rather than inventing new patterns. No absolute-ban violations. The one soft spot was generic copy that didn't acknowledge the most plausible real cause for this specific audience.

**Deterministic scan**: `detect.mjs` on NotFound.tsx — exit 0, zero findings.

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

Already the strongest-scoring page in this whole pass — the fixes are small and proportionate to its size, not a rebuild.

## What's Working

1. **Pattern fidelity, not drift** — the same message-shape/link-back pattern used in CourseDetail's not-found branch, not a bolted-on afterthought.
2. **Never actually stranded** — Header and Footer wrap every route including this one, so full site navigation is always present regardless of the single in-page CTA.

## Priority Issues

**[P2] Single recovery path ignored the most likely real cause of a 404 for this audience.**
- **What**: The only CTA was "Back to home." PRODUCT.md's primary audience often arrives via a stale printed handout link from an in-person course — a renamed or removed lesson/course URL is a more plausible cause here than a typo, and CourseDetail's own not-found state already routes to `/courses`, not `/`.
- **Fix applied**: Added a secondary link ("Looking for a lesson? Browse courses") alongside the primary "Back to home" button, and softened the copy to acknowledge the link may be out of date rather than implying user error.
- **File**: `frontend/src/pages/NotFound.tsx`

**[P3] `document.title` never reflected the 404 state.**
- **What**: Unlike CourseList/InPersonCourses/CourseDetail/CourseList/Dashboard, which all set `document.title` on mount, NotFound did nothing.
- **Fix applied**: Added the same `useEffect` title pattern used elsewhere ("Page not found | VeraBlock", restored on unmount).
- **File**: `frontend/src/pages/NotFound.tsx`

## Persona Red Flags

**"Dana" — senior returning from an in-person handout (project-specific)**: A printed lesson URL that has since moved now lands on copy that doesn't blame the user ("it may have moved, or the link may be out of date") and offers a direct path back into course browsing, not just home.

## Minor Observations

- No motion/animation present, nothing to check against reduced-motion requirements.
- Copy length and tone remain appropriately terse for a 404.

## Questions to Consider

1. If the dominant real-world cause of hitting this page is a deleted/renamed lesson or course rather than a typo, would tracking 404 referrers (if not already done) help confirm that assumption and prioritize future fixes accordingly?
