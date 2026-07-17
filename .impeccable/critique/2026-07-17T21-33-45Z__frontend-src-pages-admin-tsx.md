---
target: Admin.tsx
total_score: 18
p0_count: 0
p1_count: 3
timestamp: 2026-07-17T21-33-45Z
slug: frontend-src-pages-admin-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | The two initial fetches rendered nothing while pending — no skeleton, no spinner, no text. |
| 2 | Match System / Real World | 3/4 | Plain, domain-appropriate language for an internal tool. |
| 3 | User Control and Freedom | 2/4 | Cancel existed on the assign form, but no way to dismiss/retry a failed top-level fetch short of a full reload. |
| 4 | Consistency and Standards | 2/4 | `AssignForm`'s error was correctly scoped locally; the top-level fetches shared one `error` variable across two independent operations — same bug class, handled two different ways in one file. |
| 5 | Error Prevention | 1/4 | Nothing stopped two admins racing on the suggested `order` value; no confirm before silently discarding an in-progress second form. |
| 6 | Recognition Rather Than Recall | 3/4 | Dropdowns and badges keep state visible, not memorized. |
| 7 | Flexibility and Efficiency | 1/4 | No bulk-assign, effectively one-video-at-a-time via a single shared `assigningVideoId`. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean, appropriately dense for an internal tool. |
| 9 | Error Recovery | 1/4 | Every error was a flat generic sentence with no retry button; two independent failures could collapse into one visible message. |
| 10 | Help and Documentation | 0/4 | No inline explanation of what "order within unit" governs or what happens after assignment. |
| **Total** | | **18/40** | **Poor — happy path is fine, failure and concurrency paths were unbuilt** |

## Anti-Patterns Verdict

**LLM assessment**: Not decorative slop — reuses the site's real button/input classes, no invented affordances. The product-register tell here was under-built state handling: a single shared `error` string doing the job of two distinct fetches, no loading feedback at all during the initial fetches, and zero retry affordance anywhere. `product.md`'s own language fits exactly: this page shipped default/error states but was missing loading and recovery entirely.

**Deterministic scan**: `detect.mjs` on Admin.tsx — exit 0, zero findings.

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

The `AssignForm` sub-component already did state-scoping correctly (its own local `error`/`submitting`/`units`); the top-level page just didn't mirror that pattern for its own two fetches. Fixed by bringing the same discipline to the top level, plus fixing the single-form-at-a-time data-loss bug.

## What's Working

1. **State-scoping done right in `AssignForm`** — its own `error`, `submitting`, and `units` are correctly localized to the component instance.
2. **Honest partial-failure messaging** — "Lesson created, but the practice quiz could not be generated — check the server logs" tells the admin precisely what partially failed instead of pretending the whole operation succeeded or failed monolithically.
3. **Restrained, on-brand visual language** — the Lit Glass `.admin-video-card`, gold primary button, and DM Mono `.admin-warning` pill all reuse real design tokens rather than inventing admin-specific chrome.

## Priority Issues

**[P1] Two independent top-level fetch failures collapsed into one error message, silently discarding the other.**
- **What**: `refreshVideos` and `listCourses` both wrote to the same `error` state; if both failed, only the last one's message survived.
- **Fix applied**: Split into separate `videosError`/`coursesError` state, each rendered independently — mirroring the pattern `AssignForm` already used correctly.
- **File**: `frontend/src/pages/Admin.tsx`

**[P1] No retry affordance on any load or sync failure.**
- **What**: None of the error paths offered a way to recover short of a full page reload.
- **Fix applied**: Added a "Try again" text-link next to both the videos and courses error messages, each re-running its own fetch function.
- **File**: `frontend/src/pages/Admin.tsx`

**[P1] `assigningVideoId` was a single string, so opening a second video's form silently discarded the first's in-progress edits.**
- **What**: Clicking "Assign to a lesson" on video B while video A's form was open unmounted A immediately, losing any typed course/unit/order/summary with zero warning — a real risk for an admin batch-processing many videos per sync.
- **Fix applied**: Replaced the single ID with a `Set<string>` of open form IDs, so multiple videos' assign forms can be open concurrently without any of them silently closing.
- **File**: `frontend/src/pages/Admin.tsx`

**[P2] `order` default has no race protection — flagged, not fixed.**
- **What**: The suggested next order (`unit.lessons.length + 1`) is computed purely from the client's last-fetched snapshot; two admins working the same unit concurrently could both be offered the same number.
- **Status**: Not fixed — whether the backend enforces order uniqueness on assignment is unverified from the frontend alone. If it doesn't, that's a backend correctness issue, not a UI polish item; flagged rather than guessed at.
- **Suggested command**: `/impeccable harden` (backend-side, once confirmed)

**[P3] Thumbnail `alt=""` — reviewed, left as-is.**
- **What**: The empty alt is defensible if video titles reliably disambiguate one video from another (the adjacent `<strong>{title}</strong>` carries the identifying information). Whether that holds for this specific YouTube channel's naming conventions can't be verified from source alone.
- **Status**: Left unchanged as a judgment call rather than guessed at either way.

## Persona Red Flags

**"Priya" — Internal Admin/Curator (project-specific)**: No longer loses an in-progress form by clicking into a second video (P1 fix). Now sees which specific fetch failed (videos vs. courses) instead of one ambiguous message, with a real retry action for each.

**Sam (Accessibility-Dependent User)**: Added `role="status" aria-live="polite"` to the sync-result and assign-note confirmation messages, and `role="alert"` to all error messages, so a screen-reader user is now announced these state changes instead of needing to re-scan the page.

## Minor Observations

- `syncResult` still persists indefinitely with no dismiss action — left as-is; low-risk, and dismissing it removes a useful at-a-glance summary rather than adding confusion.
- The badge stack (`Not embeddable`, privacy status) still shares one visual treatment regardless of severity — not addressed in this pass, a `/impeccable colorize` candidate if triage-at-a-glance becomes a real workflow need.

## Questions to Consider

1. Does the backend enforce `order` uniqueness per unit, or could two concurrent assignments actually collide? This determines whether the P2 above needs a backend fix.
2. Now that multiple assign forms can stay open concurrently, would a "N videos being assigned" summary count be useful feedback for an admin working through a large batch?
