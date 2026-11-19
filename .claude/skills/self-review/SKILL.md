---
name: self-review
description: Use before declaring any task complete, and when acting as reviewer. Structured evidence-based review covering spec traceability, hallucination audit, responsive/a11y checks, test quality and scope; outputs a PASS/FAIL report.
---

# Self-Review

Review the **diff** (`git diff HEAD` plus untracked files) against the **task and its ACs**. Run commands yourself.
Never rely on earlier claims made in the conversation.

## 1. Gates (run, don't assume)
- `npm run verify` → paste the pass/fail summary per step.
- If UI changed: is the G4 visual-verifier report present with no blocking items?

## 2. Spec traceability
- Table: each AC in the task → test(s) tagged with it → pass/fail.
- Any behavior in the diff that no AC covers? → scope creep → FAIL, or move it to a change request.

## 3. Hallucination audit
- Every new import resolves to a real package or file (check each).
- Every token or CSS variable used exists in tokens.css.
- Every design value traces to design.md / Figma node. Spot-check at least 3 values.
- No invented props, env vars, endpoints or config keys.

## 4. Responsive & a11y
- Base styles are mobile; only min-width enhancements; no new `max-width` queries without a reason.
- No horizontal overflow at 320/375. Touch targets ≥ 44px. Keyboard reachable. Visible focus.
- Images have alt text. Form inputs are labelled. Heading order is sane. Color comes from tokens (contrast as designed).

## 5. Test quality
- Would each test fail if the feature were removed? Do tests use role-based queries?
- No `.only` / `.skip`. No weakened assertions. No test edits unjustified by a spec change.

## 6. Code quality
- Reuse over duplication. No dead code. No commented-out blocks. No `any` without a reason. No stray console logs.
- Names match the domain language in the spec. Files sit in the documented locations.

## Output format
```
## Review — <feature> <task>
Verdict: PASS | FAIL
Gates: lint ✅ typecheck ✅ unit ✅ build ✅ (e2e ✅/n.a.)
Traceability: <AC → tests table>
Blocking issues: <numbered, each with file:line and the fix>
Non-blocking suggestions: <list>
Evidence: <commands run + result summary>
```
