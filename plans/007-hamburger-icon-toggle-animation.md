# 007 — Animate the hamburger icon into an X when the mobile nav opens

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: MEDIUM
- **Category**: Missed opportunity
- **Estimated scope**: 2 files (`frontend/src/styles/global.css`, `frontend/src/components/Header.tsx`), ~20 lines changed

## Problem

The mobile hamburger button is three static `<span>` bars with no visual state change of its own — the only feedback that it's a toggle, and that it's currently open, is the nav panel appearing below it and `aria-expanded` (which is not visually rendered). This is a well-established micro-interaction gap: every mainstream hamburger-to-X pattern gives the icon itself a state, so users get immediate confirmation their tap registered before the panel finishes opening.

```tsx
/* frontend/src/components/Header.tsx:19-29 — current */
<button
  className="menu-toggle"
  aria-label="Toggle menu"
  aria-expanded={menuOpen}
  aria-controls="main-navigation"
  onClick={() => setMenuOpen((open) => !open)}
>
  <span />
  <span />
  <span />
</button>
```

```css
/* frontend/src/styles/global.css:152-167 — current */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  border: 0;
  background: transparent;
  padding: 8px;
}

.menu-toggle span {
  width: 22px;
  height: 2px;
  background: var(--ink);
  display: block;
}
```

## Target

Drive the icon's open state off the existing `menuOpen` boolean by toggling a class on the button, and morph the three bars into an X with `transform` only (GPU-friendly, no layout properties): the top bar rotates 45° and translates down to the center, the middle bar fades out, the bottom bar rotates -45° and translates up to the center.

```tsx
/* frontend/src/components/Header.tsx:19-29 — target */
<button
  className={menuOpen ? 'menu-toggle open' : 'menu-toggle'}
  aria-label="Toggle menu"
  aria-expanded={menuOpen}
  aria-controls="main-navigation"
  onClick={() => setMenuOpen((open) => !open)}
>
  <span />
  <span />
  <span />
</button>
```

```css
/* frontend/src/styles/global.css:152-167 — target */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  border: 0;
  background: transparent;
  padding: 8px;
}

.menu-toggle span {
  width: 22px;
  height: 2px;
  background: var(--ink);
  display: block;
  transform-origin: center;
  transition: transform var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
}

.menu-toggle.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.menu-toggle.open span:nth-child(2) {
  opacity: 0;
}

.menu-toggle.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
```

The `translateY(7px)`/`translateY(-7px)` values are derived from this button's own geometry: three 2px-tall bars with `gap: 5px` between them puts the first and third bars 7px above/below the middle one (`2px height + 5px gap = 7px` center-to-center) — so translating the outer bars by 7px lands them exactly on the middle bar's position before rotating into the X. If you change `.menu-toggle`'s `gap` or `.menu-toggle span`'s `height`, recompute this offset as `gap + height`.

## Repo conventions to follow

- `var(--duration-fast) var(--ease-out)` is the established token pairing for quick UI feedback transitions in this file (e.g. `frontend/src/styles/global.css:179`) — reuse it exactly, do not introduce a new duration.
- The mobile nav's own open/close toggling already follows a `className={menuOpen ? 'open' : undefined}` pattern in `Header.tsx:30` (`<nav ... className={menuOpen ? 'open' : undefined}>`) — this plan's `menuOpen ? 'menu-toggle open' : 'menu-toggle'` mirrors that same convention, just needing the base class preserved alongside it.

## Steps

1. In `frontend/src/components/Header.tsx:20`, change `className="menu-toggle"` to `className={menuOpen ? 'menu-toggle open' : 'menu-toggle'}`.
2. In `frontend/src/styles/global.css:162-167`, add `transform-origin: center;` and `transition: transform var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out);` to the existing `.menu-toggle span` rule (keep the existing `width`, `height`, `background`, `display` declarations unchanged).
3. Immediately after that rule, add the three new `.menu-toggle.open span:nth-child(n)` rules shown in Target.

## Boundaries

- Do NOT change `.menu-toggle`'s own layout properties (`display`, `flex-direction`, `gap`, `padding`) — only `.menu-toggle span` and the new `.open` state rules.
- Do NOT change the button's `aria-label`, `aria-expanded`, or `aria-controls` — accessibility semantics are already correct and untouched by this visual-only change.
- Do NOT add new dependencies.
- If `.menu-toggle`'s `gap` (currently `5px`) or `.menu-toggle span`'s `height` (currently `2px`) have changed from the values above (drift since commit `066382c`), recompute the `translateY` offset as `gap + height` before writing the new rules, rather than using `7px` blindly.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors.
- **Feel check**: run `npm run dev`, resize to under 720px width:
  - Tap the hamburger — the top and bottom bars should rotate and slide into a clean X shape, the middle bar should fade out, all within ~150ms, synchronized with (or slightly ahead of) the nav panel opening from plan 001.
  - Tap again to close — the X should un-rotate back into three parallel bars, middle bar fading back in.
  - Confirm the X's two bars actually cross at the center (no visible offset/gap where they meet) — if they don't, the `translateY` math needs adjusting per the note in Target.
  - In DevTools Animations panel at 10% playback, confirm only `transform` and `opacity` are animating on the spans (no layout properties).
  - Toggle `prefers-reduced-motion` — the icon should still switch to/from the X shape, just without the eased rotation (governed by the existing global `0.01ms` override — this is a state-conveying icon change, not decorative movement, so an instant snap is the correct reduced-motion behavior here, not a fade).
- **Done when**: tapping the hamburger reliably morphs it into a visually clean X and back, using only `transform`/`opacity`, matching the `menuOpen` state at every step (no desync if tapped rapidly).
