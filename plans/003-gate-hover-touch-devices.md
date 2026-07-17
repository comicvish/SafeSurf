# 003 — Gate all `:hover` motion behind `(hover: hover) and (pointer: fine)`

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (`frontend/src/styles/global.css`), 9 rule blocks

## Problem

None of the 9 `:hover` rule blocks in `frontend/src/styles/global.css` are gated behind `@media (hover: hover) and (pointer: fine)`. On touch devices, tapping an element fires `:hover` and the hover styles stick until the user taps elsewhere ("sticky hover") — a well-documented mobile Safari/Chrome behavior. This app's audience is senior-heavy (per `PRODUCT.md`/`DESIGN.md`) and skews toward tablets and phones, so this is hit constantly, on the primary content surfaces (course cards, lesson lists) as well as every button.

All 9 current blocks, verbatim:

```css
/* frontend/src/styles/global.css:190-193 */
.header-cta:hover,
.button:hover {
  transform: translateY(-2px);
}

/* frontend/src/styles/global.css:256-259 */
.hero-path-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 16px 32px -18px rgba(10, 31, 51, 0.35);
}

/* frontend/src/styles/global.css:316-319 */
.button-secondary-dark:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.8);
}

/* frontend/src/styles/global.css:332-334 */
.button-secondary:hover {
  border-color: var(--blue);
}

/* frontend/src/styles/global.css:347-349 */
.button-danger:hover {
  background: #f9d0cc;
}

/* frontend/src/styles/global.css:474-476 */
.footer-legal-links a:hover {
  text-decoration: underline;
}

/* frontend/src/styles/global.css:674-677 */
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 12px 24px -14px rgba(15, 44, 82, 0.3);
}

/* frontend/src/styles/global.css:782-786 */
.lesson-list a:hover {
  transform: translateX(3px);
  border-color: var(--blue);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 10px 22px -12px rgba(15, 44, 82, 0.3);
}

/* frontend/src/styles/global.css:1294-1298 */
.practice-option:hover:not(:disabled) {
  border-color: var(--blue);
  transform: translateY(-1px);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 6px 14px -8px rgba(15, 44, 82, 0.25);
}
```

## Target

Wrap each block **individually, in place** (do not relocate or consolidate them into one shared media block elsewhere in the file — preserve each rule's current position in the cascade relative to its neighbors, since some share specificity-sensitive contexts with adjacent `:active`/`:disabled` rules for the same selector).

```css
/* frontend/src/styles/global.css:190-193 — target */
@media (hover: hover) and (pointer: fine) {
  .header-cta:hover,
  .button:hover {
    transform: translateY(-2px);
  }
}

/* frontend/src/styles/global.css:256-259 — target */
@media (hover: hover) and (pointer: fine) {
  .hero-path-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 16px 32px -18px rgba(10, 31, 51, 0.35);
  }
}

/* frontend/src/styles/global.css:316-319 — target */
@media (hover: hover) and (pointer: fine) {
  .button-secondary-dark:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.8);
  }
}

/* frontend/src/styles/global.css:332-334 — target */
@media (hover: hover) and (pointer: fine) {
  .button-secondary:hover {
    border-color: var(--blue);
  }
}

/* frontend/src/styles/global.css:347-349 — target */
@media (hover: hover) and (pointer: fine) {
  .button-danger:hover {
    background: #f9d0cc;
  }
}

/* frontend/src/styles/global.css:474-476 — target */
@media (hover: hover) and (pointer: fine) {
  .footer-legal-links a:hover {
    text-decoration: underline;
  }
}

/* frontend/src/styles/global.css:674-677 — target */
@media (hover: hover) and (pointer: fine) {
  .course-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 12px 24px -14px rgba(15, 44, 82, 0.3);
  }
}

/* frontend/src/styles/global.css:782-786 — target */
@media (hover: hover) and (pointer: fine) {
  .lesson-list a:hover {
    transform: translateX(3px);
    border-color: var(--blue);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 10px 22px -12px rgba(15, 44, 82, 0.3);
  }
}

/* frontend/src/styles/global.css:1294-1298 — target */
@media (hover: hover) and (pointer: fine) {
  .practice-option:hover:not(:disabled) {
    border-color: var(--blue);
    transform: translateY(-1px);
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 6px 14px -8px rgba(15, 44, 82, 0.25);
  }
}
```

## Repo conventions to follow

- This is a new pattern for the repo — there is no existing `(hover: hover)` usage to imitate (confirmed via `grep -n "hover: hover" frontend/src/styles/global.css`, zero results). AUDIT.md §6 provides the exact syntax to introduce:
  ```css
  @media (hover: hover) and (pointer: fine) {
    .element:hover { transform: scale(1.05); } /* touch fires false hovers on tap */
  }
  ```
- Do not touch any `:active` or `:disabled` rules for these same selectors (e.g. `frontend/src/styles/global.css:195-199` `.header-cta:active, .button:active`, or `:321-323` `.button-secondary-dark:active`, or `:336-338` `.button-secondary:active`, or `:351-353` `.button-danger:active`) — `:active` firing on tap is correct, desired touch feedback and must remain ungated.

## Steps

Perform each of the following 9 edits independently, in `frontend/src/styles/global.css`. For each, wrap the existing rule block in `@media (hover: hover) and (pointer: fine) { ... }`, indenting the rule's contents by 2 spaces, with no other changes to selectors or declarations:

1. `global.css:190-193` — `.header-cta:hover, .button:hover`
2. `global.css:256-259` — `.hero-path-card:hover`
3. `global.css:316-319` — `.button-secondary-dark:hover`
4. `global.css:332-334` — `.button-secondary:hover`
5. `global.css:347-349` — `.button-danger:hover`
6. `global.css:474-476` — `.footer-legal-links a:hover`
7. `global.css:674-677` — `.course-card:hover`
8. `global.css:782-786` — `.lesson-list a:hover`
9. `global.css:1294-1298` — `.practice-option:hover:not(:disabled)`

## Boundaries

- Do NOT gate `:active`, `:focus`, `:focus-visible`, or `:disabled` rules — only `:hover`.
- Do NOT relocate any of the 9 blocks to a different position in the file — wrap in place.
- Do NOT touch any other file.
- Do NOT add new dependencies.
- If any of the 9 selectors/declarations don't match the excerpts above exactly (drift since commit `066382c`), STOP and report that specific block instead of improvising — apply the other, unaffected edits normally.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors (this is a CSS-only change but confirms nothing else broke). Optionally run a CSS validator or `npx stylelint frontend/src/styles/global.css` if configured (check `frontend/package.json` first — if no stylelint script exists, skip this).
- **Feel check**: run `npm run dev`.
  - **Desktop (mouse)**: open the site in a normal desktop browser window and confirm every one of the 9 hover effects (button lift, hero path card lift, course card lift, lesson list slide, practice option border/lift, footer link underline) still works exactly as before on mouse hover.
  - **Touch**: open Chrome DevTools, toggle device toolbar to an actual touch device profile (e.g. "iPhone 14"), and tap a course card, a lesson list row, and a quiz option (mid-quiz). Confirm none of them get visually "stuck" in a hover-lifted/shadowed state after the tap — the element should return to its resting visual state once the tap ends (only `:active`'s press feedback, if any, should show momentarily).
  - In DevTools Rendering panel, there's no direct way to simulate `(hover: hover)` — the device toolbar's touch emulation is sufficient; confirm via the visual sticky-hover check above.
- **Done when**: all 9 blocks are wrapped in `@media (hover: hover) and (pointer: fine)`, desktop hover states are visually unchanged, and tapping the same elements on an emulated touch device shows no lingering hover state.
