---
target: Home.tsx
total_score: 25
p0_count: 0
p1_count: 2
timestamp: 2026-07-17T16-37-30Z
slug: frontend-src-pages-home-tsx
---
Method: dual-agent (A: design-review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | `listCourses()` has no loading state; a silent `.catch(() => setCourses([]))` makes a fetch failure indistinguishable from an empty catalog. |
| 2 | Match Between System and Real World | 4/4 | Plain, jargon-free copy throughout — matches the "knowledgeable neighbor" brand voice exactly. |
| 3 | User Control and Freedom | 3/4 | No modals/forms to escape from on this surface; standard link navigation, nothing to penalize. |
| 4 | Consistency and Standards | 3/4 | `.hero-path-card--dark` gets an `.eyebrow`; `.hero-path-card--light` doesn't — an unexplained asymmetry between two structurally parallel cards. |
| 5 | Error Prevention | 2/4 | No destructive actions to prevent, but the silent catch hides a real failure state instead of surfacing it. |
| 6 | Recognition Rather Than Recall | 4/4 | Every option is visible and text-labeled; no hidden menus, no icon-only affordances. |
| 7 | Flexibility and Efficiency | 2/4 | Neutral baseline — a marketing page doesn't need accelerators, none penalized for absence. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Value-props are admirably unadorned; docked one point for the unresolved dual-CTA hierarchy at the fold. |
| 9 | Error Recovery | 1/4 | No plain-language message on course-fetch failure ("Couldn't load courses — try refreshing"); the section just disappears. |
| 10 | Help and Documentation | 1/4 | No help/FAQ affordance anywhere in this component for a first-time, possibly anxious audience. |
| **Total** | | **25/40** | **Acceptable — significant improvements needed before users are happy** |

## Anti-Patterns Verdict

**LLM assessment**: Not first-order AI slop. The page avoids the worst cross-register tells — no gradient text, no side-stripe borders, no hero-metric template, no rounded-icon-above-every-heading, no identical card grid (the two hero cards are deliberately dissimilar: light glass vs. dark navy+grain). The value-props section is bare (h3+p, no icon chrome), sidestepping the generic SaaS feature-grid look. Two things keep it from a clean pass: two co-equal gold `.button-primary` CTAs visible in the same fold (undercutting DESIGN.md's own "One Accent Rule" — gold is meant to mean one action per screen), and an asymmetric `.eyebrow` (only the dark card gets one) — not a slop tell on its own (only 2 instances, different structural roles, not one-per-section scaffolding), but a real consistency gap.

**Deterministic scan**: `detect.mjs --json frontend/src/pages/Home.tsx` — exit code 0, **zero findings**. A broader scan of `frontend/src/pages` (all 12 page components) also came back exit 0, clean — this isn't an artifact of narrow scope. As an out-of-scope side-check, the detector was also run against `frontend/src/styles` (not part of this file's verdict, since critique.md excludes CSS-only targets): 140 findings there (84 design-system-color, 46 design-system-font-size, 5 overused-font "Fraunces", 4 design-system-radius, 1 layout-transition). Worth knowing for a future `/impeccable audit` of the CSS layer, but it does not affect Home.tsx's clean result — no false positives to report on the actual assigned target.

**Visual overlays**: Unavailable. No browser automation tool was exposed in this session and no dev server was running (checked 5173/3000/8080/4173, all free). Per protocol, no hand-rolled Playwright script was attempted and the dev server was not started. Report relies on source-level CSS analysis (computed contrast ratios via WCAG relative-luminance math) rather than live rendering.

## Overall Impression

This is a considered, on-brand landing page that avoids the obvious AI-slop template — the hero fork is genuinely differentiated rather than a card grid, and the value-props section resists card-ification. The real problem isn't aesthetic, it's an unresolved hierarchy decision at the single highest-stakes moment on the page (which of two paths is "for me") compounded by a silent failure mode on the course fetch that can make the whole bottom half of the page vanish with no explanation.

## What's Working

1. **Differentiated hero-path-cards, not a templated grid.** Light translucent-glass card vs. dark navy-and-grain card is a genuinely distinctive way to present a fork in the road — using visual register itself to signal "these are two different kinds of offer," not two flavors of the same thing.
2. **Context-aware focus-visible handling.** The base rule gives every focusable element a 2px navy outline, but `.hero-path-card--dark a:focus-visible` overrides to gold specifically so the ring stays visible against the dark background — a precise accessibility+brand joint decision, not a one-size-fits-all default.
3. **Value-props resist card-ification.** `.value-prop` ships with zero border/background/shadow — just heading + paragraph in a grid — sidestepping the "icon + heading + text, repeated" template this content almost always gets dressed up in.

## Priority Issues

**[P1] The hero fork has no visual hierarchy, compounded by two co-equal gold CTAs in one fold.**
- **What**: `.hero-path-card--light` and `.hero-path-card--dark` are equal-width grid siblings, each ending in an identical `.button.button-primary` (same gold gradient, same size). Only the dark card gets an `.eyebrow` — the light/free card, arguably the primary offer per PRODUCT.md's positioning, has no comparable marker.
- **Why it matters**: DESIGN.md's own "One Accent Rule" reserves gold for the one action per screen that matters most; here two gold buttons compete with no tiebreaker. A first-time senior visitor has to read both full paragraphs to self-select rather than resolving the fork in a couple seconds.
- **Fix**: Give the free-course card the primary visual signal (matching eyebrow, or short "Most people start here" microcopy) and consider demoting the in-person CTA to a secondary/ghost button so gold reads as singular again.
- **Suggested command**: `/impeccable layout`

**[P1] Silent fetch failure is indistinguishable from "no courses exist."**
- **What**: `listCourses().then(...).catch(() => setCourses([]))`, gated by `{courses.length > 0 && (...)}`. A network error and a genuinely empty catalog render identically — the section simply doesn't appear.
- **Why it matters**: Fails heuristics #1 and #9. A user on a spotty connection gets zero signal anything went wrong — no loading state, no retry, no message — and may conclude the site has nothing to teach them.
- **Fix**: Track a loading/error state distinct from empty data; on catch, show a plain-language inline note ("Couldn't load courses right now — try refreshing").
- **Suggested command**: `/impeccable harden`

**[P2] Light hero-card body copy sits close to the AA contrast floor.**
- **What**: `.hero-path-card--light p { color: #52697f }` over the card's `rgba(219,232,246,0.55)` glass fill computes to roughly 4.9:1 — technically AA-passing but with almost no margin, versus ~7.8:1 for the same tone on `.hero-text` against plain paper.
- **Why it matters**: PRODUCT.md commits to "contrast beyond bare minimum where feasible" for this audience. This is the exact copy explaining the free, no-account offer — the reassurance a hesitant visitor most needs to read comfortably — and it's the thinnest-margin text on the page.
- **Fix**: Darken to `--ink` or a custom tone in the `#3d5266` range to push past 6:1, matching the margin already achieved elsewhere.
- **Suggested command**: `/impeccable audit`

**[P2] Zero trust/credibility signal for an audience primed toward distrust.**
- **What**: No photography, testimonial, partner logo, or named-instructor detail anywhere on the page. (Judgment call: this is defensible as brand register — a generic "senior on a laptop" stock photo would likely read as more cliché and closer to the "corporate cybersecurity vendor" look the brand explicitly rejects than the current text-led approach. Zero imagery is not treated as a bug here.)
- **Why it matters**: The page never gives a skeptical first-timer concrete evidence this is a real, legitimate organization — no named partner community, no instructor credential, no concrete stat — which is a real gap for a population being taught, by this very site, to distrust unverified claims.
- **Fix**: Add one specific, non-generic credibility marker (a named partner community, a real instructor's name on the in-person card, a concrete stat in value-props) without resorting to stock photography.
- **Suggested command**: `/impeccable clarify`

**[P3] The one reassuring claim on the page ("free") is carried by the smallest text on the page.**
- **What**: The free/no-cost reassurance lives only in the 11px eyebrow and a paragraph one level down; the H1 carries a vaguer aspirational line instead.
- **Why it matters**: For a first-time, possibly cost-anxious visitor, "this is free" is arguably more decision-critical in the first two seconds than the headline's tone-setting.
- **Fix**: Fold a "free" cue into the H1 or the opening of `.hero-text` rather than relying solely on the eyebrow.
- **Suggested command**: `/impeccable typeset`

## Persona Red Flags

**Jordan (Confused First-Timer)**: Faces the light/dark card fork with no explicit "which one is for me" framing — has to read both full paragraphs to self-select, and the asymmetric eyebrow makes the in-person path look more "official" by accident. If `listCourses()` fails, the page just ends after value-props with no explanation — no way to know whether to wait, refresh, or give up. No FAQ/help affordance for someone encountering "AI-generated deepfakes" as a concept for the first time.

**Casey (Distracted Mobile User)**: At the 720px breakpoint, `.hero-paths` correctly stacks to one column and touch targets are comfortably above 44px (~52px). Red flag: the primary CTA sits below eyebrow + H1 + hero-text + full first-card copy on a narrow viewport — likely below the first fold on a phone. Genuine plus: zero images means no heavy asset payload on a slow connection.

**"Margaret" — Senior First-Timer** (project-specific persona, derived from PRODUCT.md's audience description): The light-vs-dark card split risks reading as "free tier vs. premium tier" by convention from other software, even though the dark card is actually the institutional (senior-living-community) path, not a paywall — nothing on the card clarifies this, cutting against PRODUCT.md's "simple, unambiguous interactions" commitment. The strongest reassurance ("free to watch any time, no account needed") lives one level down inside the card paragraph rather than at eyebrow/headline level. No visible "call us" or human-contact affordance on this entrance surface for someone who may want to verify legitimacy before clicking.

## Minor Observations

- No `text-wrap: balance` on h1/h2 or `text-wrap: pretty` on longer card paragraphs — low risk given the `clamp()` bounds, but cheap insurance against orphans.
- `.course-grid` uses `repeat(auto-fill, minmax(260px, 1fr))` rather than `auto-fit` — with only 1-2 featured courses in production this could leave an empty gap on wide screens rather than cards stretching to fill.
- Multiple unrelated `<h2>` elements exist across sections with no intermediate heading level under the single page `<h1>` — worth a screen-reader heading-outline pass.
- `prefers-reduced-motion: reduce` is handled thoroughly and globally — no action needed, confirmed solid.
- The dual-gold-button issue is also a `.button-primary` reuse question: consider whether the in-person path needs the same visual weight as the free path, or whether a secondary/ghost variant would better express "alternate path."

## Questions to Consider

1. If the free video path is genuinely the front door for most visitors, why does it currently carry *less* visual signal (no eyebrow, no distinguishing marker) than the narrower in-person-community path?
2. What single piece of concrete evidence would make a first-time senior visitor — primed by this site's own subject matter to distrust unfamiliar claims — believe this page itself is legitimate? Where would it live today, and where's the closest gap?
3. Is "Learn to stay safe online" doing enough work as the first sentence every visitor reads, or is it generic enough to sit unedited on any security-adjacent site's homepage without anyone noticing?
