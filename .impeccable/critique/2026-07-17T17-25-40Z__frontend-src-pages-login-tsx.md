---
target: Login.tsx + Signup.tsx
total_score: 17
p0_count: 2
p1_count: 2
timestamp: 2026-07-17T17-25-40Z
slug: frontend-src-pages-login-tsx
---
Method: dual-agent (A: design review · B: detector-evidence) — Login.tsx and Signup.tsx reviewed together as one surface (nearly identical auth forms)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Submit button text changed correctly ("Signing in…"), but no `:disabled` styling existed anywhere, so the button looked fully live during a pending request. |
| 2 | Match System / Real World | 3/4 | Plain-language labels and headings; the real gap was the error copy itself (euphemistic, not concrete). |
| 3 | User Control and Freedom | 1/4 | No forgot-password path anywhere, no password visibility toggle — a forgotten password was a hard dead end. |
| 4 | Consistency and Standards | 2/4 | Internally consistent classes/layout, but no `autocomplete` hints, no visible password requirement until after failure; Signup's h1 ("Create an account") didn't match its button ("Sign up"). |
| 5 | Error Prevention | 1/4 | `minLength={6}` was the only guardrail, surfaced only via native browser validation with no upfront hint. |
| 6 | Recognition Rather Than Recall | 3/4 | Real `<label>` elements wrapping inputs, always visible — done correctly. |
| 7 | Flexibility and Efficiency | 1/4 | Missing `autocomplete` attributes actively blocked password-manager autofill/generation. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean, restrained, on-brand. |
| 9 | Error Recovery | 0/4 | Both pages collapsed every distinct Firebase error code into one static string regardless of cause — the worst score on the sheet. |
| 10 | Help and Documentation | 0/4 | No help link, no support contact, no self-service recovery of any kind. |
| **Total** | | **17/40** | **Poor — functional gaps, not visual ones** |

## Anti-Patterns Verdict

**LLM assessment**: Visually clean — no gradient text, no side-stripe borders, no invented affordances, consistent reuse of the site's Lit Glass `.auth-form` card. But applying the actual product-register slop test (would a user fluent in Linear/Stripe-grade auth forms trust this?) surfaces the real problem: a competent-looking shell around unwired plumbing. No password-manager offered to fill/save credentials (no `autocomplete` anywhere), no "forgot password" exit existed anywhere in the app despite DESIGN.md itself documenting `.text-link` as reserved for exactly that pattern, and the one error state that did exist told the user nothing about what actually went wrong. This reads as "unfinished," arguably a worse trust signal for a security-education product than a visual tell would be.

**Deterministic scan**: `detect.mjs` on both files — exit 0, zero findings on either. Verified the detector wasn't silently no-op'ing via a synthetic anti-pattern test file (correctly flagged) and a `--no-config` re-run (same clean result).

**Visual overlays**: unavailable — no browser automation tool exposed, no dev server running.

## Overall Impression

The failures here traced to a single root cause: `signIn`/`signUp` in `authContext.tsx` pass Firebase's `createUserWithEmailAndPassword`/`signInWithEmailAndPassword` straight through, and both pages caught the error with a bare `catch {}` — no parameter bound, one hardcoded string regardless of which of Firebase's distinct error codes fired. A returning user who mistypes their password saw the identical message as someone who never signed up, identical to someone hitting the rate limiter. Fixed directly, along with the missing password-reset flow, autocomplete, type-scale violation, and password visibility.

## What's Working

1. **Visual restraint and consistency** — both pages reuse the same `.auth-form` glass card, same button, same type scale, no decoration for its own sake — exactly the "earned familiarity" the product register asks for.
2. **Labels done correctly** — real `<label>` elements wrapping each input, always visible rather than placeholder-only.
3. **Global focus-visible handling** — every input/button/link gets a 2px navy focus outline site-wide, never suppressed.

## Priority Issues

**[P0] Generic, code-blind error messages collapsed distinct failure states into one string.**
- **What**: Both pages `catch {}` without binding the error, hard-coding one sentence regardless of Firebase's actual `AuthError.code` (`auth/wrong-password`, `auth/user-not-found`, `auth/invalid-email`, `auth/too-many-requests`, `auth/network-request-failed` for sign-in; `auth/email-already-in-use`, `auth/weak-password`, `auth/invalid-email` for sign-up).
- **Fix applied**: New `frontend/src/lib/authErrors.ts` maps each real Firebase error code to a specific, plain-language message (`getSignInErrorMessage`, `getSignUpErrorMessage`, `getPasswordResetErrorMessage`). Both pages now catch the actual error and branch on it. Where Firebase's email-enumeration protection can return the same `auth/invalid-credential` code for both "wrong password" and "no such account" (project-config dependent, can't be determined from source alone), the message is honestly combined ("Email or password doesn't match — check both, or reset your password below") rather than guessing which one occurred.
- **Files**: `frontend/src/lib/authErrors.ts` (new), `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`

**[P0] No account-recovery path anywhere in the app, despite DESIGN.md documenting it.**
- **What**: No "Forgot password?" link existed on either page; no `sendPasswordResetEmail` call existed anywhere in the frontend. DESIGN.md's own Components section names `.text-link` as reserved for "secondary actions like 'forgot password' or switching auth mode" — the pattern was specified but never built.
- **Fix applied**: Added `resetPassword` to `authContext.tsx` (wrapping `sendPasswordResetEmail`). Login.tsx now has a "Forgot password?" `.text-link` that swaps the form into a reset mode (email field + "Send reset email", with a "Back to sign in" link), showing a calm confirmation message on success.
- **Files**: `frontend/src/lib/authContext.tsx`, `frontend/src/pages/Login.tsx`

**[P1] No `autocomplete` attributes on any auth input.**
- **What**: Neither page's email or password input had an `autocomplete` attribute, blocking browser/password-manager autofill and generation — a real irony on a product teaching credential hygiene.
- **Fix applied**: Added `autocomplete="email"` to both email inputs, `autocomplete="current-password"` on Login's password field, `autocomplete="new-password"` on Signup's. Also added `name` attributes to all inputs (some password managers key on this in addition to `autocomplete`).
- **Files**: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`

**[P1] Auth-form label and error text sat below DESIGN.md's own documented 16px floor.**
- **What**: `.auth-form label` and `.auth-error` were both 14px, violating the system's own "No-Tiny-Type Rule" (body text never drops below 1rem, given the senior-heavy audience) on the exact page where misreading a label or missing an error has the highest cost.
- **Fix applied**: Both raised to 16px; `.auth-form input` also raised from 15px to 16px for consistency.
- **File**: `frontend/src/styles/global.css`

**[P2] No password show/hide toggle; Signup's error copy overloaded one run-on sentence.**
- **What**: Neither password field could be visually verified before submit; Signup's old error text carried an apology, a parenthetical technical constraint, and a generic instruction in one breath.
- **Fix applied**: Added a "Show"/"Hide" toggle button next to both password inputs (`.password-field`/`.password-toggle`). The run-on error sentence is resolved by the P0 fix above — `getSignUpErrorMessage` now returns a clean, single-cause sentence (e.g., "Password needs at least 6 characters" only when that's the actual cause) instead of bundling everything into one message regardless of cause. Also added an upfront `(at least 6 characters)` hint next to Signup's password label so the constraint is visible before a failed attempt, not just after.
- **Files**: `frontend/src/pages/Login.tsx`, `frontend/src/pages/Signup.tsx`, `frontend/src/styles/global.css`

**[Minor, fixed] No `:disabled` styling on buttons; Signup's h1/button terminology mismatch.**
- Added a global `.button:disabled`/`.header-cta:disabled` rule (dimmed opacity, `cursor: not-allowed`, no hover/press transform) so pending submits visibly read as non-interactive.
- Signup's button now reads "Create account" to match its h1 ("Create an account"), instead of the previous "Sign up".

## Persona Red Flags

**Jordan (Confused First-Timer)**: No longer stuck between "did I mistype, or do I not have an account" — the specific error message now points at the actual cause, and a working "Forgot password?" link exists as a real recovery path instead of a dead end.

**Sam (Accessibility-Dependent User)**: Label/error text now meets the system's own 16px floor. Screen readers now hear a specific error cause instead of a flat generic string.

**"Dorothy" (project-specific, 74, first online account after an in-person course)**: Can now see her password before submitting (show/hide toggle), gets a specific reason if something goes wrong instead of an ambiguous dead end, and has a real "Forgot password?" path if she can't remember what she used on a return visit.

## Minor Observations

- `auth/too-many-requests` and `auth/network-request-failed` are now both distinctly messaged (rate-limit vs. connectivity), rather than folded into the generic catch-all — a user with a genuinely correct password won't be told their details are wrong when the real cause is throttling or a network blip.
- The password-reset flow reuses the existing `.contact-form-success` confirmation style rather than inventing a new success-state pattern.

## Questions to Consider

1. Is this Firebase project configured with email-enumeration protection (returning `auth/invalid-credential` for both wrong-password and no-such-account)? If not, the sign-in error mapping could be split into two more specific messages instead of the current combined one.
2. Should the password-reset flow live inline on the Login page (as implemented) or as its own route — does the app's routing conventions favor one over the other for comparable secondary flows?
