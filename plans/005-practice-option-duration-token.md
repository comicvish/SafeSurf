# 005 — Replace hand-typed `0.15s` with `var(--duration-fast)` in `.practice-option`

- **Status**: DONE
- **Commit**: 066382c
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file (`frontend/src/styles/global.css`), 1 rule

## Problem

`.practice-option`'s transition list hand-types `0.15s` four times instead of using the repo's own `--duration-fast: 150ms` token (`frontend/src/styles/tokens.css:17`) — the values are numerically identical, so this is a pure duplication with no visual effect, but it's the kind of "five hand-typed durations that almost match" drift AUDIT.md §7 calls out as a consolidation finding.

```css
/* frontend/src/styles/global.css:1271-1285 — current */
.practice-option {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 16px 18px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 2px 6px -4px rgba(15, 44, 82, 0.2);
  font-weight: 600;
  font-size: 16px;
  transition: 0.15s border-color, 0.15s background, 0.15s box-shadow, 0.15s opacity,
    transform var(--duration-fast) var(--ease-out);
}
```

## Target

```css
/* frontend/src/styles/global.css:1271-1285 — target */
.practice-option {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 16px 18px;
  border: 2px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, 0 2px 6px -4px rgba(15, 44, 82, 0.2);
  font-weight: 600;
  font-size: 16px;
  transition: var(--duration-fast) border-color, var(--duration-fast) background, var(--duration-fast) box-shadow,
    var(--duration-fast) opacity, transform var(--duration-fast) var(--ease-out);
}
```

No visual change — `var(--duration-fast)` resolves to `150ms`, identical to `0.15s`. The implicit timing-function (`ease`, CSS's default when unspecified) is intentionally left unspecified for `border-color`/`background`/`box-shadow`/`opacity`, since AUDIT.md §2's easing decision order lists "Hover / color change → `ease`" — that's already correct, only the duration literal is being tokenized.

## Repo conventions to follow

- `--duration-fast` and `--duration-base` are defined in `frontend/src/styles/tokens.css:17-18` and used as `var(--duration-fast)`/`var(--duration-base)` throughout `global.css` (e.g. `frontend/src/styles/global.css:179`, `:210`, `:253`) — this plan brings `.practice-option` in line with that existing convention.

## Steps

1. In `frontend/src/styles/global.css:1283-1284`, replace the four `0.15s` literals with `var(--duration-fast)`, keeping each property name and the comma-separated structure otherwise identical, and leave the final `transform var(--duration-fast) var(--ease-out)` segment unchanged (it already uses the token).

## Boundaries

- Do NOT change the `transform var(--duration-fast) var(--ease-out)` segment — it's already correct.
- Do NOT change any other rule in the file.
- Do NOT add new dependencies.
- If `.practice-option`'s transition declaration doesn't match the excerpt above (drift since commit `066382c`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit -p .` — expect no errors (CSS-only change with zero visual delta).
- **Feel check**: run `npm run dev`, start a quiz, hover and select a practice option — the border/background/shadow transition speed should be visually indistinguishable from before (150ms either way). This is a token-consolidation change, not a behavior change — the check is confirming *nothing* looks different.
- **Done when**: `global.css:1283-1284` contains no bare `0.15s` literals, and `grep -n "var(--duration-fast)" frontend/src/styles/global.css` includes this rule's four properties.
