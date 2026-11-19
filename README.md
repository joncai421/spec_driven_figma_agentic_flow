# Spec-Driven x figma Agentic Development

A responsive (mobile-first, PC + mobile) React + TypeScript + Vite project wired for
**spec-driven, gated agentic development** with Figma MCP as the design source of truth.

The canonical rules live in [`CLAUDE.md`](CLAUDE.md) (always loaded, kept small).
Everything else — skills, subagents, slash commands, hooks — is loaded on demand.
The full original setup spec is in [`proj_docs/spec-driven.md`](proj_docs/spec-driven.md).

---

## The core idea

1. **Spec first.** No production code until a human approves `specs/<feature>/requirements.md`
   (`Status: APPROVED`). Every acceptance criterion (AC) has an ID like `LOGIN-AC-01`.
2. **Never invent.** Design values come from Figma MCP (cited by node ID) or `design.md`.
   APIs, imports, props and tokens must be verified in this repo before use. Unknowns are
   written as `UNKNOWN` with a question — never guessed.
3. **TDD.** A failing test first (proven red, tagged with the AC ID), then minimal code to
   green, then refactor. Tests are never weakened to pass.
4. **Gates are mandatory.** "Done" / "works" / "matches design" require command output or
   screenshot evidence from the current session.
5. **One task per session.** State lives in files (`tasks.md`, `progress.md`), not in the
   conversation. `/handoff` then `/clear`; the SessionStart hook restores state.

## The gates

| Gate | Meaning | Owner / How |
|---|---|---|
| G0 Spec | `requirements.md` has `Status: APPROVED` | Human (`/spec` drafts it) |
| G1 Design facts | `design.md` complete, tokens mapped, no blocking UNKNOWNs | figma-analyst + human glance |
| G2 Red | Failing tests exist for every AC in the task, failing for the right reason | test-writer, orchestrator re-runs |
| G3 Green | `npm run verify` passes | implementer + Stop hook |
| G4 Visual | No blocking diffs vs Figma at 375 / 768 / 1280 | visual-verifier |
| G5 Review | Reviewer verdict PASS (fresh context, read-only) | reviewer |
| G6 Accept | Human accepts and commits; spec → `DONE` after `verify:full` | Human |

---

## Skills (`.claude/skills/`) — what each one does

Skills are detailed playbooks loaded on demand so `CLAUDE.md` stays lean.

| Skill | What it does | When it's used |
|---|---|---|
| **spec-writing** | Turns a request + Figma links into a contract: EARS acceptance criteria with IDs, breakpoints and sources; explicit Assumptions / Open questions / Out of scope; rules for session-sized `tasks.md`. Never silently invents requirements. | `/spec`, `/plan` |
| **figma-extract** | Anti-hallucination Figma extraction: `get_metadata` first, then per-node `get_design_context`, `get_variable_defs`, screenshots. Every value cites `figma:<nodeId>`; unobserved values become `UNKNOWN`. Maps Figma variables to code tokens or records `NEW TOKEN PROPOSAL`. MCP-generated code is reference only — never pasted. | Any Figma reading (via figma-analyst) |
| **tdd** | Red–green–refactor with AC-tagged tests (`it('[LOGIN-AC-03] …')`). Red must fail on an assertion, not a config error. Role-based queries, behavior not implementation. Playwright asserts layout intent (stacking, visibility, overflow, touch targets), not pixels. | test-writer, any implementation task |
| **implement** | Production code rules: preconditions (APPROVED spec, red tests, no blocking UNKNOWNs), verify-before-use for every import/prop/token/path, reuse existing components, semantic HTML, mobile-first styling with tokens only, minimal diff, evidence before checking tasks off. | implementer (G3) |
| **self-review** | Evidence-based review checklist: run the gates yourself, AC→test traceability table, hallucination audit (imports, tokens, design values), responsive/a11y checks, test quality, code quality. Outputs a structured PASS/FAIL report. | Before declaring done; reviewer (G5) |
| **responsive-verify** | Gate G4 procedure: at 375×812 / 768×1024 / 1280×800, screenshot the app (Playwright MCP) and the Figma frame (Figma MCP), compare layout/spacing/typography/colors, **measure** with `getComputedStyle` / `getBoundingClientRect`, classify diffs as blocking / minor / design-gap. Never claims "pixel-perfect". | visual-verifier (G4) |
| **session-control** | Context budget rules: one task per session, delegate heavy reads to subagents (≤ ~40-line summaries), read narrowly, Figma metadata-first, `/handoff` before `/clear` or `/compact`, stuck detection after 3 failed fix attempts. Defines the handoff entry format. | Start/end of every task, long sessions |

## Subagents (`.claude/agents/`)

Heavy work runs in isolated contexts; only summaries return to the main thread.

| Subagent | Role | Gate |
|---|---|---|
| **figma-analyst** | Extracts verified design facts into `specs/<feature>/design.md`. Never writes production code. | G1 |
| **test-writer** | Writes failing AC-tagged tests (may create null stubs, never behavior). Proves red. | G2 |
| **implementer** | Makes the failing tests pass, mobile-first with tokens only. May not modify tests. | G3 |
| **visual-verifier** | Measures the UI vs Figma at 3 viewports; returns a discrepancy table. Read-only. | G4 |
| **reviewer** | Skeptical senior review with fresh context and read-only tools; runs `npm run verify` itself. | G5 |

## Slash commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/spec <feature> <figma-url…>` | Draft requirements + design facts; stops at G0 for human approval |
| `/plan <feature>` | Write `tasks.md` for an APPROVED spec (every AC covered by a task) |
| `/implement <feature> [task]` | Orchestrate ONE task through G1→G5 |
| `/verify [--full]` | Run the gates, report per-step evidence |
| `/review <feature> [task]` | Independent reviewer report (G5) |
| `/handoff <feature>` | Persist session state to `progress.md` so you can `/clear` safely |
| `/status` | Spec/task/gate status across features |

## Hooks (`.claude/hooks/`) — automatic guardrails

| Hook | Trigger | Effect |
|---|---|---|
| `session-start.mjs` | Startup, resume, `/clear`, compact | Injects git state + per-feature spec status, task progress, last handoff |
| `protect-files.mjs` | Before any edit | Blocks edits to `.env*`, lockfiles, `.claude` guardrails, CI workflows, and APPROVED/DONE specs |
| `post-edit.mjs` | After any edit | Prettier + ESLint auto-fix, and a **token guard**: raw color values outside `src/styles/tokens.css` are rejected |
| `stop-gate.mjs` | Agent tries to stop | Runs typecheck + related tests on changed `src` files; blocks stopping while they fail (max 3 attempts, then hands back to the human) |

---

## Flow: implementing a new task

### 1. Start a feature — `/spec login <figma-url>`
- **Slug suggestion:** use the Jira/issue ID as `<feature>` (e.g. `/spec ABC-123 <figma-url>`), with a
  hyphen-free uppercase `Spec-ID` (`ABC123`) for AC IDs and test names. Slug + Spec-ID are claim-once:
  `/spec` preflight stops if either is already taken.
- The **spec-writing** skill creates `specs/login/` from `specs/_templates/`.
- **figma-analyst** fills `design.md` (frames per breakpoint, tokens, states, UNKNOWNs).
- `requirements.md` is drafted with `Status: DRAFT`, EARS ACs, assumptions, open questions.
- **You** review, answer open questions, and set `Status: APPROVED` → **G0 passes**.
  (The protect-files hook freezes the spec from then on.)

### 2. Plan — `/plan login`
- Checks APPROVED status and that `design.md` has no blocking UNKNOWNs.
- Writes `tasks.md`: ordered, session-sized tasks (≤ ~5 files each), tokens/primitives first,
  then components, then page composition + responsive e2e. Every AC maps to a task.
- **You** confirm the task list.

### 3. Implement one task — `/implement login` (or `/implement login T02`)
The orchestrator keeps the main context small and delegates:

0. **Preflight:** spec APPROVED, task exists, no unrelated dirty files.
1. **G1:** missing/UNKNOWN design rows → figma-analyst fetches the listed nodes. Blocking UNKNOWN → stop and ask.
2. **G2 Red:** test-writer writes AC-tagged tests; the orchestrator re-runs them and confirms they fail **on assertions**.
3. **G3 Green:** implementer writes minimal code; orchestrator runs `npm run verify` (max 3 loops).
4. **G4 Visual:** visual-verifier compares vs Figma at 375/768/1280; blocking diffs → back to implementer (max 2 loops).
5. **G5 Review:** reviewer applies the self-review checklist with fresh context; FAIL → fixes → re-review (max 2 rounds).
6. **Close:** task checked off in `tasks.md` (only with evidence), handoff entry appended to `progress.md`, gate summary printed.

### 4. Accept and move on — human steps
- Review the diff, **commit** (the agent never commits or pushes).
- `/handoff login` → `/clear`. The SessionStart hook restores state next session.
- `/implement login` again for the next task. Repeat until all tasks are done.
- Run `npm run verify:full` (adds responsive e2e + strict AC traceability), then set
  `Status: DONE` → **G6**.

### When things go wrong
- **Spec gap?** Never edit an APPROVED spec — add a proposal to `progress.md` ›
  "Spec change requests" and ask the human.
- **Stuck 3× on the same error?** Stop, write a handoff with hypotheses, ask the human.
- **Long conversation?** `/handoff`, then `/clear` (preferred) or
  `/compact keep current task, gate status, failing tests`.

---

## Everyday commands

| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Lint / Types | `npm run lint` / `npm run typecheck` |
| Unit tests | `npm run test` · related: `npx vitest related --run <files>` |
| Responsive e2e | `npm run test:e2e` (Playwright: mobile/tablet/desktop projects) |
| Gates (fast) | `npm run verify` — lint, typecheck, unit, build + AC traceability |
| Gates (full, pre-merge) | `npm run verify:full` — adds e2e; missing AC tests fail the gate |

CI (`.github/workflows/ci.yml`) runs `npm run verify:full` on every PR and push to `main`.

## Where things live

```
CLAUDE.md                  Agent operating manual (rules 1–7, gates, session rules)
AGENTS.md                  Pointer for non-Claude agents
.mcp.json                  Figma (remote HTTP) + Playwright MCP servers
.claude/                   settings.json · hooks/ · skills/ · agents/ · commands/
docs/conventions.md        Code conventions (human-owned)
docs/design-system.md      Figma ↔ code token map
docs/decisions.md          Engineering decisions log
specs/<feature>/           requirements.md · design.md · tasks.md · progress.md
specs/_templates/          Starting point for every new feature
scripts/verify.mjs         Gate runner + AC traceability (local + CI)
src/styles/tokens.css      Design tokens — the ONLY file allowed raw color values
src/components/            Shared presentational components
src/features/<feature>/    Feature components + co-located tests
e2e/                       Playwright specs, one file per feature
```

## Project notes

- **TypeScript is pinned to exactly 6.0.3** because `typescript-eslint` does not support TS7
  yet. Do not upgrade without human approval — see [`docs/decisions.md`](docs/decisions.md).
- Styling: Tailwind v4 · Icons: lucide-react · Package manager: npm.
- Breakpoints (min-width only): base = mobile · `md` 768 · `lg` 1024 · `xl` 1280.
  Verification viewports: 375×812, 768×1024, 1280×800.
- Figma MCP: authenticate via `/mcp` in Claude Code; confirm tool names match
  `.claude/skills/figma-extract/SKILL.md` (Figma has renamed tools before).
- `eslint.config.js` and `vitest.config.ts` are minimal supporting configs added on top of
  the spec (the spec defines the gate scripts but ships no configs for them).