# 009 — Add a subtle entrance transition on route changes

- **Status**: DONE
- **Commit**: e7c62a3
- **Severity**: MEDIUM
- **Category**: Missed opportunity (AUDIT.md §8 — "State changes that teleport... where a brief transition would prevent a jarring change")
- **Estimated scope**: 2 files (`frontend/src/App.tsx`, `frontend/src/styles/global.css`)

## Problem

Navigating between pages is a hard teleport: the old page's DOM is replaced by the new page's DOM
with zero transition, on every single route change site-wide. The user described this directly as
feeling "very abrupt."

Current routing shell, `frontend/src/App.tsx:23-76`:

```tsx
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<CourseList />} />
        {/* ...all other routes... */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  )
}
```

There is no motion library in this project (confirmed: no `framer-motion`, `motion`, `react-spring`,
or `gsap` in `frontend/package.json`) — all existing motion is plain CSS `@keyframes` /
`transition`, so the fix must be plain CSS too, not a new dependency.

## Target

Every route change plays a short, subtle fade-and-rise entrance on the new page's content —
opacity 0→1 with a small upward `translateY`, using the repo's own existing easing/duration
tokens (`frontend/src/styles/tokens.css:16-18`):

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--duration-base: 220ms;
```

This curve is already Kowalski-grade (`cubic-bezier(0.16, 1, 0.3, 1)` is the same "strong ease-out"
family used in his own Vaul/Sonner libraries) — reuse it verbatim, do not invent a new one. 220ms
sits correctly inside the "modals, drawers" duration budget (200–500ms) for a full-surface entrance,
per AUDIT.md §2.

**Do not add a new keyframe.** `frontend/src/styles/global.css:32-41` already defines exactly this
shape — opacity 0→1 + `translateY(4px)→0` — as `content-fade-in`, and it's already used in 9 places
across the codebase (e.g. `.course-detail > h1`, `.lesson-detail > h1`, `.unit-block`) with the
identical `animation: content-fade-in var(--duration-base) var(--ease-out) both;` line. Introducing
a second, near-identical keyframe (e.g. a `page-enter` with an 8px offset) would itself be an
AUDIT.md §7 cohesion finding ("duplicated near-identical easings/durations"). Reuse the existing
keyframe verbatim:

```css
.page-transition {
  animation: content-fade-in var(--duration-base) var(--ease-out) both;
}
```

Add only this rule — no new `@keyframes` block. Some individual elements on some pages
(`.course-detail > h1`, `.lesson-detail > h1`, `.unit-block`, and a handful of others — see the full
list via `grep -n "content-fade-in" frontend/src/styles/global.css`) already carry their own
`content-fade-in` animation independently. Wrapping the whole route in `.page-transition` means
those elements will animate twice (once from the wrapper, once from their own rule) — this is
intentional and acceptable: both use the identical curve/duration, so the two overlap perfectly
with no visible stutter or double-motion (opacity 0→1 stacks cleanly with itself; the 4px translate
stacks to something imperceptibly different). Do not attempt to strip `content-fade-in` off those
individual selectors to "fix" this — that's out of scope and would be a separate, unrequested
change.

`App.tsx` target — wrap the `<Routes>` element (not each individual page's own `<main>`, to avoid
nested `<main>` landmarks) in a `<div>` keyed on the current pathname, so React fully remounts it
(and therefore re-triggers the CSS entrance animation) on every route change:

```tsx
import { Route, Routes, useLocation } from 'react-router-dom'
// ...existing imports...

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <Header />
      <div key={location.pathname} className="page-transition">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* ...all existing <Route> elements, unchanged... */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}
```

## Repo conventions to follow

- Route-change side effects already have a precedent: `frontend/src/components/ScrollToTop.tsx`
  calls `useLocation()` and keys its effect on `pathname`/`hash`. Mirror that same `useLocation()`
  usage in `App.tsx` — don't introduce a different routing-state pattern.
- Entrance keyframes already exist as the established idiom for "this element should not just pop
  in" — e.g. `.hero { animation: fade-in-up 0.5s var(--ease-out) both; }`
  (`frontend/src/styles/global.css`, `.hero` rule) and `@keyframes pop-in`
  (`frontend/src/styles/global.css:43-52`, opacity 0→1 + `scale(0.92)→1`, used on
  `.lesson-complete-badge`). `page-enter` should follow the exact same shape (`from`/`to`,
  opacity + one transform property, `var(--ease-out)`, `both` fill mode) — not a new animation
  style.
- Reduced-motion handling already has an established curated-list pattern (`global.css:54-82`,
  see next section) — plug into it, don't invent a parallel mechanism.
- Do not wrap the routed content in another `<main>` — every page component
  (`CourseList.tsx`, `LessonDetail.tsx`, `Dashboard.tsx`, etc.) already renders its own top-level
  `<main className="... section-shell">`. A second `<main>` around `<Routes>` would create nested
  `<main>` landmarks, which is an accessibility regression on a site that has explicitly fixed
  "a11y gaps" before (see recent commit `a449c5f`). Use a plain `<div>`.

## Steps

1. In `frontend/src/App.tsx`, add `useLocation` to the existing `react-router-dom` import on line 1
   (`import { Route, Routes } from 'react-router-dom'` → `import { Route, Routes, useLocation } from 'react-router-dom'`).
2. Inside the `App` function body, add `const location = useLocation()` as the first line, before
   the `return`.
3. Wrap the existing `<Routes>...</Routes>` block (lines 28-72) in
   `<div key={location.pathname} className="page-transition">...</div>`. Do not change anything
   inside `<Routes>` — every `<Route>` element stays exactly as-is.
4. In `frontend/src/styles/global.css`, add the `@keyframes page-enter` block and the
   `.page-transition` rule shown in the Target section above, placed directly after the existing
   `@keyframes pop-in` block (currently ends at line 52, right before the
   `@media (prefers-reduced-motion: reduce)` block that starts at line 54).
5. In the same file's existing `@media (prefers-reduced-motion: reduce)` block
   (`global.css:54-82`), add `.page-transition` to the curated selector list that gets the gentle
   opacity-only fade instead of falling through to the blanket `animation-duration: 0.01ms`
   catch-all — this is the same pattern plan 004
   (`plans/004-reduced-motion-keep-opacity.md`) already established for every other entrance
   animation in this file. Add it as the last selector in the list (after `.account-delete-confirm`):

   ```css
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
   .practice-result,
   .account-delete-confirm,
   .page-transition {
     animation-name: reduced-motion-fade !important;
     animation-duration: 150ms !important;
   }
   ```

## Boundaries

- Do NOT touch any individual page component (`Home.tsx`, `CourseList.tsx`, etc.) — this is a
  routing-shell-level change only.
- Do NOT add a page-exit animation, `AnimatePresence`, or any motion library — React Router has no
  built-in mechanism to delay unmounting the old route here, and reaching for a library for a
  one-directional fade-in is out of scope. Entrance-only is the correct, minimal fix.
- Do NOT use the View Transitions API (`document.startViewTransition` /
  React Router's `viewTransition` prop) — it would be a reasonable alternative in isolation, but it
  bypasses this repo's existing token/keyframe/reduced-motion conventions entirely (it animates via
  `::view-transition-old/new` pseudo-elements, a completely different model), and support is
  inconsistent enough across the browsers a senior-skewing audience is likely running that it isn't
  worth the inconsistency with the rest of the codebase's motion system.
- Do NOT change `ScrollToTop.tsx`. It already runs its instant scroll-reset on the same
  `pathname`/`hash` change; the two effects are independent (one resets scroll position, the other
  animates opacity/transform of already-in-place content) and do not need to be coordinated.
- If `App.tsx`'s route list has drifted from the 18-route structure shown above (routes
  added/removed/reordered) since commit `e7c62a3`, that's fine — copy whatever routes actually
  exist into the wrapping `<div>` unchanged. Only STOP and report if the overall shape (a flat
  `<Routes>` block directly between `<Header />` and `<Footer />`, no existing wrapping element) has
  changed.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p . && npm run build` — both must succeed with
  no errors.
- **Feel check**: run the dev server, open the site, and click between at least three different
  routes (e.g. `/` → `/courses` → `/courses/:courseId` → back to `/`):
  - Each new page's content should visibly fade up into place — not an abrupt swap, not a slide
    from off-screen, not a bounce.
  - The animation must be barely-there, not showy — if it draws attention to itself rather than
    just softening the swap, the duration or translateY distance is too large; do not change the
    values from what's specified above without flagging it instead of improvising.
  - Rapidly click between two routes several times in a row (e.g. spam-click two nav links). Each
    click should cleanly restart the entrance on the new page with no visual glitch, flash of
    unstyled content, or stacked/overlapping animations from the previous page.
  - In DevTools' Animations panel, select the `page-enter` animation and set playback to 10%;
    confirm it's a clean fade + upward settle with no jump or flicker at either end.
  - Toggle `prefers-reduced-motion` (DevTools Rendering panel → "Emulate CSS media feature
    prefers-reduced-motion: reduce") and navigate again: confirm the page still gently fades in
    (opacity animates over ~150ms) but does not visibly move/rise — per the `reduced-motion-fade`
    keyframe added in step 5, not an instant snap.
- **Done when**: `tsc`/`build` are clean, every route transition shows the fade-up entrance, rapid
  navigation shows no glitches, and reduced-motion shows an opacity-only fade instead of either a
  hard snap or the full movement.
