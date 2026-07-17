---
target: CourseDetail.tsx
total_score: 19
p0_count: 0
p1_count: 3
timestamp: 2026-07-17T17-13-25Z
slug: frontend-src-pages-coursedetail-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Full-page blocking `Loading course…` text with no `aria-busy`; `document.title` never updated to the course name. |
| 2 | Match System / Real World | 3/4 | Content order matched the real curriculum structure; `list-style:none` on `.lesson-list` stripped the visible sequence numbers that would reinforce "this is a path." |
| 3 | User Control and Freedom | 2/4 | No in-page "back to courses" link; a malformed `courseId` left the user stuck on "Loading" forever. |
| 4 | Consistency and Standards | 1/4 | Diverged from CourseList's just-shipped skeleton pattern; `Dashboard.tsx` already marks completed lessons on the same data shape, this page didn't. |
| 5 | Error Prevention | 1/4 | No guard for zero units, zero lessons, or an undefined `courseId`. |
| 6 | Recognition Rather Than Recall | 2/4 | No completion marker meant a returning learner had to recall from memory which lessons were already watched. |
| 7 | Flexibility and Efficiency | 2/4 | No collapse/jump-to-unit for long courses — a soft ceiling, not a defect, given course length today. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean single-column layout, restrained spacing; `.course-description`'s hand-tuned negative margin is brittle but invisible under normal conditions. |
| 9 | Error Recovery | 1/4 | Genuine 404s and transient network errors were collapsed into one generic message with no link back anywhere. |
| 10 | Help and Documentation | 2/4 | No contextual help, but a lesson-list page doesn't strongly need it. |
| **Total** | | **19/40** | **Poor — major UX overhaul needed on states, not visuals** |

## Anti-Patterns Verdict

**LLM assessment**: Not visually AI slop — the `.lesson-list a` Lit Glass row treatment (translucent background, inset highlight, tinted shadow, `translateX(3px)` + Signal Blue hover) is a faithful application of the documented system. The real failure was **structural/discipline slop**: care applied unevenly across sibling pages. `CourseList.tsx` (one click upstream) had just received a skeleton, an empty state, and semantic list markup; this page, one click further into the same flow, still had a bare loading string, no empty-state guard, and was silently missing the completion-tracking feature `Dashboard.tsx` already implements against the identical data shape.

**Deterministic scan**: `detect.mjs` on CourseDetail.tsx — exit 0, zero findings.

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

Every priority issue here traced back to inconsistent care across sibling pages rather than any single bad decision — the fixes bring this page up to the bar its neighbors (CourseList, Dashboard, NotFound) already set, rather than inventing a new pattern.

## What's Working

1. **Lit Glass lesson-row treatment is genuinely on-system** — matches DESIGN.md's elevation vocabulary precisely.
2. **Race-condition handling in the fetch effect is correct** — the `active` boolean closure guard prevents a stale response from a previous `courseId` overwriting a newer one.
3. **Calm, plainspoken content hierarchy** — no jargon, single clear reading path top to bottom.

## Priority Issues

**[P1] No completion indicator on lessons, unlike `Dashboard.tsx`.**
- **What**: `Dashboard.tsx` prefixes completed lesson titles with a checkmark via `completedLessonIds.has(lesson.id)`; `CourseDetail.tsx` never imported `useProgress()` at all, so the page most learners actually browse from (the direct link target from `CourseList`) showed every lesson as equally unstarted.
- **Fix applied**: Imported `useProgress()` and added the identical `✓` marker used on Dashboard.
- **File**: `frontend/src/pages/CourseDetail.tsx`

**[P1] Blocking loading state was a regression against the bar CourseList just set.**
- **What**: A full-page centered `Loading course…` text with no `aria-busy`/`aria-label`, immediately downstream of a page that now ships a shaped skeleton.
- **Fix applied**: Replaced with a course-detail-shaped skeleton (title bar, description bar, two faux unit blocks each with a unit-title bar and three faux lesson rows), reusing the existing `.skeleton-line`/`skeleton-pulse` tokens, with `aria-busy="true"` on the container.
- **Files**: `frontend/src/pages/CourseDetail.tsx`, `frontend/src/styles/global.css`

**[P1] Malformed/undefined `courseId` trapped the user in permanent "Loading" with no error, no exit.**
- **What**: When `courseId` was `undefined`, the effect exited early without ever calling `setError`, leaving the page rendering the loading state forever — indistinguishable from a frozen tab.
- **Fix applied**: The effect now sets an explicit `not-found` error state when `courseId` is missing, rendering the same message + `Link to="/courses"` pattern `NotFound.tsx` already establishes, instead of silently returning.
- **File**: `frontend/src/pages/CourseDetail.tsx`

**[P2] No guard for a course with zero units or a unit with zero lessons.**
- **What**: Both cases rendered either nothing after the description or a heading over an empty list, with no message — exactly the "nothing here" anti-pattern the product register bans.
- **Fix applied**: Added explicit copy for both cases ("This course doesn't have any units yet." / "Lessons for this unit are coming soon."), reusing the `.course-load-error` style already introduced on Home/CourseList.
- **File**: `frontend/src/pages/CourseDetail.tsx`

**[P2] Generic, conflated error message with no path back.**
- **What**: A genuine 404 and a transient network failure both rendered identically, with no link anywhere, unlike `NotFound.tsx`'s message+button pattern.
- **Fix applied**: The catch handler now distinguishes a 404 (checking the thrown error message, since `getJson` embeds the HTTP status in its `Error`) from other failures — a real 404 renders the `NotFound`-style "Course not found" + `Link to="/courses"`; any other failure renders a message with a "Try again" retry button (bumping a retry counter that re-runs the fetch effect).
- **File**: `frontend/src/pages/CourseDetail.tsx`

## Persona Red Flags

**Riley (Deliberate Stress Tester)**: A course with zero units, or a unit with zero lessons, no longer renders ambiguous blank space — explicit messages now cover both. Manually navigating to a malformed course URL now surfaces a clear "Course not found" state instead of hanging on "Loading" indefinitely. The `active` closure guard against rapid course-switching cross-contamination was already correct and untouched.

**Sam (Accessibility-Dependent User)**: The loading state now sets `aria-busy="true"` and `aria-label="Loading course"`, matching the pattern CourseList already established, instead of a silent content swap with no announcement.

**"Margaret" — Returning Senior Learner (project-specific)**: Now sees which lessons she's already completed directly on the page she actually browses from, instead of needing to recall from memory or navigate to the separate Dashboard route to check.

## Minor Observations

- `.lesson-list` still sets `list-style: none` on the `<ol>` — the genuinely sequential lesson order has zero visible numbering for sighted users even though a screen reader still announces "item X of N." Left as-is for this pass (a visible ordinal is a real future enhancement, not a correctness bug); flagged for a future `/impeccable typeset` or `/impeccable layout` pass.
- `document.title` now updates to the course name via a second effect, matching the pattern already used on `CourseList.tsx`/`InPersonCourses.tsx`.
- `.course-description { margin: -10px 0 30px; }` remains a hand-tuned negative offset against the `clamp()` h1 — works today, flagged as brittle if the h1's clamp range ever shifts, not changed in this pass.

## Questions to Consider

1. Now that `CourseDetail.tsx` shows completion state directly, is `Dashboard.tsx`'s separate lesson list still needed in its current form, or should it lean more into aggregate stats (XP, streaks) now that per-lesson completion is visible closer to where learners actually browse?
2. Should a visible lesson ordinal (1, 2, 3…) be added to `.lesson-list` items now that the semantic `<ol>` already carries that information for screen readers but not sighted users?
