# 006 — Cover `border-color`/`background` in the shared `.button` transition so all variants animate on hover

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file (`frontend/src/styles/global.css`), 1 rule

## Problem

The shared base rule for all buttons only transitions `transform` and `box-shadow`:

```css
/* frontend/src/styles/global.css:169-180 — current (.header-cta,.button shared) */
.header-cta,
.button {
  border: 0;
  border-radius: 5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  text-decoration: none;
  transition: transform var(--duration-fast) var(--ease-out);
}
```

```css
/* frontend/src/styles/global.css:208-211 — current (.button adds box-shadow) */
.button {
  padding: 14px 18px;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
}
```

Three button variants change `border-color` or `background` on `:hover`, and none of those properties are in the transition list above, so they snap instantly instead of transitioning:

```css
/* frontend/src/styles/global.css:332-334 */
.button-secondary:hover {
  border-color: var(--blue);
}
```

```css
/* frontend/src/styles/global.css:347-349 */
.button-danger:hover {
  background: #f9d0cc;
}
```

```css
/* frontend/src/styles/global.css:316-319 */
.button-secondary-dark:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.8);
}
```

## Target

Add `border-color` and `background-color` to the `.button` rule's transition list (the one at `global.css:208-211`, which already extends the shared `.header-cta, .button` base at `global.css:169-180` with `box-shadow`):

```css
/* frontend/src/styles/global.css:208-211 — target */
.button {
  padding: 14px 18px;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out), background-color var(--duration-fast) var(--ease-out);
}
```

Note: `.button-secondary-dark:hover` and `.button-danger:hover` set `background` (the shorthand), not `background-color`. Transitioning `background-color` still animates a plain color value assigned via the `background` shorthand (the browser treats `background: #f9d0cc` as setting `background-color: #f9d0cc` when no image/position/etc. is present, which is the case in both of these rules) — confirm this is true for both call sites before proceeding (i.e., neither `background` declaration includes a gradient or image; both are flat hex/rgba colors, confirmed in the Problem section above).

## Repo conventions to follow

- `var(--duration-fast) var(--ease-out)` is the established hover-transition pattern in this file for other properties (e.g. `frontend/src/styles/global.css:670` `.course-card`'s `transform ..., box-shadow ...`) — match that exact token pairing for the two new properties, not a different duration.
- `.header-cta`, which shares the base rule at `global.css:169-180`, does not have any `:hover` rule that changes `border-color`/`background` (only `transform`), so it doesn't need the new properties — but since `.header-cta` and `.button` share one selector list at `169-180` while `.button` gets its own separate, more specific rule at `208-211` that already overrides `transition` for box-shadow, add the new properties to the `208-211` rule only (matching where `box-shadow` was already added), not to the shared `169-180` block.

## Steps

1. In `frontend/src/styles/global.css:208-211`, replace the `.button` rule's `transition` declaration with the target shown above, adding `border-color var(--duration-fast) var(--ease-out)` and `background-color var(--duration-fast) var(--ease-out)` to the existing `transform`/`box-shadow` list.

## Boundaries

- Do NOT modify the shared `.header-cta, .button` base rule at `global.css:169-180` — only the `.button`-only rule at `208-211`.
- Do NOT change any `:hover`/`:active` rule's declarations (`.button-secondary`, `.button-danger`, `.button-secondary-dark`) — only the base `.button` transition list.
- Do NOT add new dependencies.
- If the `.button` rule at `208-211` doesn't match the excerpt above (drift since commit `066382c`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors (CSS-only change).
- **Feel check**: run `npm run dev`.
  - On `/` (homepage), hover the dark hero path card's "Learn about the in-person course" button (`.button-secondary-dark`) — the border and background should ease in over ~150ms, not snap.
  - Sign in and visit `/account` — hover "Send password reset email" / "Sign out" (`.button-secondary`) and confirm the border-color eases in; hover "Delete account" (`.button-danger`) and confirm the background eases in.
  - Confirm `.button-primary` (e.g. "Browse courses" on the homepage) is visually unchanged — it has no hover `border-color`/`background` rule, so this change is a no-op for it.
  - In DevTools Animations panel at 10% playback speed, hover `.button-danger` and confirm the background color visibly interpolates rather than jump-cutting.
- **Done when**: `global.css:208-211`'s `.button` transition list includes `border-color` and `background-color`, and all three affected hover states (`.button-secondary`, `.button-danger`, `.button-secondary-dark`) visibly ease rather than snap.
