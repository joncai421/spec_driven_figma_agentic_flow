---
name: spec-writing
description: Use when creating or revising a feature spec (requirements.md, design.md, tasks.md). Produces testable EARS acceptance criteria with IDs, explicit assumptions and open questions, and never invents requirements.
---

# Spec Writing

## Principles
- A spec is a contract. Every acceptance criterion (AC) must be **observable and testable**.
- Sources only: the user's request, linked PRD/tickets, Figma (via figma-extract). Anything else is an
  **Assumption** (listed for confirmation) or an **Open question**. It is never silently written in as a requirement.
- New specs start with `Status: DRAFT`. Only a human sets `APPROVED`.

## Steps
1. Copy `specs/_templates/*` to `specs/<feature>/` — only if the folder does not exist yet; never
   overwrite an existing spec. Prefer the Jira/issue ID as the feature slug (e.g. `ABC-123`).
   Choose a short uppercase `Spec-ID` (e.g. `LOGIN`, or `ABC123` from the ticket) — no hyphens, it
   must match `[A-Z][A-Z0-9]+` for AC traceability. It must be unique
   across features: grep `Spec-ID:` in `specs/*/requirements.md` first, and stop and ask on collision
   (duplicate Spec-IDs make AC IDs ambiguous and let one feature's tests satisfy another's traceability).
2. Write requirements in **EARS** form:
   - Ubiquitous: `THE SYSTEM SHALL …`
   - Event: `WHEN <trigger>, THE SYSTEM SHALL …`
   - State: `WHILE <state>, THE SYSTEM SHALL …`
   - Unwanted: `IF <condition>, THEN THE SYSTEM SHALL …`
   - Optional: `WHERE <feature/breakpoint>, THE SYSTEM SHALL …`
3. Give each AC an ID `<SPEC>-AC-<NN>` and its breakpoints (`all`, `mobile`, `md+`, …) and a source
   (`figma:<nodeId>`, `PRD §x`, `user`).
4. Always cover: empty / loading / error / success states, keyboard and screen-reader behavior, and
   responsive behavior per breakpoint, if they apply.
5. Non-functional: WCAG 2.2 AA, touch targets ≥ 44×44px on mobile, no horizontal scroll at ≥ 320px.
6. List **Out of scope** explicitly.
7. End with Assumptions + Open questions. Ask the human to review and set `Status: APPROVED`.

## Quality bar (self-check before handing over)
- [ ] Every AC is verifiable by an automated test (unit or Playwright) or marked `manual` with a reason
- [ ] No AC contains vague words ("nice", "fast", "intuitive") without a measurable threshold
- [ ] Every Figma-derived AC cites a node ID
- [ ] No implementation details in requirements (those belong in design.md)

## tasks.md rules (used by /plan)
- Each task is **one session of work**: ≤ ~5 files, one component or one behavior slice.
- Each task lists: ACs covered, test files to write first, files to touch, Figma node IDs, done criteria.
- Order tasks so the shared primitives and tokens come first, then components, then page composition and responsive e2e.
- Every AC must be covered by at least one task.
