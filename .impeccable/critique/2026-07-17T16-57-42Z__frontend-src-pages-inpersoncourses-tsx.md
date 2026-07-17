---
target: InPersonCourses.tsx
total_score: 25
p0_count: 1
p1_count: 2
timestamp: 2026-07-17T16-57-42Z
slug: frontend-src-pages-inpersoncourses-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Contact form has sending/sent/error states; little else on the page has async status to track. |
| 2 | Match Between System and Real World | 2/4 | The full 7-day calendar grid implied a fixed schedule the copy explicitly says is negotiable. |
| 3 | User Control and Freedom | 3/4 | Clear escape to `/courses` and a direct-email fallback; no dead ends. |
| 4 | Consistency and Standards | 3/4 | Buttons/eyebrow/badge patterns match the rest of the site; "Book a course" vs. "Send inquiry" used different verbs for the same destination action. |
| 5 | Error Prevention | 2/4 | Form fields are validated, but nothing addresses the bigger decision-blocking gap: no cost information anywhere. |
| 6 | Recognition Rather Than Recall | 2/4 | The example-schedule disclaimer text was separate from the visual, so a skimmed glance (or a forwarded screenshot) could read as a fixed schedule. |
| 7 | Flexibility and Efficiency | 2/4 | Single linear path; the mailto: fallback was buried at the very bottom instead of offered as an equal top-of-page alternative. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean and restrained; docked for the calendar rendering 24 cells where 20 carried zero information. |
| 9 | Error Recovery | 3/4 | `role="alert"` on error, fields preserved on failure, disabled+relabeled submit button — solid. |
| 10 | Help and Documentation | 2/4 | No FAQ, no pricing, no "what happens after I submit" explanation for an institutional buyer. |
| **Total** | | **25/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment**: Largely clean of cross-register AI-slop tells — no gradient text, no side-stripe borders, no hero-metric template. The Week 1-4 numbering is legitimate sequence-as-information (a real ordered curriculum), not decorative 01/02/03 scaffolding. The one real gap was brand.md's imagery mandate: zero photography anywhere on a brand-register sales page for a real, human-led, in-person service — for a skeptical institutional buyer, seeing the actual thing does real trust-building work text alone can't. Left unaddressed here (see below) rather than filling it with a generic stock photo.

**Deterministic scan**: `detect.mjs` on InPersonCourses.tsx — exit 0, zero findings. No false positives to adjudicate.

**Visual overlays**: unavailable, same as prior pages — no browser automation tool exposed, no dev server running.

## Overall Impression

The curriculum content itself is exceptional — concrete, specific, non-alarmist, exactly the "patient neighbor" voice PRODUCT.md calls for. The structural problems were a schedule calendar that spent 24 cells' worth of visual weight on an "example" (20 of them empty), a CTA that promised more than the destination delivered ("Book" → a lead-gen form), and a self-paced cross-link placed at the exact moment of commitment rather than as early routing. None of these needed new facts to fix — they were fixed directly.

## What's Working

1. **Concrete, plainspoken curriculum copy** ("How scammers use AI-cloned voices to impersonate family members...") — specific and non-alarmist, on-brand.
2. **Genuinely solid form failure handling** — `role="alert"` on error, `role="status" aria-live="polite"` on success, preserved field values on failure, disabled+relabeled submit button.
3. **Awareness that the calendar was an example, expressed twice** (badge + note) — the intent was right even though the visual weight didn't back it up before this pass.

## Priority Issues

**[P0] No cost/pricing information anywhere on the page.**
- **What**: "Free," "cost," "price," or "$" never appeared anywhere in reference to the in-person course itself.
- **Why it matters**: The actual visitor is often a community-activities coordinator evaluating this as a vendor decision on behalf of a budget-holding facility. Asking for contact details before disclosing cost reads as a lead-gen funnel withholding information — cutting against PRODUCT.md's "not a vendor selling protection" anti-reference.
- **Status**: **Not fixed** — this needs a real, factual answer (free? sliding scale? quote-based?) from the project owner, not an invented one. Fabricating a cost claim on a real production site would be a factual/business error, not a design fix.
- **Suggested command**: `/impeccable clarify` (once the real answer is known)

**[P1] The schedule calendar was overbuilt relative to the information it carried, and risked reading as a fixed schedule.**
- **What**: A full 7×4 grid (24 cells, 20 empty) rendered a negotiable "example" day/time as if it were real calendar data.
- **Fix applied**: Replaced the grid with a compact 4-row list (`.schedule-rhythm`) — one row per curriculum week, showing the week-number pill (reusing `.curriculum-week-number` instead of a near-duplicate style), the example day inline labeled "(example)", and the week's topic. Zero empty cells, and the "example" framing now travels with each row instead of living only in a separate badge/caption that could be cropped out of a forwarded screenshot.
- **Files**: `frontend/src/pages/InPersonCourses.tsx`, `frontend/src/styles/global.css`

**[P1] Zero imagery on a page selling a real, in-person, human-led service.**
- **What**: No photo anywhere — no instructor, no classroom, no senior-living common room.
- **Status**: **Not fixed** — this is the one place on the site where brand.md's imagery mandate applies most directly, but inventing a generic stock photo of unspecified people for a real business's real program isn't a call to make without the project owner's input on what to show.
- **Suggested command**: `/impeccable delight` or `/impeccable craft`, once a real photo or an approved stock direction exists.

**[P2] "Book a course" CTA didn't match what actually happens next.**
- **What**: Clicking "Book a course" only anchor-scrolled to a contact/inquiry form — no reservation occurs.
- **Fix applied**: Renamed the CTA to "Request this course," matching the real action (an inquiry, not a completed booking).
- **File**: `frontend/src/pages/InPersonCourses.tsx`

**[P2] The self-paced cross-link was placed at the exact moment of commitment, right after "free" had just been used to describe the other option.**
- **What**: "Looking for the free self-paced lessons instead?" sat as the very last line before the footer, directly under the mailto: fallback — right where a coordinator was about to submit the form.
- **Fix applied**: Moved this link up into the hero section, right after the opening explanation, so it reads as early routing ("here's the other path, in case this isn't the fit") rather than a last-second doubt injected right before commitment. Removed the duplicate at the bottom.
- **Files**: `frontend/src/pages/InPersonCourses.tsx`, `frontend/src/styles/global.css`

## Persona Red Flags

**"Dana" — Community Activities Coordinator** (project-specific persona): Still cannot find a cost figure anywhere (P0, unresolved) — will need to submit the form just to learn if this fits her budget. The calendar no longer over-answers a question she didn't ask; it's now a compact reference instead of the loudest thing on the page.

**Jordan (Confused First-Timer)**: The empty decorative `<span></span>` inside every `.eyebrow` across the site (Home, this page, Practice, LessonDetail) lacked `aria-hidden`, meaning a screen reader could expose an unlabeled blank node mid-sentence — fixed site-wide as part of this pass, not just here.

**Sam (Accessibility-Dependent User)**: Native `<input type="date">` and text-based "(optional)" labeling were already solid (no color-only meaning). The eyebrow `aria-hidden` fix above closes the one real gap found for this persona on this page.

## Minor Observations

- `.curriculum-week-number` and the old `.schedule-cell-week` were near-duplicate pill styles for the same concept (a week-number badge) — consolidated to one class (`.curriculum-week-number`) as part of the calendar rewrite, removing the duplication rather than leaving both.
- `errorMessage` in the contact form falls back to `err.message` for non-`Error` throws — worth confirming `sendInquiry`'s error contract guarantees a plain-language message, but out of scope for this file (lives in `lib/api.ts`).

## Questions to Consider

1. Given PRODUCT.md explicitly names "no manufactured urgency" and "not a vendor selling protection" as anti-references — does withholding cost until after a lead is captured read, to a skeptical institutional buyer, like exactly the vendor playbook the brand is trying to avoid?
2. What's the actual pricing model for the in-person course — free (like the video lessons), sliding scale, or quote-based? This blocks a real fix to the P0 issue above.
3. Is there a real photo (an instructor, a past session, a senior-living common room) that could replace the current all-typographic treatment of this page?
