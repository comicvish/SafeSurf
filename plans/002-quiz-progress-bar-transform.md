# 002 — Animate the quiz progress bar with `transform: scaleX()` instead of `width`

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: MEDIUM-HIGH
- **Category**: Performance / Easing

- **Estimated scope**: 2 files (`frontend/src/styles/global.css`, `frontend/src/pages/Practice.tsx`), ~10 lines changed

## Problem

The quiz progress bar animates the `width` CSS property — a layout property, per AUDIT.md §5 always a finding ("Animate `transform` and `opacity` only"). It also uses bare `ease`, but AUDIT.md §2 explicitly classifies progress bars as "constant motion" and specifies `linear` as the target easing — `ease` is the wrong curve, not just an unspecified one.

```css
/* frontend/src/styles/global.css:1252-1257 — current */
.practice-progress-bar {
  height: 100%;
  background: var(--gold);
  border-radius: 999px;
  transition: 0.3s width ease;
}
```

```tsx
/* frontend/src/pages/Practice.tsx:189-191 — current */
<div className="practice-progress">
  <div className="practice-progress-bar" style={{ width: `${progress}%` }} />
</div>
```

This fires on every question advance in every quiz — occasional per-user frequency, but every animation frame during the transition forces a layout recalculation of the bar (and, because it's a layout change, can affect paint timing of sibling content) instead of a pure compositor-thread transform.

## Target

Animate `transform: scaleX()` from a `transform-origin: left` anchor instead of `width`, so the bar always renders at 100% width and is visually scaled — this keeps the fill numerically identical (`scaleX(0.6)` looks the same as `width: 60%` when anchored left) while moving the animated property fully onto the compositor thread.

```css
/* frontend/src/styles/global.css:1252-1257 — target */
.practice-progress-bar {
  height: 100%;
  width: 100%;
  background: var(--gold);
  border-radius: 999px;
  transform-origin: left;
  transition: transform 300ms linear;
}
```

```tsx
/* frontend/src/pages/Practice.tsx:189-191 — target */
<div className="practice-progress">
  <div className="practice-progress-bar" style={{ transform: `scaleX(${progress / 100})` }} />
</div>
```

## Repo conventions to follow

- The repo has `--duration-fast: 150ms` and `--duration-base: 220ms` tokens in `frontend/src/styles/tokens.css`, but 300ms here is a deliberate, pre-existing value that doesn't map to either token and is within the "UI animations stay under 300ms" budget from AUDIT.md §2 — keep it as a literal `300ms`, do not force it onto an existing token.
- `linear` is used for the one other continuous/looping animation in the codebase, `@keyframes skeleton-pulse` (`frontend/src/styles/global.css:816`, `animation: skeleton-pulse 1.6s ease-in-out infinite` — note that one is actually `ease-in-out` not `linear`, so it is not a usable exemplar; there is no existing `linear` transition in the file). This is a new but AUDIT.md-mandated pattern — cite AUDIT.md §2's "Constant motion (marquee, progress) → linear" rule directly if asked why.
- Other transform-based hover transitions in this file (e.g. `frontend/src/styles/global.css:670`, `.course-card`) use the `property duration var(--token)` order (`transform var(--duration-base) var(--ease-out)`) — match that shorthand order (`property duration timing-function`) for the new `transform 300ms linear` declaration, consistent with the rest of the file even though `linear` isn't itself a token.

## Steps

1. In `frontend/src/styles/global.css:1252-1257`, replace the `.practice-progress-bar` rule:
   - Add `width: 100%;` (the element must always span the full track now that fill is expressed via scale, not width).
   - Add `transform-origin: left;`.
   - Replace `transition: 0.3s width ease;` with `transition: transform 300ms linear;`.
2. In `frontend/src/pages/Practice.tsx:190`, replace `style={{ width: `${progress}%` }}` with `style={{ transform: `scaleX(${progress / 100})` }}`.
3. Confirm `progress` (the variable used at `Practice.tsx:190`) is a number in the 0-100 range wherever it's computed upstream in this file — search for `const progress` or `progress =` earlier in `Practice.tsx` and confirm the divide-by-100 in step 2 matches its existing scale (it should already be a percentage, since the current code interpolates it directly into a `%` string).

## Boundaries

- Do NOT touch `.practice-progress` (the track/container, `global.css:1244-1250`) — only `.practice-progress-bar` changes.
- Do NOT change how `progress` is calculated in `Practice.tsx` — only the JSX `style` prop that consumes it.
- Do NOT add new dependencies.
- If `.practice-progress-bar` or the `progress` variable don't match the excerpts above (drift since commit `066382c`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors.
- **Feel check**: run `npm run dev`, start any quiz (`/lessons/:lessonId/practice` while signed in), and advance through 2-3 questions:
  - The bar should visibly fill left-to-right at a constant, unchanging speed for the full 300ms (that's what `linear` looks like — no fast-start or slow-end the way the old `ease` curve had).
  - The bar must still visually anchor to the left edge and grow rightward, exactly matching the old `width`-based look — confirm there's no jump or offset introduced by the `scaleX` + `transform-origin: left` swap.
  - In DevTools Performance panel, record while advancing a question — confirm the `practice-progress-bar` element no longer triggers "Layout" work, only "Composite Layers."
  - Toggle `prefers-reduced-motion` — the bar should still jump to the correct fill amount near-instantly (governed by the existing global `0.01ms` override), just without the animated fill.
- **Done when**: `global.css`'s `.practice-progress-bar` no longer contains `width` in its `transition` property list, `Practice.tsx` no longer sets `width` in the bar's inline `style`, and the feel checks above pass.
