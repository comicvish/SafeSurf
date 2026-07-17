---
target: Practice.tsx
total_score: 20
p0_count: 2
p1_count: 2
timestamp: 2026-07-17T17-22-26Z
slug: frontend-src-pages-practice-tsx
---
Method: dual-agent (A: design review · B: detector-evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Progress bar showed 0% width for the entire first question; the "checking your answer" wait had no spinner. |
| 2 | Match System / Real World | 3/4 | Plain quiz language throughout. |
| 3 | User Control and Freedom | 1/4 | No way to revisit a previous question, no undo on a selection before the explanation arrived. |
| 4 | Consistency and Standards | 3/4 | `revealError`/`submitError` reused `.auth-error` — a class named for the auth form, borrowed here (naming smell, not fixed — low risk/benefit for a broader rename). |
| 5 | Error Prevention | 1/4 | Nothing prevented the core failure mode: an explanation-fetch failure silently unlocked "continue" with the correctness signal permanently lost for that question. |
| 6 | Recognition Rather Than Recall | 3/4 | Options stay visible, no memorization required. |
| 7 | Flexibility and Efficiency | 1/4 | No keyboard shortcuts; lower priority for this audience but a real gap against the heuristic. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean single-question-per-screen layout. |
| 9 | Error Recovery | 1/4 | On explanation-fetch failure, the user learned the explanation failed but never learned — and had no way to find out — whether their answer was correct. |
| 10 | Help and Documentation | 1/4 | No inline help for what XP/streak mean to a first-time user. |
| **Total** | | **20/40** | **Acceptable, at the low edge — set almost entirely by error-handling, not visuals** |

## Anti-Patterns Verdict

**LLM assessment**: Not template-shaped AI slop — the Lit Glass treatment on `.practice-feedback`/`.practice-stat` is faithful to DESIGN.md, and the single-question-per-screen structure is a genuinely well-managed intrinsic-load decision. The real failure was **functional slop dressed as a finished feature**: a state machine coded to the happy path, never traced through its own error branch — the kind of gap a reviewer only catches by clicking through failure, not by looking. Also: DESIGN.md explicitly names `.practice-option` as "the most stateful component in the system" and states every state must be distinguishable by shape/border, not color alone — the implementation shipped color-only anyway (correct=green, incorrect=red, no other signal), a direct contradiction of the system's own written rule for this exact component.

**Deterministic scan**: `detect.mjs` on Practice.tsx — exit 0, zero findings.

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

This is a safety-education quiz about recognizing scams and deepfakes — the entire value proposition is "learn whether your instinct was right." The two P0s both broke that core promise: color-only correct/incorrect states fail for colorblind users on the exact two states that matter most, and an explanation-fetch failure silently dropped the correctness signal entirely while still letting the user proceed. Both fixed directly, along with the progress bar math, the low-score copy tone, and focus management between questions.

## What's Working

1. **Real `<button>` elements for every option**, with `disabled={hasAnswered}` after answering — correct semantic base, keyboard-focusable by default.
2. **Sequential, single-question-per-screen structure** — a genuinely well-managed intrinsic-load decision for this audience, not dumping the whole quiz at once.
3. **Faithful Lit Glass execution** on `.practice-feedback` and `.practice-stat` — blur+saturate, inset highlight, tinted shadow all present.

## Priority Issues

**[P0] The explanation-fetch failure path silently and permanently lost the correctness signal.**
- **What**: `state` was only ever set to `correct`/`incorrect`/`dimmed` inside `if (reveal)`. When the explanation fetch failed, `reveal` stayed `undefined` forever for that question — the selected option stayed at `state = 'selected'` (the same visual as "not yet resolved"), while the feedback panel unlocked "Next question" with an apologetic note. The user could complete the entire quiz never learning if any of their answers were right.
- **Context**: The backend deliberately withholds the correct answer index until after answering (`PracticeQuestion` has no `correctIndex`; it only arrives via the separate `getQuestionAnswer` reveal call) — almost certainly an anti-cheat design, so "just compute correctness client-side without the fetch" isn't a valid fix.
- **Fix applied**: Added a real retry path (`loadReveal`, callable again from a "Try again" button in the error state) instead of one silent attempt. Continuing past a failed reveal now requires an explicit, separate action — a "Skip — I'll find out later" link — rather than the app auto-unlocking "continue" and quietly discarding the correctness signal. This preserves both the core value (you should find out if you were right) and an honest escape hatch (you're not permanently stuck if the network is genuinely down).
- **File**: `frontend/src/pages/Practice.tsx`

**[P0] Correct/incorrect states were distinguished by color alone, contradicting DESIGN.md's explicit rule for this component.**
- **What**: `.practice-option.correct`/`.incorrect` differed only by hue/tint — no icon, glyph, or text label. Red/green confusion is the most common form of color blindness, and this was the one component testing the two states where a misread has the highest cost.
- **Fix applied**: Added a checkmark/✕ glyph (`.practice-option-icon`, `currentColor` so it matches the state's text color) before each option's text, plus a visually-hidden suffix ("— correct answer" / "— your answer, incorrect") for screen readers. The icon slot is present (empty) on every option so answered/unanswered states don't shift layout.
- **Files**: `frontend/src/pages/Practice.tsx`, `frontend/src/styles/global.css`

**[P1] Progress bar showed 0% for the entire first question and never reached 100%.**
- **What**: `width: (currentIndex / total) * 100%` is 0 at `currentIndex === 0`, and `currentIndex` never reaches `total` before the results screen replaces the bar.
- **Fix applied**: Progress now factors in whether the current question has been answered: `((currentIndex + (hasAnswered ? 1 : 0)) / total) * 100`.
- **File**: `frontend/src/pages/Practice.tsx`

**[P1] Low-score encouragement copy was tonally miscalibrated for safety-stakes content.**
- **What**: Any score under 50% got the identical cheerful "Keep practicing — you'll get it!" as a near-miss, with no acknowledgment that this is content worth re-learning, not just re-attempting.
- **Fix applied**: Low scores (`ratio < 0.5`) now show "This one's worth another look," a nudge line recommending a rewatch, and the action order flips so "Back to lesson" leads instead of "Try again" — encouraging review before another blind attempt.
- **File**: `frontend/src/pages/Practice.tsx`

**[P2] No visible reason for the disabled continue button during the reveal-fetch wait — addressed as part of the P0 fix above** (the retry/skip UI now makes the wait state's purpose and options explicit rather than a silent stall).

## Persona Red Flags

**Sam (Accessibility-Dependent User)**: The color-only correct/incorrect distinction (P0) is now resolved with icon + visually-hidden text. Added `role="radiogroup"`/`aria-label` on the options container and `role="radio"`/`aria-checked` on each option so a screen reader announces "N mutually exclusive choices" instead of a flat button sequence. Added `aria-live="polite"` to `.practice-feedback` so explanation/error text is announced when it appears.

**Jordan (Confused First-Timer)**: No longer left wondering "did my tap register" during the checking-your-answer wait with no path forward if it fails — a clear retry/skip choice is now presented. The low-score result screen now explicitly suggests rewatching the lesson rather than only offering "Try again."

**Casey (Distracted/Slow-Connection User)**: The reveal-fetch retry path gives real recourse on a poor connection instead of an indefinite silent wait.

## Minor Observations

- Added focus management: the question heading now receives programmatic focus (`tabIndex={-1}` + a ref-based `.focus()` call) on every question transition, so keyboard users land on the new question instead of a stale, removed button.
- `revealError`/`submitError` reusing the `.auth-error` class (named for the auth form) is a naming smell, not fixed here — a broader rename would need to touch every usage across the app; flagged rather than done piecemeal.
- `handleTryAgain` still replays the identical question set in the identical order — for an "AI-generated practice quiz" per PRODUCT.md, this undercuts practice as ongoing reinforcement rather than a memorization drill. Not fixed — would need a backend change to serve a fresh question set, out of scope for a frontend design pass.

## Questions to Consider

1. Is there a path to regenerate a fresh question set on "Try again" rather than replaying the same questions verbatim?
2. Should the reveal-fetch retry/skip UI introduced here also apply the same pattern anywhere else the app fetches supporting content that isn't itself the primary action (if such a pattern exists elsewhere)?
