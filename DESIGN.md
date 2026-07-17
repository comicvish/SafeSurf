---
name: VeraBlock
description: Free internet-safety education for seniors, taught through video lessons, quizzes, and a real in-person course.
colors:
  navy: "#0f2c52"
  gold: "#e6a03c"
  blue: "#1f6fb2"
  ink: "#0a1f33"
  black: "#051526"
  paper: "#f4f7fb"
  cream: "#e6edf5"
  sky: "#bcd6ea"
  line: "#ccd8e4"
  slate-deep: "#34506b"
  slate-muted: "#52697f"
  success: "#2e8540"
  success-tint: "#e3f3e6"
  danger: "#b3261e"
  danger-tint: "#fbe4e2"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "normal"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.375rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.25rem, 2.4vw, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-lead:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  xs: "4px"
  sm: "5px"
  md: "8px"
  lg: "12px"
  xl: "14px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "60px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
  button-header:
    backgroundColor: "{colors.navy}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "11px 16px"
  card-glass:
    backgroundColor: "rgba(219, 232, 246, 0.6)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  input-field:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  badge-pill:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: VeraBlock

## 1. Overview

**Creative North Star: "The Harbor Light"**

VeraBlock's visual world is a deep, steady navy harbor with a warm gold lantern cutting through it — trustworthy and unhurried on one hand, warm and encouraging on the other. Surfaces are built from Lit Glass: translucent panels that blur and saturate what's behind them, each catching a thin highlight along its top edge like light on the water. A faint paper grain runs under every page, so even the sharpest gradients still feel handmade rather than manufactured on a screen.

This system explicitly rejects the corporate cybersecurity vendor look — no fear-based dark UI, no generic enterprise navy-and-lock-icon SaaS aesthetic, no manufactured urgency. It equally rejects childish edtech — no cartoon mascots, no cutesy illustration, nothing that risks reading as patronizing to an adult, senior-heavy audience. The register throughout is a knowledgeable, patient neighbor explaining something — never a vendor selling protection, never a game dressed up as a lesson.

**Key Characteristics:**
- Navy-and-gold palette carrying civic trust and warm encouragement in the same breath
- Lit Glass surfaces: translucent, blurred, saturated, edge-lit — never flat opaque cards
- Serif display type (Fraunces) paired with a plain, humanist sans body (DM Sans) and a mono label voice (DM Mono) for eyebrows, stats, and badges
- Soft, tinted shadows instead of neutral gray ones — blue-tinted under navy/paper surfaces, gold-tinted under gold/gamified surfaces
- Generous touch targets, honored `prefers-reduced-motion`, and text sized for a senior-heavy audience — accessibility is load-bearing, not decorative

## 2. Colors

The palette reads as trustworthy navy anchored by a warm gold accent, with a supporting cast of soft blue-grays that keep the system from feeling corporate or cold.

### Primary
- **Harbor Navy** (`#0f2c52`): The brand's anchor color. Header CTA gradients, footer and dark hero-card backgrounds, the community CTA band, and Fraunces headline accents on dark surfaces.

### Secondary
- **Lantern Gold** (`#e6a03c`): The single warm accent that means "go" — primary buttons ("Start course", "Mark complete"), the practice progress bar, checkmarks in feature lists, and gamified surfaces (streak badges, XP).

### Tertiary
- **Signal Blue** (`#1f6fb2`): Interactive-state color, never a resting-state color. Hover borders on lesson list items and quiz options, focus accents, the "selected" state on a quiz answer.

### Neutral
- **Ink** (`#0a1f33`): Primary body text on light surfaces.
- **Deep Black** (`#051526`): Video-embed background, the brand mark's circular backdrop.
- **Paper** (`#f4f7fb`): The page background, always under the grain texture.
- **Cream** (`#e6edf5`): Secondary surface tint — badge backgrounds, progress-track background.
- **Sky** (`#bcd6ea`): Light blue tint used sparingly for badges and the dark hero card's eyebrow color.
- **Line** (`#ccd8e4`): Borders and dividers.
- **Slate Deep** (`#34506b`): Secondary text with real presence — hero subtext, lesson summaries, section subheads. Use where the text still needs to read as a voice, not a caption.
- **Slate Muted** (`#52697f`): Quieter captions and metadata — card descriptions, form helper text, footer copy.
- **Success** (`#2e8540`) / **Success Tint** (`#e3f3e6`): Correct-answer state, form success confirmation.
- **Danger** (`#b3261e`) / **Danger Tint** (`#fbe4e2`): Incorrect-answer state, form error messages.

### Named Rules
**The Tinted Shadow Rule.** No shadow is neutral gray. Shadows under blue/navy/paper surfaces carry `rgba(15, 44, 82, …)`; shadows under gold/gamified surfaces carry `rgba(179, 110, 20, …)`. A gray drop shadow anywhere in this system is a bug.

**The One Accent Rule.** Gold means action or achievement — a button, a completed step, a streak. It never appears as decoration. If gold shows up and nothing is being asked of or credited to the user, remove it.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** DM Sans (with Arial, sans-serif fallback)
**Label/Mono Font:** DM Mono (with monospace fallback)

**Character:** A serif with real editorial weight against a plain, humanist sans — the pairing that makes this feel like a considered publication rather than a SaaS dashboard. DM Mono is reserved for numbers and short tags, never for anything a reader lingers on.

### Hierarchy
- **Display** (700, `clamp(2.5rem, 5vw, 4rem)`, line-height 1.02): Hero H1 only. One per page, maximum.
- **Headline** (700, `clamp(1.75rem, 3vw, 2.375rem)`, line-height 1.1): Page-level H1/H2 — course and lesson titles, "Featured Courses."
- **Title** (600, `clamp(1.25rem, 2.4vw, 1.625rem)`, line-height 1.2): Card and section-level H2/H3 — hero path-card headings, stat numbers.
- **Body** (400, 1rem / 16px, line-height 1.5): Default reading text, capped at ~65–75ch via each page's `.section-shell` max-width.
- **Body Lead** (400, 1.125rem / 18px, line-height 1.55): Hero subtext and other single-paragraph lead-ins that need a touch more presence than body copy.
- **Label** (500, 0.6875rem / 11px, uppercase, tracking 0.02em): Eyebrows, badges, stat tags. DM Mono only; never used below 11px given the senior-tuned accessibility bar.

### Named Rules
**The Serif-Says-Trust Rule.** Fraunces appears only on headings, blockquotes, and the large numbers in stat tiles — never on body copy, buttons, or labels. If Fraunces shows up in a sentence-length block of text, it's misapplied.

**The No-Tiny-Type Rule.** Nothing below 11px, and body text never drops below 1rem (16px) even in dense admin/practice UI. Given the senior-heavy audience, treat 16px as the floor, not a starting point to shrink from.

## 4. Elevation

VeraBlock uses **Lit Glass**: layered, translucent surfaces — never flat opaque cards, never neutral gray shadows. Every elevated surface pairs a `backdrop-filter: blur(…) saturate(160–180%)` with a soft inset highlight along the top edge (`rgba(255,255,255,0.4–0.8) inset`) and an outer drop shadow tinted to match its background hue. The effect is meant to read as backlit glass catching light, with the page's grain texture still faintly visible through it.

### Shadow Vocabulary
- **Ambient card** (`0 1px 0 rgba(255,255,255,0.5) inset, 0 8px 20px -14px rgba(15,44,82,0.35)`): Resting state for course cards, stat tiles, practice cards.
- **Ambient card, gold-tinted** (`0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 18px -14px rgba(179,110,20,0.4)`): Resting state for gold-toned surfaces (practice-card, gamified callouts).
- **Lifted hover** (`0 1px 0 rgba(255,255,255,0.4) inset, 0 12–16px 24–32px -14to-18px rgba(15,44,82,0.3–0.35)`): Hover state on cards and lesson-list rows, paired with a `translateY(-2px to -4px)` lift.
- **Button press** (`0 1px 3px -1px rgba(5,21,38,0.4) inset`): Active/pressed state, paired with `scale(0.97)`.
- **Deep panel** (`0 1px 0 rgba(255,255,255,0.6) inset, 0 20px 40px rgba(15,44,82,0.12)`): The schedule calendar — the single largest, most prominent glass surface on the site.

### Named Rules
**The Inset Highlight Rule.** Every elevated surface gets a thin white inset highlight along its top edge before anything else — it's what separates "glass catching light" from "flat card with a shadow." Skipping it is the single most common way to accidentally flatten this system.

## 5. Components

### Buttons
- **Shape:** 5px radius (`rounded.sm`) on every button variant — never sharper, never pill-shaped except badges.
- **Primary** (`button-primary`, `button-complete`): Gold gradient (`#f8cb85 → #e6a03c → #d38f2e`) with navy text, inset highlight + gold-tinted shadow. Used for the one action per screen that matters most: start a course, complete a lesson.
- **Header** (`header-cta`): Navy gradient (`#2a4d82 → #0f2c52 → #0b2242`) with white text, blue-tinted shadow. Reserved for the persistent nav CTA.
- **Hover / Focus:** `translateY(-2px)` lift on hover; `scale(0.97)` with a pressed inset shadow on active. Focus-visible gets a 2px navy outline (gold on dark surfaces), 2px offset — never suppressed.
- **Ghost / Text link** (`.text-link`): Underlined inherited-color text, no background — used for secondary actions like "forgot password" or switching auth mode.

### Cards
- **Corner Style:** 8px radius (`rounded.md`) for most cards; 10–12px for the two largest hero path-cards and the auth form; 14px for the schedule calendar, the single most prominent surface.
- **Background:** Translucent tints of cream/sky/gold at 55–78% opacity, always with `backdrop-filter: blur(10–18px) saturate(160–180%)`.
- **Shadow Strategy:** See Elevation — ambient at rest, lifted on hover.
- **Border:** 1px `rgba(255,255,255,0.7–0.75)` hairline, giving the glass edge its catch-light.
- **Internal Padding:** 16–28px depending on card size; stat tiles and practice cards sit at the tighter end, the hero path-cards and auth form at the wider end.

### Inputs / Fields
- **Style:** White or near-white background, 1px `var(--line)` border, 5px radius, a subtle inset shadow (`inset 0 1px 3px rgba(10,31,51,0.08–0.15)`) rather than a flat fill.
- **Focus:** 2px navy outline, 2px offset (gold on dark backgrounds like the community CTA form).
- **Error:** Danger-tinted background block (`success-tint`/`danger-tint` pattern) for form-level messages, not just red input borders.

### Quiz / Choice Buttons
- **Style** (`.practice-option`): White background, 2px `var(--line)` border, 8px radius, ambient shadow — visually a card that behaves like a button.
- **State:** Hover lifts 1px and turns the border Signal Blue; selected turns the border blue with a cream fill; correct turns the border/background/text green (`success` / `success-tint`); incorrect turns them red (`danger` / `danger-tint`); unselected-after-answer dims to 55% opacity. This is the most stateful component in the system — every state must stay distinguishable by shape/border, not color alone.

### Badges / Pills
- **Style** (`header-stats`, `curriculum-week-number`, `schedule-example-badge`, `admin-warning`): 999px pill radius, DM Mono label type, uppercase, cream or gradient background, navy or warning-brown text, a thin inset highlight.
- **Use:** Metadata only — week numbers, XP/streak counts, "example week" tags. Never a call to action.

### Navigation
- **Style:** Sticky header, 79px tall, translucent navy-tinted glass (`rgba(244,247,251,0.68)` + `blur(20px) saturate(180%)`) with a soft white bottom hairline. Nav links are 14px/600 weight, no underline at rest.
- **Mobile treatment:** Collapses to a hamburger (`.menu-toggle`) below 720px; the open menu is a full-width glass panel dropping from under the header, same blur treatment as the header itself.

## 6. Do's and Don'ts

### Do:
- **Do** use the Lit Glass treatment (inset highlight + tinted shadow + blur/saturate backdrop) on every elevated surface — it's the system's signature, not an occasional flourish.
- **Do** keep gold reserved for action and achievement (buttons, completed states, streaks) — see the One Accent Rule.
- **Do** hold body text at 16px minimum and give muted/secondary text (`#52697f`, `#34506b`) real contrast against paper — this audience skews senior; don't shave size or contrast for density's sake.
- **Do** honor `prefers-reduced-motion` on every hover/press/entrance animation, matching the existing global reset.
- **Do** keep quiz and form states distinguishable by border/shape, not color alone (colorblind-safe).

### Don't:
- **Don't** design anything that reads as a corporate cybersecurity vendor — no fear-based dark UI, no generic enterprise "navy-and-lock-icon" SaaS look, no manufactured urgency copy.
- **Don't** design anything that reads as childish edtech — no cartoon mascots, no cutesy illustration style, nothing that could feel patronizing to an adult learner.
- **Don't** use a flat, untinted gray box-shadow anywhere — every shadow in this system is tinted navy or gold (see the Tinted Shadow Rule).
- **Don't** skip the inset highlight on a card and call it done — a shadow alone is a flattened, off-brand version of this system.
- **Don't** drop label type (DM Mono) below 11px or use it for anything longer than a short tag/number.
