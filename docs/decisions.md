# Decisions

## 2026-11-19 — Pin TypeScript to 6.0.3 (exact)
- **Context:** The scaffold shipped `typescript@7.0.2` (native compiler). The spec-driven setup
  (`proj_docs/spec-driven.md`) requires a working ESLint gate; `typescript-eslint@8.73.0` peers
  `typescript >=4.8.4 <6.1.0` and no release supports TS7 yet. Keeping TS7 broke dependency
  resolution (ERESOLVE) for every install.
- **Decision:** Pin `typescript` to exactly `6.0.3` (no caret), installed via
  `npm i -D --save-exact typescript@6.0.3`. No `--legacy-peer-deps` / `--force`.
  Owner-approved (Jon, 2026-11-19). Recorded in `CLAUDE.md` › Project facts.
- **Revisit trigger:** when `typescript-eslint` ships a release whose peer range includes TS7.
  Any TypeScript upgrade before then requires human approval.

## 2026-11-19 — Slug / Spec-ID duplication preflight (instruction-level)
- **Context:** The spec-driven setup has no duplication check: re-running `/spec` with an existing
  slug could re-template an existing spec (only APPROVED/DONE `requirements.md` is hook-protected),
  and duplicate Spec-IDs let one feature's tests satisfy another's AC traceability in `verify.mjs`.
- **Decision:** Owner-approved (Jon, 2026-11-19) instruction-level guard: added a step 0 preflight to
  `.claude/commands/spec.md` and a uniqueness rule to step 1 of `.claude/skills/spec-writing/SKILL.md`
  (stop if the slug folder exists or the Spec-ID is already used; ask the human on collision).
  These two files intentionally deviate from the bit-identical spec blocks in `proj_docs/spec-driven.md`.
  Follow-up (same day, owner-requested): added a naming suggestion — prefer the Jira/issue ID as the
  feature slug (e.g. `ABC-123`) with a hyphen-free uppercase Spec-ID (e.g. `ABC123`) — to the same two
  files plus `specs/README.md` (also now deviating from its spec block) and the root `README.md`.
- **Rejected alternative:** hard guards in `scripts/verify.mjs` or a hook (hooks are human-owned).
- **Revisit trigger:** if agents ever bypass the instruction guard, escalate to a hard gate check.