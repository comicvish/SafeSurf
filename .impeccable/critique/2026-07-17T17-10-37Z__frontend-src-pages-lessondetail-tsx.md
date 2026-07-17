---
target: LessonDetail.tsx
total_score: 21
p0_count: 0
p1_count: 2
timestamp: 2026-07-17T17-10-37Z
slug: frontend-src-pages-lessondetail-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | "Mark as complete" gave an instant flip but no durable confirmation; practice-session load failures were silently indistinguishable from "no quiz exists." |
| 2 | Match System / Real World | 3/4 | Plain language throughout; breadcrumb matches the real course/unit mental model. |
| 3 | User Control and Freedom | 2/4 | Clicking "✓ Completed" again silently un-marked it with no confirm; full-page load error had no retry/back path. |
| 4 | Consistency and Standards | 2/4 | `.button-complete` and `.button-primary` were pixel-identical; loading state was plain text while other surfaces already use the skeleton pattern. |
| 5 | Error Prevention | 1/4 | Nothing prevented accidentally re-toggling completion off. |
| 6 | Recognition Rather Than Recall | 3/4 | Breadcrumb and visible prev/next nav keep orientation. |
| 7 | Flexibility and Efficiency | 2/4 | No prefetch/continuity between prev/next lesson clicks. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean single column; two identically-styled gold buttons stacked was the one wrinkle. |
| 9 | Error Recovery | 1/4 | Load errors and the practice-session failure gave no retry action or specific cause. |
| 10 | Help and Documentation | 2/4 | No help affordance, but register reduces the need. |
| **Total** | | **21/40** | **Acceptable, with real gaps at the highest-stakes moment (completion)** |

## Anti-Patterns Verdict

**LLM assessment**: Not AI slop — typography, color, and glass-surface treatment are consistent, restrained, purposeful. The failures were UX/product-craft gaps (feedback, hierarchy, error recovery), not aesthetic tells. `VideoEmbed` correctly uses `youtube-nocookie.com`, a real per-lesson `title` attribute, and an aspect-ratio box.

**Deterministic scan**: `detect.mjs` on LessonDetail.tsx + VideoEmbed.tsx — exit 0, zero findings across both files.

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

The video → summary → complete → practice → next chain is the core learning loop, and the peak moment (marking a lesson complete) was exactly where feedback went thin: same gold color as a plain CTA, no accessible announcement, and silently reversible with a single accidental tap. That's a direct miss against PRODUCT.md's "learning that shows its progress" principle. Fixed directly, along with the load-state and consistency gaps.

## What's Working

1. **Optimistic UI on `toggleComplete`** — instant flip, rollback on failure — the right technical instinct for perceived responsiveness.
2. **Signed-out state handled honestly** ("Sign in to track your progress" / "Sign in to unlock the practice quiz") rather than hiding the feature or showing a disabled ghost button.
3. **Correct race-condition handling and privacy-conscious video embed** — `youtube-nocookie.com`, real per-lesson titles, aspect-ratio box preventing layout shift.

## Priority Issues

**[P1] "Mark as complete" gave no durable, accessible confirmation, and looked identical to a normal CTA.**
- **What**: `.button-complete` used the exact same gold gradient/shadow as `.button-primary`; only the label text differed. No `aria-live`, no success-color vocabulary despite the system already defining `--success` green for exactly this purpose.
- **Fix applied**: Completed state now renders as a green `.lesson-complete-badge` (uses `--success`/`--success-tint` tokens, not gold) instead of a same-colored button, plus a visually-hidden `role="status" aria-live="polite"` region that announces "Lesson marked complete." / "Lesson marked not complete." on every toggle.
- **Files**: `frontend/src/pages/LessonDetail.tsx`, `frontend/src/styles/global.css`

**[P1] Completed button silently toggled back off with no confirmation.**
- **What**: The same click handler ran regardless of current state, so a second tap on "✓ Completed" un-marked it with zero warning — risky for a senior audience prone to double-tapping to confirm a state registered.
- **Fix applied**: Once complete, the primary button is replaced by the green completion badge (non-interactive) plus a distinctly separate, lower-affordance `.text-link` reading "Mark as not complete" — reversal now requires a deliberate, differently-styled action instead of tapping the same button twice.
- **File**: `frontend/src/pages/LessonDetail.tsx`

**[P2] Full-page load failure and silent practice-session failure both dead-ended the user.**
- **What**: The lesson-load error showed only static text with no retry action; a `getPracticeSession` failure was caught identically to "no practice quiz exists," so a network blip was indistinguishable from a lesson genuinely having no quiz.
- **Fix applied**: Load-error state now includes a "Try again" button (bumps a retry counter that re-runs the fetch effect). A new `practiceLoadFailed` state distinguishes a real practice-session fetch failure from the normal "no quiz for this lesson" case, showing a small, low-key note only in the genuine-failure case.
- **File**: `frontend/src/pages/LessonDetail.tsx`

**[P2] Two identically-styled gold buttons could appear stacked with different real meanings.**
- **What**: "✓ Completed" and "Start practice" both rendered in the same gold gradient when a lesson was both complete and had a quiz, diluting the One Accent Rule.
- **Fix applied**: Resolved as a direct consequence of the P1 fix above — the completed state no longer uses gold at all, so gold now appears only once (on the live "Start practice" action).

**[P3] Loading state regressed to plain text instead of the app's existing skeleton pattern.**
- **What**: `"Loading lesson…"` centered text, inconsistent with the skeleton vocabulary already shipped on CourseList.
- **Fix applied**: Replaced with a shaped skeleton matching the real layout — an eyebrow-width bar, a title-width bar, a pulsing 16:9 video placeholder (`.video-embed--skeleton`), and two summary-width bars — using the same `.skeleton-line`/`skeleton-pulse` tokens, with `aria-busy="true"` on the container.
- **Files**: `frontend/src/pages/LessonDetail.tsx`, `frontend/src/styles/global.css`

## Persona Red Flags

**Jordan (Confused First-Timer)**: No longer at risk of re-tapping "Mark as complete" to "be sure" and accidentally un-marking it — completion is now a distinct badge, and reversal requires a separate, clearly different action. A failed lesson load now offers a visible "Try again" instead of a dead end.

**Sam (Accessibility-Dependent User)**: Completion state changes are now announced via a live region instead of relying solely on a label-text flip a screen reader might miss.

**"Eleanor" (project-specific, 74-year-old first-time learner)**: The green completion badge now reads as a clear, unambiguous "done" signal (closer to her expected mental model of a due-date stamp) rather than looking like a second action competing with "Start practice."

## Minor Observations

- Empty `<span />` placeholders in `.lesson-nav` (for missing prev/next) now carry `aria-hidden="true"` so they don't register as ambiguous tappable-looking gaps for assistive tech.
- The checkmark literal `✓` in the completion badge (not an SVG icon) remains a minor inconsistency with icon usage elsewhere, though it reads fine and is verbalized sensibly by screen readers — left as-is, not worth a new icon component for one instance.
- No prefetch/transition continuity between Prev/Next lesson clicks remains a (correctness-neutral) missed opportunity for a smoother feel — out of scope for this pass.

## Questions to Consider

1. Should "Start practice" only appear after completion (a designed sequence: watch → confirm done → then practice unlocks), rather than both competing for attention simultaneously? Not changed in this pass since it's a flow/IA decision, not a bug.
2. Is there a plan for prefetching or transition continuity between prev/next lessons within the same learning session?
