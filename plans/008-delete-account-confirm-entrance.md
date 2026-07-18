# 008 — Animate the "Delete account" confirmation panel's entrance

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file (`frontend/src/styles/global.css`), 1 new rule

## Problem

Clicking "Delete account" on `/account` swaps the button for a warning message and two action buttons via a hard conditional render — the new content mounts with no transition at all, causing an instant layout jump:

```tsx
/* frontend/src/pages/MyAccount.tsx:129-160 — current (relevant excerpt) */
{!confirmingDelete ? (
  <button className="button button-danger" onClick={() => setConfirmingDelete(true)}>
    Delete account
  </button>
) : (
  <div className="account-delete-confirm">
    <p className="auth-error" role="alert">
      Are you sure? This will permanently delete your account and can't be undone.
    </p>
    <div className="account-delete-confirm-actions">
      <button
        className="button button-danger"
        onClick={() => void handleDelete()}
        disabled={deleteStatus === 'deleting'}
      >
        {deleteStatus === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
      </button>
      <button
        className="button button-secondary"
        onClick={() => setConfirmingDelete(false)}
        disabled={deleteStatus === 'deleting'}
      >
        Cancel
      </button>
    </div>
    {deleteStatus === 'error' && (
      <p className="auth-error" role="alert">
        Couldn't delete your account — try again.
      </p>
    )}
  </div>
)}
```

```css
/* frontend/src/styles/global.css — .account-delete-confirm currently has no animation */
.account-delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  max-width: 260px;
}
```

This is the app's one irreversible, destructive-confirmation moment. AUDIT.md §4's asymmetric-timing principle applies directly: "deliberate phases (press, hold, destructive confirm) animate slower; the system's response snaps." Right now there's no deliberate phase at all — the confirmation state teleports in, giving the user no visual beat to register that they've entered a higher-stakes state before the two buttons become tappable.

## Target

Add an entrance animation to `.account-delete-confirm` reusing the exact same `content-fade-in` keyframe and timing already used elsewhere in this file for a similar "reveal a caution panel" moment (`.legal-draft-notice`, `frontend/src/styles/global.css:480-493`, a warning-styled callout that already uses `animation: content-fade-in var(--duration-base) var(--ease-out) both;`).

```css
/* target */
.account-delete-confirm {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  max-width: 260px;
  animation: content-fade-in var(--duration-base) var(--ease-out) both;
}
```

`content-fade-in` (`frontend/src/styles/global.css:32-41`) is a 4px upward opacity fade — subtle enough not to read as playful, appropriately restrained for a destructive-action confirmation, and already the app's established "a new piece of content just appeared" language (used for `.course-card`, `.unit-block`, `.practice-feedback`, and others).

## Repo conventions to follow

- Reuse the existing `content-fade-in` keyframe (`frontend/src/styles/global.css:32-41`) — do not define a new keyframe. This repo already has one canonical "content just appeared" animation; introducing a second, near-identical one would itself be a cohesion regression (the exact anti-pattern AUDIT.md §7 warns against).
- `var(--duration-base) var(--ease-out)` is the token pairing every other `content-fade-in` call site uses (e.g. `frontend/src/styles/global.css:671`, `:724`, `:810`) — match it exactly, do not pick a custom duration.
- `.legal-draft-notice` (`frontend/src/styles/global.css:480-493`) is the closest exemplar: a warning-toned callout box using this exact animation — imitate its usage of the animation declaration, not its color/background styling (which is unrelated to this change).

## Steps

1. In `frontend/src/styles/global.css`, find the `.account-delete-confirm` rule (added alongside the other `.account-*` rules in the same file; search for `.account-delete-confirm {` if the line number has shifted since commit `066382c`).
2. Add `animation: content-fade-in var(--duration-base) var(--ease-out) both;` as the last declaration inside that rule, leaving `display`, `flex-direction`, `align-items`, `gap`, and `max-width` unchanged.

## Boundaries

- Do NOT animate the "Delete account" button's exit (the button disappearing when `confirmingDelete` becomes `true`) — only the confirm panel's entrance. Animating both simultaneously risks a double-expose crossfade that AUDIT.md §7 warns about; keep this to a single, simple entrance.
- Do NOT change `frontend/src/pages/MyAccount.tsx` — this is a CSS-only change; the existing conditional render structure already mounts/unmounts `.account-delete-confirm` via React, which is sufficient to trigger the CSS animation on mount with no code changes needed.
- Do NOT add new dependencies.
- If `.account-delete-confirm` doesn't exist in `global.css`, or its declarations don't match the excerpt above (drift since commit `066382c`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors (CSS-only change).
- **Feel check**: run `npm run dev`, sign in, go to `/account`, scroll to "Delete account", and click it:
  - The confirmation panel (warning text + "Yes, delete my account" / "Cancel" buttons) should fade in with a subtle upward drift (4px), not snap into place.
  - Click "Cancel", then click "Delete account" again — confirm the fade-in replays each time the panel remounts (it will, since React unmounts/remounts the element on each toggle of `confirmingDelete`).
  - In DevTools Animations panel at 10% playback, confirm the panel's opacity and `translateY` both animate smoothly over the ~220ms duration.
  - Toggle `prefers-reduced-motion` — the panel should still appear, just without the animated fade (governed by the existing global `0.01ms` override, or — if plan 004 has already been applied — the shorter opacity-only fade from that plan; either is acceptable, since `.account-delete-confirm` was not in plan 004's original selector list and doesn't need to be added for this plan to be considered done).
- **Done when**: `.account-delete-confirm` has the `content-fade-in` animation applied, the fade is visible on every mount (not just the first), and no other element's animation or the button's disappearance was touched.
