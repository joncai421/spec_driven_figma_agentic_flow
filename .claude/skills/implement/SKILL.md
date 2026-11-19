---
name: implement
description: Use when writing production code for an approved task. Mobile-first, token-only styling, verified APIs and imports, component reuse, minimal diff, and mandatory verification before claiming completion.
---

# Implementation

## Preconditions (stop if any fail)
- requirements.md `Status: APPROVED`. The task exists in tasks.md.
- Failing tests for this task exist (G2 passed).
- design.md rows for the touched elements have no blocking `UNKNOWN`.

## Verify-before-use (anti-hallucination)
- **Imports/packages:** confirm the package is in `package.json`. Confirm the export exists (grep
  `node_modules/<pkg>/**/*.d.ts` or the source). Never add a dependency without human approval.
- **Internal APIs/components/props:** open the file and read the actual signature. Do not assume.
- **Tokens:** grep `src/styles/tokens.css` for each token you use.
- **Paths:** confirm the file or directory exists before importing it or creating siblings.

## Build order
1. Search `src/components/` for an existing component first. Extend it via props or variants instead of duplicating.
2. Semantic HTML first (`button`, `nav`, `main`, `label`, headings in order), then style.
3. **Mobile-first styling:**
   - Base styles target the smallest viewport. Add `md:` / `lg:` (or `@media (min-width: …)`) only for changes.
   - Layout with flex/grid and gap. No absolute positioning for layout. No fixed widths that break below 320px.
   - Fluid images (`max-width: 100%`). Long text must wrap or truncate as the design specifies.
   - Touch targets ≥ 44×44 on mobile. Hover styles never carry essential information. Provide `:focus-visible`.
4. States: loading, empty, error, disabled, as specified in design.md.
5. Minimal code to pass the tests → refactor → keep the diff focused on the task. No drive-by changes.

## Finish
- Run `npx vitest related --run <changed files>`, then `npm run verify`. Paste the summarized results.
- Check the task boxes in tasks.md only with evidence. Append a progress.md entry.
- If blocked: stop, explain what blocks you, propose 1–3 options. Do not improvise around the spec.
