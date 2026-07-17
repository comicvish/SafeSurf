# 001 — Replace mobile nav's `max-height` animation with a `grid-template-rows` reveal

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files (`frontend/src/styles/global.css`, `frontend/src/components/Header.tsx`), ~25 lines changed

## Problem

The mobile hamburger nav animates `max-height` from `0` to a hardcoded `480px` cap. `max-height`/`height` are layout properties — animating them forces the browser to recompute layout and paint on every frame, not just composite. This fires on every single mobile-viewport visitor who opens the nav (this is the *only* way to reach nav links below 720px width — not an edge case).

Two occurrences, both in `frontend/src/styles/global.css` inside the same `@media (max-width: 720px)` block:

```css
/* frontend/src/styles/global.css:1736-1759 — current */
.site-header nav {
  display: flex;
  position: absolute;
  top: 79px;
  left: 0;
  right: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  background: rgba(244, 247, 251, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--line);
  padding: 16px max(5vw, 28px) 24px;
  z-index: 10;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-6px);
  transition: max-height var(--duration-base) var(--ease-out), opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out), visibility 0s var(--duration-base);
}

.site-header nav.open {
  max-height: 480px;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: max-height var(--duration-base) var(--ease-out), opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}
```

The `480px` cap is also a magic number disconnected from actual content height — if nav content ever grows past that (e.g. a longer admin-only link set), it will clip.

The nav's children currently sit directly inside `<nav>` (`frontend/src/components/Header.tsx:30-59`) — there is no single wrapper element around them, which the `grid-template-rows` technique requires. This plan adds one.

## Target

`<nav>` itself becomes the grid row track (`grid-template-rows: 0fr` → `1fr`), and a new inner wrapper (`.site-header nav .nav-inner`) holds the existing children so it can be measured as the row's intrinsic content and collapsed via `min-height: 0; overflow: hidden`. This is the standard CSS-only technique for animating a container to its content's natural height without ever touching `height`/`max-height` — the animated property is `grid-template-rows`, which is a `transform`-adjacent, layout-but-GPU-friendlier property that composites more cheaply than repeatedly recomputing `max-height` against an oversized, mostly-empty box.

```css
/* frontend/src/styles/global.css:1736-1759 — target */
.site-header nav {
  display: flex;
  position: absolute;
  top: 79px;
  left: 0;
  right: 0;
  z-index: 10;
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-6px);
  transition: grid-template-rows var(--duration-base) var(--ease-out), opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out), visibility 0s var(--duration-base);
}

.site-header nav.open {
  grid-template-rows: 1fr;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: grid-template-rows var(--duration-base) var(--ease-out), opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.site-header nav .nav-inner {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  background: rgba(244, 247, 251, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--line);
  padding: 16px max(5vw, 28px) 24px;
}
```

Note: `display: flex` followed by `display: grid` above is written that way only to show what's being replaced — in the actual edit, delete the `display: flex` line entirely and keep a single `display: grid`. Also drop `max-height: 0`/`480px` and `overflow: hidden` from `.site-header nav`/`.site-header nav.open` — those move to `.nav-inner`.

## Repo conventions to follow

- Easing/duration tokens live in `frontend/src/styles/tokens.css` (`--ease-out`, `--duration-base`, `--duration-fast`) — already used correctly here and must be kept as-is, only the animated property changes.
- The existing `visibility 0s var(--duration-base)` delay-on-close trick (closing only, not present on `.open`) is deliberate and correct — it keeps the nav interactive until the close transition finishes. Preserve it exactly.
- Desktop styles for `.site-header nav` (`frontend/src/styles/global.css:135-140`, outside the `@media` block) are unaffected — this plan only touches the `@media (max-width: 720px)` block starting at `global.css:1731`. At desktop widths `.nav-inner` must not introduce any visible wrapper styling (the mobile-only rules for `.nav-inner` background/blur/padding are already scoped inside the same `@media` block, so this is automatic — just don't move the `.nav-inner` selector outside the media query).

## Steps

1. In `frontend/src/components/Header.tsx`, wrap the `<nav>` element's children (everything currently between `<nav ...>` and `</nav>`, i.e. lines 31-58) in a new `<div className="nav-inner">`:
   ```tsx
   <nav id="main-navigation" aria-label="Main navigation" className={menuOpen ? 'open' : undefined}>
     <div className="nav-inner">
       {user && (
         <span className="header-stats" aria-label={`${stats.currentStreak} day streak, ${stats.xp} XP`}>
           {stats.currentStreak}-day streak · {stats.xp} XP
         </span>
       )}
       <NavLink to="/courses" onClick={() => setMenuOpen(false)}>
         Courses
       </NavLink>
       <NavLink to="/in-person-courses" onClick={() => setMenuOpen(false)}>
         In-Person Courses
       </NavLink>
       <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>
         My progress
       </NavLink>
       {isAdmin && (
         <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
           Admin
         </NavLink>
       )}
       {user ? (
         <NavLink className="header-cta" to="/account" onClick={() => setMenuOpen(false)}>
           My Account
         </NavLink>
       ) : (
         <Link className="header-cta" to="/login" onClick={() => setMenuOpen(false)}>
           Sign in
         </Link>
       )}
     </div>
   </nav>
   ```
2. In `frontend/src/styles/global.css`, replace the `.site-header nav` rule inside `@media (max-width: 720px)` (currently `global.css:1736-1759`) with the target shown above: `display: grid; grid-template-rows: 0fr;` replacing `display: flex; ... max-height: 0; ... overflow: hidden;`, and move `flex-direction: column; align-items: flex-start; gap: 4px; background: ...; backdrop-filter: ...; -webkit-backdrop-filter: ...; border-bottom: ...; padding: ...;` into a new `.site-header nav .nav-inner` rule with `min-height: 0; overflow: hidden;` added.
3. Replace the `.site-header nav.open` rule (currently `global.css:1761-1769`) — swap `max-height: 480px;` for `grid-template-rows: 1fr;`, and swap `max-height var(--duration-base) var(--ease-out)` for `grid-template-rows var(--duration-base) var(--ease-out)` in both `transition` declarations (the closed-state rule and the `.open` rule).
4. Verify `.site-header nav a, .site-header nav .header-cta` (`global.css:1771-1775`, `width: 100%; padding: 10px 0;`) still applies — it targets descendants of `.site-header nav` by tag/class, not by direct-child, so it still matches through the new `.nav-inner` wrapper without changes.

## Boundaries

- Do NOT touch the desktop `.site-header nav` rule at `global.css:135-140` (outside the media query) — desktop layout is unaffected by this plan.
- Do NOT change `Header.tsx`'s logic (`menuOpen` state, `onClick` handlers, `aria-*` attributes) — only wrap the JSX children in the new `div`.
- Do NOT add new dependencies.
- If the mobile nav CSS you find doesn't match the excerpts above (drift since commit `066382c`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors. `npx oxlint` — expect no new warnings.
- **Feel check**: run `npm run dev`, resize the browser (or DevTools device toolbar) to under 720px width:
  - Tap the hamburger — the nav panel should grow open smoothly from the top, same visual speed as before (220ms), with no visible jump or snap partway through.
  - Tap it again to close — it should collapse the same way, and the panel should stay interactive/visible until the close animation actually finishes (this was the point of the `visibility 0s var(--duration-base)` delay — confirm it still works, i.e. links don't disappear or become unclickable mid-close).
  - In Chrome DevTools Performance panel, record while opening the nav — confirm there is no "Layout" (purple) work attributed to the `nav` element during the transition, only "Composite Layers."
  - In DevTools Animations panel, set playback to 10% and confirm the open/close motion looks like a smooth single easing curve, not a series of layout jumps.
  - Toggle `prefers-reduced-motion` (Rendering panel) — the nav should snap open/closed near-instantly (governed by the global `0.01ms` reduced-motion override), not disappear or misrender.
- **Done when**: the mobile nav opens/closes with `grid-template-rows` as the only newly-animated layout-adjacent property (no `max-height` remains in `global.css`'s mobile nav rules), the DevTools Performance panel shows no Layout thrash during the transition, and the feel checks above all pass.
