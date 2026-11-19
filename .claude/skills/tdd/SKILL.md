---
name: tdd
description: Use when writing tests or starting any implementation task. Enforces red-green-refactor with AC-tagged tests, proven failure for the right reason, behavior-focused UI tests, and responsive Playwright checks.
---

# TDD for Responsive UI

## Cycle (per AC or small AC group)
1. **Red:** write the test(s). Run them. They must fail **on an assertion**, not on a syntax or config error.
   - If the component doesn't exist yet, create a minimal stub (`export function Foo() { return null }`)
     so the failure is meaningful.
   - Record the red output summary in progress.md (command + failing test names).
2. **Green:** write the minimum production code to pass. Run the related tests.
3. **Refactor:** clean up with all tests green. Run `npm run verify`.

## Naming & traceability
- `describe('<Component>')` → `it('[LOGIN-AC-03] shows inline error when email is invalid', …)`
- Each AC in the task has at least one tagged test. `scripts/verify.mjs` enforces this for DONE specs.

## Unit/component tests (Vitest + Testing Library)
- Query priority: `getByRole` (with `name`) → `getByLabelText` → `getByText` → `getByTestId` (last resort).
- Test behavior the user sees: rendering, interaction (`userEvent`), states, a11y names, focus management.
- Do not test implementation details: no state internals, no class names, no DOM snapshots.
- Mock only at the network boundary. Check `package.json` for MSW before assuming it exists.

## Responsive tests (Playwright; projects = mobile/tablet/desktop)
- Assert **layout intent**, not pixels:
  - visibility per breakpoint (e.g. hamburger visible on mobile, inline nav on lg)
  - stacking vs. side-by-side via `boundingBox()` comparisons (y of B > y of A on mobile; equal row on lg)
  - no horizontal overflow: `document.documentElement.scrollWidth <= window.innerWidth`
  - touch targets ≥ 44×44 on mobile for interactive elements in scope
- Use `test.skip(testInfo.project.name !== 'mobile', …)` for breakpoint-specific ACs.
- Visual baselines (`toHaveScreenshot`) are added **only after** a human approves the G4 visual match.
  From then on they act as regression gates.

## Forbidden
- Editing or deleting a failing test to make it pass, unless the spec changed (cite the change).
- `it.skip` / `.only` left in code. Empty assertions. `expect(true)`.
- Tests that would still pass if the feature were deleted. Sanity-check by reasoning: "what makes this fail?"
