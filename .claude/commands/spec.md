---
description: Draft a new feature spec from a request + Figma links (stops at G0 for human approval)
argument-hint: <feature-slug> <figma-url> [more urls / notes]
---
Arguments: $ARGUMENTS  (first token = feature slug, rest = Figma URLs and notes)

Slug suggestion: prefer the Jira/issue ID as `<feature>` (e.g. `ABC-123`). Derive the Spec-ID from it
without hyphens, uppercase (e.g. `ABC123`) — the AC-traceability regex requires `[A-Z][A-Z0-9]+`.

0. **Preflight** (stop on failure): `specs/<feature>/` must NOT already exist — never overwrite or
   re-template an existing spec. Grep `Spec-ID:` across `specs/*/requirements.md`; the chosen Spec-ID
   must be unused (AC IDs and test names depend on its uniqueness). On collision, stop and ask the
   human for a different slug / Spec-ID.
1. Use the spec-writing skill. Create `specs/<feature>/` from `specs/_templates/`.
2. Delegate to the **figma-analyst** subagent with the Figma URLs to fill `design.md`.
3. Draft `requirements.md` (Status: DRAFT) from the request, notes and design facts. Cite sources.
4. Do NOT create tasks yet. Do NOT write code.
5. Reply with: a summary, the AC list, Assumptions, Open questions, design UNKNOWNs, and token proposals. Then:
   "Review specs/<feature>/requirements.md and design.md. Set `Status: APPROVED` to pass G0, then run `/plan <feature>`."
