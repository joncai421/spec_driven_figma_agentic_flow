# Specs
One folder per feature: `specs/<feature-slug>/`

Slug suggestion: use the Jira/issue ID as the slug (e.g. `ABC-123`). Keep the `Spec-ID` inside
requirements.md hyphen-free uppercase (e.g. `ABC123`) — AC IDs and test names depend on it, and the
traceability gate only matches `[A-Z][A-Z0-9]+-AC-NN`. Slug and Spec-ID must be unique across features.

| File | Purpose | Who edits |
|---|---|---|
| requirements.md | What & why. EARS ACs with IDs. Status lifecycle. | Agent drafts; **human approves** (then frozen by hook) |
| design.md | Verified Figma facts, tokens, responsive behavior, file plan | figma-analyst; human reviews |
| tasks.md | Ordered, session-sized tasks mapped to ACs | Agent (/plan), human confirms |
| progress.md | Handoff log + spec change requests | Agent (/handoff) |

Status lifecycle: `DRAFT` → `APPROVED` (human) → `DONE` (human, after `npm run verify:full` passes).
Changing an APPROVED spec: the human sets it back to `DRAFT`, edits, re-approves, and adds a Change log line.
