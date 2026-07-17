---
target: CourseList.tsx
total_score: 20
p0_count: 0
p1_count: 2
timestamp: 2026-07-17T17-00-21Z
slug: frontend-src-pages-courselist-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Loading state was static text with no progress signal; nav gave no "current page" indication. |
| 2 | Match Between System and Real World | 3/4 | Plain language throughout, no jargon. |
| 3 | User Control and Freedom | 2/4 | No retry affordance on error. |
| 4 | Consistency and Standards | 3/4 | `.course-card` markup matched Home.tsx's featured grid exactly (good reuse); `document.title` wasn't set here while other pages do. |
| 5 | Error Prevention | 2/4 | N/A for destructive actions, but the empty-array case was unguarded. |
| 6 | Recognition Rather Than Recall | 2/4 | No "you are here" cue in nav; no semantic list structure for screen readers. |
| 7 | Flexibility and Efficiency | 1/4 | One rigid path, no sort/filter/search — arguably fine for a tiny catalog, but then the page's reason to exist as a separate route is unclear. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean; Lit Glass card executed correctly. |
| 9 | Error Recovery | 1/4 | Generic message, no retry, no distinction between failure types. |
| 10 | Help and Documentation | 1/4 | None present; acceptable for a page this simple. |
| **Total** | | **20/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Not visual AI slop — correct Lit Glass execution, no gradient/border/eyebrow tells. The real issue was **product-thinking slop**: a dedicated route rendering the identical card grid a user already saw on Home's featured-courses section, with no pagination, filtering, or categorization to justify a separate page. Flagged, not resolved (see Priority Issues).

**Deterministic scan**: `detect.mjs` on CourseList.tsx — exit 0, zero findings (a 37-line file with no inline styles or arbitrary values for the regex rules to catch).

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

The page's core problem — whether it should exist in its current form — is a product decision, not a design fix, and is called out below rather than resolved unilaterally. Everything fixable without that decision (blocking loading state, missing empty state, missing semantic list structure, inconsistent title/copy, no nav "current page" indicator) has been fixed.

## What's Working

1. **Correct Lit Glass execution** on `.course-card` — inset highlight, tinted shadow, translucent tint, hover lift, matching DESIGN.md's Elevation section exactly.
2. **Plainspoken, non-corporate copy** in both the original loading and error text — on-brand, no jargon or error codes.
3. **Component reuse discipline** — identical `.course-card` structure used on Home and here, no "same button looks different in two places" drift.

## Priority Issues

**[P1] The page duplicates Home's featured-courses section with no added value.**
- **What**: Same `listCourses()` call, identical `.course-grid`/`.course-card` markup as Home.tsx's "Start learning" section. No pagination, filtering, search, or categorization.
- **Status**: **Not resolved** — deciding whether this route should exist, gain real catalog functionality (grouping by threat category, progress-aware recommendations), or collapse into an anchor on Home is a product/IA call, not something to resolve unilaterally by deleting a route.
- **Suggested command**: `/impeccable shape` (decide what a real catalog view adds) or `/impeccable distill` (if the answer is "nothing," strip it)

**[P1] Full-page blocking loading state, no skeleton, no perceived progress.**
- **What**: `<main className="page-status">Loading courses…</main>` — centered plain text, no skeleton, no spinner.
- **Fix applied**: Replaced with a 3-card skeleton grid (`.course-card-skeleton` + `.skeleton-line`, a subtle pulse animation on `background-position`, which respects the site's existing global `prefers-reduced-motion` reset) matching the real card's dimensions, with `aria-busy="true"` and `aria-label="Loading courses"` on the list.
- **Files**: `frontend/src/pages/CourseList.tsx`, `frontend/src/styles/global.css`

**[P2] Silent, ungoverned empty state.**
- **What**: The `!courses` check only guarded against `null`; a successful fetch resolving to `[]` fell through to an `<h1>` over a blank grid with no explanation.
- **Fix applied**: Added an explicit `courses.length === 0` branch with a plainspoken message ("New courses are on the way — check back soon."), reusing the `.course-load-error` style introduced for Home's error state.
- **File**: `frontend/src/pages/CourseList.tsx`

**[P2] Card grid had no semantic list structure for assistive tech.**
- **What**: A `<div>` of `<Link className="course-card">` elements with no `<ul>/<li>` or `role="list"` — a screen reader user couldn't tell how many courses existed or where the list ended.
- **Fix applied**: Converted to `<ul role="list">` / `<li>` per card, on both this page and Home.tsx's matching featured-courses grid for consistency (the same markup pattern existed in both places).
- **Files**: `frontend/src/pages/CourseList.tsx`, `frontend/src/pages/Home.tsx`, `frontend/src/styles/global.css` (list-style reset added to `.course-grid`)

**[P3] Header nav gave no "current page" indication.**
- **What**: Plain `<Link>` elements in `Header.tsx`, no active-state styling or `aria-current`.
- **Fix applied**: Switched the four main nav links (Courses, In-Person Courses, My progress, Admin) to React Router's `<NavLink>`, which sets `aria-current="page"` and an `active` class automatically; added a subtle `--blue` color treatment for `.site-header nav a.active` — deliberately not gold, since this is a status indicator, not an action (per DESIGN.md's One Accent Rule).
- **Files**: `frontend/src/components/Header.tsx`, `frontend/src/styles/global.css`

## Persona Red Flags

**Jordan (Confused First-Timer)**: No longer lands on an unresponsive blank sentence during load (skeleton now shows immediately) or a mysteriously empty page if the catalog is genuinely empty (explicit message now shown). Still may wonder why "Browse courses" led to a page showing the same courses she just saw on Home — that's the unresolved P1 above.

**Casey (Distracted / Slow-Connection User)**: The skeleton grid gives immediate visual feedback instead of a static sentence with nothing moving — meaningfully better for a slow-connection scenario.

**Sam (Accessibility-Dependent User)**: Tabbing through the grid now gets proper list semantics (`role="list"`, real `<li>` items) instead of a flat sequence of headings and links with no count/boundary cues. The header nav's active state is now announced via `aria-current="page"`, so she has non-visual confirmation of which page she's on.

## Minor Observations

- `document.title` is now set consistently with the pattern already used on `InPersonCourses.tsx`.
- The error copy now matches Home.tsx's wording exactly ("Couldn't load courses right now — try refreshing the page."), where before the two pages used different phrasing for the identical failure.
- `.course-card h2 { font-size: 24px }` and `.course-list h1 { font-size: clamp(32px, 4vw, 46px) }` don't cleanly map to DESIGN.md's documented `headline`/`title` token steps — a small token-drift better addressed by a dedicated `/impeccable extract` pass across the CSS layer than patched piecemeal here.

## Questions to Consider

1. If every course currently fits on Home's featured-courses grid with no scrolling or filtering needed, what is `/courses` actually for — and what would make it earn a dedicated route (grouping by threat category, a returning-learner view) rather than mirroring Home?
2. What happens to this page's value the day the course count grows past what fits in a Home section — is there a plan for that, or would it become an unstructured wall of cards?
