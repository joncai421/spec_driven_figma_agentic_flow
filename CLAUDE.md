# CLAUDE.md — Agent Operating Manual

> Always loaded. Keep < 150 lines. Details live in `.claude/skills/*` (loaded on demand).

## Project facts (source of truth — humans edit, agents never guess)
- Product: <NAME> — responsive web app, **mobile-first**, PC + mobile
- Stack: <React 18 + TypeScript + Vite> · Styling: <Tailwind | CSS Modules>
- Tests: Vitest + Testing Library (unit/component), Playwright (responsive/e2e)
- Package manager: npm
- Breakpoints (min-width only): base = mobile · `md` 768px · `lg` 1024px · `xl` 1280px
- Verification viewports: 375×812 (mobile), 768×1024 (tablet), 1280×800 (desktop)
- Design tokens: `src/styles/tokens.css` — the ONLY file allowed to contain raw color values
- Shared components: `src/components/` · Features: `src/features/<feature>/`
- Figma file: <URL> (file key `<KEY>`)
- TypeScript pinned to 6.0.3 because typescript-eslint does not support TS7 yet. Do not upgrade
  TypeScript without human approval. Revisit when typescript-eslint supports TS7.

## Commands
| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint / Types | `npm run lint` / `npm run typecheck` |
| Unit tests | `npm run test` · related: `npx vitest related --run <files>` |
| Responsive e2e | `npm run test:e2e` |
| Gates (fast) | `npm run verify` |
| Gates (full, pre-merge) | `npm run verify:full` |

## Non-negotiable rules
1. **Spec first.** No production code unless `specs/<feature>/requirements.md` has `Status: APPROVED`
   and the work maps to a task in `tasks.md` that references AC IDs.
2. **Never invent.** Every design value comes from Figma MCP output or `design.md` (with node ID).
   Every API, import, prop, or package must be verified in this repo (`package.json`, `node_modules`
   types, `src/`) before use. If you can't verify it, write `UNKNOWN` and ask. "I don't know" is a valid answer.
3. **TDD.** Failing test first (proven red), then minimal code to green, then refactor.
   Test names carry the AC ID: `it('[FEAT-AC-01] …')`.
4. **Mobile-first.** Base styles = mobile. Enhance with `min-width` queries only. No `max-width`
   queries without a written reason. No raw colors/hex outside `tokens.css`.
5. **Gates are mandatory.** Never claim "done", "works", or "matches design" without command output
   or screenshot evidence produced in this session.
6. **Scope.** Implement only the current task. Spec gaps → `progress.md` › "Spec change requests". Never
   edit an APPROVED spec. Never weaken or delete a test to make it pass.
7. **Figma code is reference, not source.** Translate MCP output into our components and tokens. Never
   paste absolute positioning or hard-coded values.

## Gated workflow
| Gate | Meaning | Owner / How |
|---|---|---|
| G0 Spec | requirements.md `Status: APPROVED` | Human (`/spec` drafts it) |
| G1 Design facts | design.md complete, tokens mapped, no blocking UNKNOWNs | figma-analyst + human glance |
| G2 Red | failing tests exist for every AC in the task, failing for the right reason | test-writer, orchestrator re-runs |
| G3 Green | `npm run verify` passes | implementer + Stop hook |
| G4 Visual | no blocking diffs vs Figma at 3 viewports | visual-verifier |
| G5 Review | reviewer verdict PASS | reviewer (fresh context) |
| G6 Accept | human accepts, commits; spec → `DONE` after `verify:full` | Human |

Main entry: `/spec` → (human approves) → `/plan` → `/implement <feature>` per task → `/handoff` → `/clear`.

## Session rules (context hygiene)
- **One task per session.** After a task: `/handoff`, then `/clear`. The SessionStart hook restores state.
- Heavy reads (Figma, broad code search) go to **subagents**. Only their summaries come back.
- Never call Figma `get_design_context` on a whole page. Use `get_metadata` first, then specific nodes.
- Extracted design facts live in `design.md`. Re-read that file instead of re-fetching Figma.
- Before `/compact`, run `/handoff`. Compact with focus: `/compact keep current task, gate status, failing tests`.

## Where things live
- Specs: `specs/<feature>/{requirements,design,tasks,progress}.md` (templates in `specs/_templates/`)
- Conventions: `docs/conventions.md` · Token map: `docs/design-system.md`
- Skills: spec-writing, figma-extract, tdd, implement, self-review, responsive-verify, session-control

## When unsure
Stop and ask a specific question with options. Don't proceed on assumptions. Record each assumption in
the spec's "Assumptions" section for human confirmation.
