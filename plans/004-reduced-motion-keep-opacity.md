# 004 — Give reduced-motion users a gentle opacity fade instead of an instant snap on entrances

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`frontend/src/styles/global.css`), 1 new block + 1 new keyframe

## Problem

The site's only `prefers-reduced-motion` handling is a blanket override that collapses every animation and transition to `0.01ms`:

```css
/* frontend/src/styles/global.css:54-63 — current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a correct, common baseline for purely positional motion (hover lifts, button press `scale()`, the mobile nav's open/close) — those should snap instantly under reduced motion, and this plan does not change that part.

But it also applies to every entrance animation that fades content in on mount (`fade-in-up`, `content-fade-in`, `pop-in` — all three combine `opacity` with a `transform`, e.g. `frontend/src/styles/global.css:21-30`, `:32-41`, `:43-52`). Under the blanket rule, that opacity fade also collapses to instant, so content just pops into existence with no transition at all. AUDIT.md §6 is explicit here: reduced motion should "keep transitions that aid comprehension, remove position changes" — not reduce everything to zero. An opacity-only fade contains no vestibular-triggering movement and is exactly the kind of transition that should survive.

This affects every element using one of the three entrance keyframes — confirmed via `grep -n "animation: fade-in-up\|animation: content-fade-in\|animation: pop-in" frontend/src/styles/global.css`, 12 call sites across 11 distinct selectors:

| Keyframe | Selector | Line |
| --- | --- | --- |
| `fade-in-up` | `.hero` | 234 |
| `content-fade-in` | `.legal-draft-notice` | 522 |
| `content-fade-in` | `.course-card` | 671 |
| `content-fade-in` | `.course-detail > h1, .course-detail > .course-description` | 717-719 |
| `content-fade-in` | `.unit-block` | 724 |
| `content-fade-in` | `.video-embed` | 810 |
| `content-fade-in` | `.lesson-summary` | 831 |
| `content-fade-in` | `.lesson-detail > .eyebrow, .lesson-detail > h1` | 834-836 |
| `content-fade-in` | `.practice-feedback` | 1336 |
| `pop-in` | `.lesson-complete-badge` | 873 |
| `pop-in` | `.admin-assign-form` | 1136 |
| `pop-in` | `.practice-result` | 1365 |

## Target

Add a new opacity-only keyframe and a second reduced-motion override block (higher specificity than the universal `*` selector, so it wins automatically) that retargets these 11 selectors to a short, gentle opacity fade instead of `0.01ms`:

```css
/* frontend/src/styles/global.css:54-63 — target (blanket rule unchanged, new block appended inside the same @media) */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .hero,
  .legal-draft-notice,
  .course-card,
  .course-detail > h1,
  .course-detail > .course-description,
  .unit-block,
  .video-embed,
  .lesson-summary,
  .lesson-detail > .eyebrow,
  .lesson-detail > h1,
  .practice-feedback,
  .lesson-complete-badge,
  .admin-assign-form,
  .practice-result {
    animation-name: reduced-motion-fade !important;
    animation-duration: 150ms !important;
  }
}

@keyframes reduced-motion-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

The `!important` on `animation-name`/`animation-duration` is necessary because it must override the same properties set by the original, more specific per-component rules (e.g. `.course-card`'s own `animation: content-fade-in var(--duration-base) var(--ease-out) both;` at `global.css:671`) — matching the `!important` already used in the surrounding blanket block for consistency.

## Repo conventions to follow

- New keyframes in this file are declared near the top alongside the existing three (`frontend/src/styles/global.css:21-52`) — place `@keyframes reduced-motion-fade` immediately after the `@media (prefers-reduced-motion: reduce)` block (i.e., right after line 63, before the existing `button, a { font: inherit; }` rule at line 65), keeping all four keyframe definitions grouped near the top of the file as the existing three already are.
- This AUDIT.md §6 code sample is the direct template for this change:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .element { animation: fade 0.2s ease; } /* keep opacity/color, drop movement */
  }
  ```

## Steps

1. In `frontend/src/styles/global.css`, after the existing `@media (prefers-reduced-motion: reduce) { ... }` block's closing `*` rule (currently ending at line 63), add the new selector list and `@keyframes reduced-motion-fade` exactly as shown in Target, still nested inside the same `@media` block for the selector list, with the `@keyframes` declared at the top level immediately after the media query closes.
2. Do not modify the existing `.hero`, `.course-card`, etc. rules themselves (their `animation: content-fade-in ...` declarations stay as-is for users without reduced-motion preference) — the new block only adds an override that applies exclusively inside `@media (prefers-reduced-motion: reduce)`.

## Boundaries

- Do NOT touch `skeleton-pulse` (`frontend/src/styles/global.css:650-657`, used by `.video-embed--skeleton` and course-card loading skeletons) — it's a looping background-position shift with no transform, and is a loading-state indicator; leave it governed by the existing blanket `0.01ms` cut. Out of scope for this plan.
- Do NOT touch any `transition:` declarations (hover lifts, button press feedback, mobile nav) — those remain correctly governed by the blanket `transition-duration: 0.01ms` rule; this plan only changes `animation`-based entrances.
- Do NOT add new dependencies.
- If the selector list for `content-fade-in`/`pop-in`/`fade-in-up` usage has changed from the 12 call sites listed above (drift since commit `066382c` — re-run `grep -n "animation: fade-in-up\|animation: content-fade-in\|animation: pop-in" frontend/src/styles/global.css` to confirm), update the selector list in the new block to match what you find, and note the discrepancy in your report rather than silently dropping or adding selectors.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors (CSS-only change).
- **Feel check**: run `npm run dev`, open Chrome DevTools Rendering panel, set "Emulate CSS media feature prefers-reduced-motion" to "reduce":
  - Reload the homepage — the hero (`.hero`) should fade in gently over ~150ms with no upward movement (compare to normal mode, where it also slides up 12px via `fade-in-up` — under reduced motion, only the opacity change should be visible, no slide).
  - Navigate to `/courses` — course cards should each opacity-fade in (staggered per the existing `nth-child` `animation-delay` rules, which are untouched) with no scale/translate.
  - Complete a quiz question in `/lessons/:lessonId/practice` (signed in) — the `.practice-feedback` panel should opacity-fade in, not instantly appear.
  - Confirm hover lifts (course card, buttons) and the mobile nav open/close still snap instantly under reduced motion — those must NOT have picked up the new fade (they're untouched by this plan; check `.course-card:hover` still applies `translateY` with `0.01ms` duration, i.e., effectively instant).
  - Toggle reduced-motion back off — confirm all 11 elements return to their original `fade-in-up`/`content-fade-in`/`pop-in` animations (translateY/scale slide included) at their original durations.
- **Done when**: with reduced-motion emulated, all 11 listed selectors show a ~150ms opacity-only fade (visible in DevTools Animations panel at 10% playback as a pure opacity keyframe, no transform), all other transitions/animations remain instant, and normal (non-reduced-motion) behavior is unchanged.
