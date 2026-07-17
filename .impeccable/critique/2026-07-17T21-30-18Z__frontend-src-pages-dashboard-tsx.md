---
target: Dashboard.tsx
total_score: 18
p0_count: 0
p1_count: 3
timestamp: 2026-07-17T21-30-18Z
slug: frontend-src-pages-dashboard-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | The summary line rendered "X of 0 lessons complete" before courses resolved (`totalLessons` defaulted to 0 via `?? 0`); loading state was a bare unstyled `<p>Loading…</p>`. |
| 2 | Match System / Real World | 3/4 | Plain language throughout. |
| 3 | User Control and Freedom | 2/4 | No retry on `coursesError`; only escape was a full refresh. |
| 4 | Consistency and Standards | 1/4 | Two different "Sign out" controls existed on the same page (Header's `.header-cta` and Dashboard's own inline `.text-link`) — same action, two visual treatments. Also lagged CourseDetail's just-shipped skeleton/title/empty-state pattern. |
| 5 | Error Prevention | 3/4 | Nothing destructive on this page. |
| 6 | Recognition Rather Than Recall | 2/4 | No "continue where you left off" despite having full completion data — a flat, undifferentiated list of every lesson in every course. |
| 7 | Flexibility and Efficiency | 1/4 | No shortcut to the next incomplete lesson; every visit requires re-scanning the whole list. |
| 8 | Aesthetic and Minimalist Design | 2/4 | Fine once loaded; the loading moment mixed styled glass tiles with a plain-text line, and the redundant sign-out control added noise. |
| 9 | Error Recovery | 1/4 | Generic error message, no recovery path, behind the bar CourseDetail's equivalent state already cleared. |
| 10 | Help and Documentation | 2/4 | Consistent with the rest of the app's baseline. |
| **Total** | | **18/40** | **Poor — the "my progress" home fell short of the bar its sibling page (CourseDetail) just cleared** |

## Anti-Patterns Verdict

**LLM assessment**: Not decorative slop — correctly reuses the established Lit Glass vocabulary (`.unit-block`, `.lesson-list`, `.stat-tile`) rather than inventing new patterns. The real issue was the product-register tell named in `product.md`: "strangeness without purpose" wasn't visible, but *unevenness* was — a plain `<p>Loading…</p>` sitting directly next to Lit Glass stat tiles was the seam, a page half-finished relative to a sibling (`CourseDetail.tsx`) that had just been hardened with a skeleton, title effect, retry button, and empty-state guards in a prior pass.

**Deterministic scan**: `detect.mjs` on Dashboard.tsx — exit 0, zero findings. Verified as a genuine clean result (no config/ignore files suppressing anything).

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

Every priority issue traced back to this page not having received the same hardening pass CourseDetail already had — the fixes bring it up to that same bar rather than inventing a new pattern.

## What's Working

1. **Correct reuse of the design system** — `.unit-block`/`.lesson-list`/`.stat-tile` pulled from the established vocabulary, not reinvented.
2. **The stats row is genuinely independent and correctly so** — `useStats()` is a separate context from the courses fetch and isn't gated behind it, which is the right architectural call.
3. **Completion markers (`✓`) reuse the same convention as CourseDetail** — a returning user learns the checkmark once and it holds everywhere.

## Priority Issues

**[P1] "X of 0 lessons complete" flashed on every dashboard load.**
- **What**: `totalLessons` defaulted to 0 via `courses?.reduce(...) ?? 0`, and the summary line rendered unconditionally whenever there was no error — so it briefly showed a nonsensical total before `courses` resolved.
- **Fix applied**: The summary line now only renders once `courses` is non-null (`{courses && !coursesError && <p>...}`), matching how the independent stats row already behaved correctly.
- **File**: `frontend/src/pages/Dashboard.tsx`

**[P1] Loading state didn't meet the bar CourseDetail/CourseList already set.**
- **What**: A bare, unstyled `<p>Loading…</p>` with no `aria-busy`, no skeleton, on the highest-traffic signed-in page in the app.
- **Fix applied**: Replaced with a skeleton matching the real layout (faux unit blocks with faux lesson rows), reusing the exact `.skeleton-line`/`.lesson-list-skeleton` classes already introduced for CourseDetail, with `aria-busy="true"` and `aria-label="Loading your courses"`.
- **Files**: `frontend/src/pages/Dashboard.tsx`

**[P1] The N+1 `getCourse` waterfall blocks all course content on one slow request.**
- **What**: Every enrolled course's full unit/lesson tree must resolve via `Promise.all` before any course section renders.
- **Status**: **Not resolved.** The two real fixes both carry either a backend contract change (`listCourses` returning per-course completion summaries, so the detail fetch isn't needed for this view) or a progressive-rendering rewrite with real behavioral risk (non-deterministic course ordering, partial-failure handling) that isn't safely verifiable without running the app against the real backend. Flagged rather than guessed at.
- **Suggested command**: `/impeccable optimize` (once the intended data-shape trade-off is decided)

**[P2] Duplicate, inconsistently-styled "Sign out" controls on the same page.**
- **What**: `Header.tsx`'s persistent `.header-cta` "Sign out" button was already visible on every page including this one; Dashboard additionally rendered its own inline `.text-link` "Sign out" — same action, two different treatments, simultaneously on screen.
- **Fix applied**: Removed the inline sign-out control from Dashboard; the header's button is now the single sign-out affordance. `Signed in as {user?.email}` remains as plain text.
- **File**: `frontend/src/pages/Dashboard.tsx`

**[P2] No error-recovery path and no empty-state guards, unlike CourseDetail.**
- **What**: `coursesError` showed a static message with no retry; no guard existed for a course with zero units or a unit with zero lessons.
- **Fix applied**: Ported CourseDetail's retry-button pattern (a `retryCount` state bumped to re-run the fetch effect) and its empty-state copy ("This course doesn't have any units yet." / "Lessons for this unit are coming soon.").
- **File**: `frontend/src/pages/Dashboard.tsx`

**[Minor, fixed] Flattened lesson list lost unit grouping; `document.title` never set.**
- Lessons were previously flattened across all units via `.flatMap`, losing the unit boundaries CourseDetail preserves. Restructured to nest lessons under their own unit heading (`.dashboard-unit`/`.dashboard-unit-title`) per course, matching CourseDetail's structure and directly addressing the "chunking" cognitive-load failure the assessment flagged.
- Added the same `document.title` effect pattern used on CourseList/CourseDetail/InPersonCourses.

## Persona Red Flags

**Jordan (Confused First-Timer)**: No longer sees a nonsensical "0 of 0" on load — the summary now waits for real data. Lessons are grouped by unit again instead of one long undifferentiated list.

**Alex (Impatient Power User)**: Still faces the N+1 waterfall (unresolved, flagged above) — no fix applied here since a safe one requires a data-shape decision.

**Sam (Accessibility-Dependent User)**: The loading state now sets `aria-busy`/`aria-label`, matching the pattern already established elsewhere, instead of a silent content swap with no announcement.

## Minor Observations

- `.dashboard` class itself has no CSS rule of its own (rides entirely on `.section-shell`) — left as-is, harmless.
- Lesson list now uses `<ol>` nested per unit, matching CourseDetail's semantic structure, instead of a flattened `<ul>` — resolves the earlier divergence between the two pages for the same underlying data shape.

## Questions to Consider

1. Does "My progress" need to re-fetch and render every enrolled course's full lesson detail on every visit, or would a lighter progress summary (per-course completed/total counts only) serve the actual job faster, without the N+1 waterfall?
2. Would a "continue where you left off" primary CTA (surfacing just the next incomplete lesson) serve this page's actual purpose better than a full course-by-course list as the default view?
