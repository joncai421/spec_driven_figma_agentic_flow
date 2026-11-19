# Spec-Driven Agentic Setup for a Responsive UI Project (Figma MCP)

**Assumptions** (change them in `CLAUDE.md` → *Project facts*):

- **Agent:** Claude Code. It supports skills, subagents, hooks, slash commands and MCP natively. An `AGENTS.md` pointer is included for other tools.
- **Stack:** TypeScript + React + Vite, Vitest + Testing Library, Playwright, ESLint + Prettier, npm.
  - Every hook and gate calls **npm scripts**, so another stack only needs different script bodies.
- **Hooks** are written in Node (`.mjs`). They need no `jq` or bash tricks and work on macOS, Linux and Windows.

---

## 0. File tree

```
.
├── CLAUDE.md                          # Agent operating manual (always loaded, kept small)
├── AGENTS.md                          # Pointer for non-Claude agents
├── .mcp.json                          # Figma + Playwright MCP servers
├── playwright.config.ts               # Responsive viewports = verification gate
├── .claude/
│   ├── settings.json                  # Permissions + hooks
│   ├── hooks/
│   │   ├── session-start.mjs          # Injects spec/task/handoff state (startup, /clear, compact)
│   │   ├── protect-files.mjs          # Blocks edits to secrets, lockfiles, guardrails, approved specs
│   │   ├── post-edit.mjs              # Format + lint + design-token guard on every edit
│   │   └── stop-gate.mjs              # Typecheck + related tests before the agent may stop
│   ├── skills/
│   │   ├── spec-writing/SKILL.md
│   │   ├── figma-extract/SKILL.md
│   │   ├── tdd/SKILL.md
│   │   ├── implement/SKILL.md
│   │   ├── self-review/SKILL.md
│   │   ├── responsive-verify/SKILL.md
│   │   └── session-control/SKILL.md
│   ├── agents/
│   │   ├── figma-analyst.md
│   │   ├── test-writer.md
│   │   ├── implementer.md
│   │   ├── visual-verifier.md
│   │   └── reviewer.md
│   └── commands/
│       ├── spec.md                    # /spec <feature> <figma-url...>
│       ├── plan.md                    # /plan <feature>
│       ├── implement.md               # /implement <feature> [task]
│       ├── verify.md                  # /verify [--full]
│       ├── review.md                  # /review <feature> [task]
│       ├── handoff.md                 # /handoff <feature>
│       └── status.md                  # /status
├── docs/
│   ├── conventions.md
│   └── design-system.md
├── specs/
│   ├── README.md
│   └── _templates/
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       └── progress.md
├── scripts/
│   └── verify.mjs                     # Gate runner + AC traceability check (local + CI)
└── .github/workflows/ci.yml
```

---

## 1. `CLAUDE.md`

````markdown
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
````

## 2. `AGENTS.md`

```markdown
# AGENTS.md
This repo uses spec-driven, gated agentic development.
The canonical rules are in `CLAUDE.md`. Workflows are in `.claude/skills/*/SKILL.md` and `.claude/commands/*.md`.
Any agent (Cursor, Codex, Copilot, etc.) MUST follow `CLAUDE.md` rules 1–7 and the gate table.
```

---

## 3. `.mcp.json`

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

> **Alternative:** to use the Figma **desktop** Dev Mode MCP server instead of the remote one, enable it in Figma desktop (Preferences → Dev Mode MCP server). Then set `"url": "http://127.0.0.1:3845/mcp"`.
>
> - The remote server needs auth: run `/mcp` inside Claude Code and authenticate Figma.
> - Run `/mcp` to confirm the actual tool names (e.g. `get_metadata`, `get_design_context`, `get_variable_defs`, `get_screenshot`, `get_code_connect_map`). Figma has renamed tools before. If yours differ, update `skills/figma-extract`.

---

## 4. `.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "enabledMcpjsonServers": ["figma", "playwright"],
  "permissions": {
    "allow": [
      "Bash(npm run lint:*)",
      "Bash(npm run typecheck:*)",
      "Bash(npm run test:*)",
      "Bash(npm run build:*)",
      "Bash(npm run verify:*)",
      "Bash(npx vitest:*)",
      "Bash(npx playwright test:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "mcp__figma",
      "mcp__playwright"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(git push:*)",
      "Bash(git commit --no-verify:*)",
      "Bash(rm -rf:*)",
      "Bash(npm publish:*)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.mjs\"" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-files.mjs\"" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit.mjs\"", "timeout": 60 }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/stop-gate.mjs\"", "timeout": 300 }
        ]
      }
    ]
  }
}
```

---

## 5. Hooks

### `.claude/hooks/session-start.mjs`

Its stdout is injected into context on startup, resume, `/clear` and compact.

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const specsDir = join(root, 'specs');
const out = ['## Session state (auto-injected by SessionStart hook)'];

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  const dirty = execSync('git status --porcelain', { cwd: root }).toString().split('\n').filter(Boolean).length;
  out.push(`- Git: branch \`${branch}\`, ${dirty} uncommitted file(s)`);
} catch {
  out.push('- Git: unavailable');
}

if (existsSync(specsDir)) {
  const features = readdirSync(specsDir).filter(
    (d) => !d.startsWith('_') && statSync(join(specsDir, d)).isDirectory()
  );
  if (!features.length) out.push('- No feature specs yet. Start with `/spec <feature> <figma-url>`.');

  for (const f of features) {
    const read = (n) => (existsSync(join(specsDir, f, n)) ? readFileSync(join(specsDir, f, n), 'utf8') : null);
    const req = read('requirements.md');
    const tasks = read('tasks.md');
    const progress = read('progress.md');
    const status = req ? req.match(/^Status:\s*(\w+)/m)?.[1] ?? 'UNKNOWN' : 'NO-SPEC';

    let line = `- Spec \`${f}\`: **${status}**`;
    if (tasks) {
      const done = (tasks.match(/^- \[x\] T\d+/gim) || []).length;
      const total = (tasks.match(/^- \[[ x]\] T\d+/gim) || []).length;
      const next = tasks.match(/^- \[ \] (T\d+[^\n]*)/m)?.[1];
      line += ` · tasks ${done}/${total}${next ? ` · next: ${next}` : ''}`;
    }
    out.push(line);

    if (progress && status !== 'DONE') {
      const entries = progress.split(/^### /m);
      if (entries.length > 1) {
        const last = entries.pop().split('\n').slice(0, 20).join('\n');
        out.push(`  Last handoff (${f}):\n  ### ${last.replace(/\n/g, '\n  ')}`);
      }
    }
  }
}

out.push('Rules: one task per session · evidence before claims · /handoff then /clear when the task is done.');
console.log(out.join('\n'));
```

### `.claude/hooks/protect-files.mjs`

```js
#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let raw = '';
for await (const c of process.stdin) raw += c;
const input = JSON.parse(raw || '{}');
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const abs = resolve(root, filePath);
const rel = relative(root, abs).replaceAll('\\', '/');

const rules = [
  [/^\.env(\.(?!example$).*)?$/, 'Secrets files are off-limits.'],
  [/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/, 'Lockfiles change only via the package manager (and only when a task requires a new dependency, approved by a human).'],
  [/^\.claude\/(settings\.json|hooks\/)/, 'Agents may not modify their own guardrails. Ask the human.'],
  [/^\.github\/workflows\//, 'CI gates are human-owned. Ask the human.'],
];

for (const [re, why] of rules) {
  if (re.test(rel)) {
    console.error(`BLOCKED edit to ${rel}: ${why}`);
    process.exit(2);
  }
}

if (/^specs\/[^/]+\/requirements\.md$/.test(rel) && existsSync(abs)) {
  if (/^Status:\s*(APPROVED|DONE)/m.test(readFileSync(abs, 'utf8'))) {
    console.error(
      `BLOCKED: ${rel} is APPROVED and frozen. Add the proposed change to progress.md › "Spec change requests" and ask the human.`
    );
    process.exit(2);
  }
}
process.exit(0);
```

### `.claude/hooks/post-edit.mjs`

```js
#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let raw = '';
for await (const c of process.stdin) raw += c;
const input = JSON.parse(raw || '{}');
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const abs = resolve(root, filePath);
const rel = relative(root, abs).replaceAll('\\', '/');
if (!existsSync(abs) || /^(node_modules|dist|build|coverage|playwright-report|test-results)\//.test(rel)) process.exit(0);

const bin = (name) => {
  const p = join(root, 'node_modules', '.bin', name);
  return existsSync(p) || existsSync(p + '.cmd') ? p : null;
};
const run = (cmd) => spawnSync(cmd, { shell: true, cwd: root, encoding: 'utf8' });
const problems = [];

// 1) Format
const prettier = bin('prettier');
if (prettier && /\.(tsx?|jsx?|css|scss|json|md)$/.test(rel)) run(`"${prettier}" --write "${abs}"`);

// 2) Lint (auto-fix, report what remains)
const eslint = bin('eslint');
if (eslint && /\.(tsx?|jsx?)$/.test(rel)) {
  const r = run(`"${eslint}" --fix "${abs}"`);
  if (r.status !== 0) problems.push(`ESLint errors in ${rel}:\n${(r.stdout + r.stderr).slice(0, 3000)}`);
}

// 3) Design-token guard (anti-hallucinated values)
const TOKEN_FILES = ['src/styles/tokens.css'];
const isSource = /^src\/.*\.(tsx?|jsx?|css|scss)$/.test(rel);
const isExempt = TOKEN_FILES.includes(rel) || /\.(test|spec|stories)\.[jt]sx?$/.test(rel);
if (isSource && !isExempt) {
  const hits = [];
  readFileSync(abs, 'utf8').split('\n').forEach((line, i) => {
    if (/token-guard-ignore/.test(line)) return;
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(line)) hits.push(`  L${i + 1}: ${line.trim()}`);
  });
  if (hits.length) {
    problems.push(
      `Token guard: raw color values in ${rel}. Use tokens from src/styles/tokens.css (grep to confirm the token exists). ` +
        `If Figma has a variable with no token, add it to tokens.css citing the Figma variable name (see docs/design-system.md).\n` +
        hits.slice(0, 10).join('\n')
    );
  }
}

if (problems.length) {
  console.error(problems.join('\n\n'));
  process.exit(2); // fed back to the agent to fix
}
process.exit(0);
```

### `.claude/hooks/stop-gate.mjs`

The agent cannot finish while typecheck or related tests fail. It retries at most 3 times, then hands back to the human.

```js
#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync, execSync } from 'node:child_process';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
let raw = '';
for await (const c of process.stdin) raw += c;
const input = JSON.parse(raw || '{}');
const MAX_BLOCKS = 3;

const stateDir = join(root, '.claude', '.state');
const stateFile = join(stateDir, `stop-${input.session_id || 'default'}.json`);
const getCount = () => (existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')).count : 0);
const setCount = (n) => {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ count: n }));
};
const reset = () => existsSync(stateFile) && rmSync(stateFile);

let changed = [];
try {
  const sh = (c) => execSync(c, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean);
  changed = [...sh('git diff --name-only HEAD'), ...sh('git ls-files --others --exclude-standard')];
} catch {
  process.exit(0); // no git → skip
}
const code = [...new Set(changed)].filter((f) => /^src\/.*\.(tsx?|jsx?)$/.test(f) && existsSync(join(root, f)));
if (!code.length) {
  reset();
  process.exit(0);
}

const run = (cmd) => spawnSync(cmd, { shell: true, cwd: root, encoding: 'utf8' });
const failures = [];

const tc = run('npm run -s typecheck');
if (tc.status !== 0) failures.push(`TYPECHECK FAILED:\n${(tc.stdout + tc.stderr).slice(-2500)}`);

const vitest = join(root, 'node_modules', '.bin', 'vitest');
if (existsSync(vitest) || existsSync(vitest + '.cmd')) {
  const t = run(`"${vitest}" related --run --passWithNoTests ${code.map((f) => `"${f}"`).join(' ')}`);
  if (t.status !== 0) failures.push(`RELATED TESTS FAILED:\n${(t.stdout + t.stderr).slice(-3000)}`);
}

if (!failures.length) {
  reset();
  process.exit(0);
}

const count = getCount() + 1;
if (count > MAX_BLOCKS) {
  reset();
  console.error(`Stop gate still failing after ${MAX_BLOCKS} attempts. Handing back to the human. Do NOT claim the task is done.`);
  process.exit(1); // non-blocking; shown to the user
}
setCount(count);
console.error(
  `Stop gate (attempt ${count}/${MAX_BLOCKS}): you may not finish while gates fail. Fix the root cause. Do not weaken tests.\n\n${failures.join('\n\n')}`
);
process.exit(2);
```

---

## 6. Skills

### `.claude/skills/spec-writing/SKILL.md`

```markdown
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
1. Copy `specs/_templates/*` to `specs/<feature>/`. Choose a short uppercase `Spec-ID` (e.g. `LOGIN`).
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
```

### `.claude/skills/figma-extract/SKILL.md`

```markdown
---
name: figma-extract
description: Use whenever Figma designs are involved. Extracts verified design facts (frames per breakpoint, tokens, components, states, spacing, typography) via Figma MCP into specs/<feature>/design.md with node-ID citations. Prevents hallucinated design values and controls context size.
---

# Figma Extraction (anti-hallucination)

## Hard rules
1. **Preflight:** confirm the Figma MCP tools are available. If they are not, or auth fails, **STOP** and tell
   the human. Never reconstruct designs from memory, file names, or guesses.
2. Every value written to design.md has a source: `figma:<nodeId>` or `figma-var:<variableName>`.
3. Values you didn't observe are written as `UNKNOWN` in "Unknowns / gaps", with a concrete question.
4. MCP-generated code (often React + Tailwind with absolute values) is a **reference only**. Never paste it.
5. Context budget: never request `get_design_context` for a whole page. Large output → summarize and discard.

## URL parsing
`https://www.figma.com/design/<FILE_KEY>/<name>?node-id=12-345` → fileKey `<FILE_KEY>`, nodeId `12:345`.

## Procedure
1. `get_metadata` on the top-level frame(s). This is a cheap structural map: names, node IDs, sizes.
2. Identify the frame for each breakpoint (mobile ≈ 375, tablet ≈ 768, desktop ≈ 1280/1440).
   - If a breakpoint frame is missing, record its behavior as `UNKNOWN`. Do NOT extrapolate desktop from mobile.
3. `get_variable_defs` on the relevant frames → the design tokens actually used.
4. Map each Figma variable to a code token. Grep `src/styles/tokens.css` and use `docs/design-system.md`.
   - Match found → record the mapping.
   - No match → record it as `NEW TOKEN PROPOSAL` (name + value + figma var). Do not hard-code.
5. `get_code_connect_map`, if available → existing code components linked to Figma components.
   Also grep `src/components/` for reuse candidates by name and role.
6. `get_design_context` **per component node** (small subtrees). Extract layout intent (stack, grid,
   alignment, gap), sizes, typography token, color token, radius, shadow, and states/variants.
7. `get_screenshot` per breakpoint frame, to see the visual truth. Note the node IDs so the visual-verifier
   can re-fetch them later.
8. Convert absolute layouts to intent: "vertical stack, gap = space-4, full-width button pinned to
   bottom on mobile; two-column grid at lg". Use Auto Layout data where present.
9. Fill design.md sections 1–9. Summarize. Return to the caller: the file path, the number of UNKNOWNs,
   and the token proposals.

## Output checklist
- [ ] Frames table with node IDs for every breakpoint (or UNKNOWN)
- [ ] Component inventory with reuse vs. new decision and file path
- [ ] Token table: every color, spacing, radius, typography and shadow value used is mapped or proposed
- [ ] Responsive behavior table per element per breakpoint
- [ ] States: default, hover, focus-visible, active, disabled, loading, empty, error (or "not designed" → UNKNOWN)
- [ ] Assets listed (icons, images) with node IDs and export format
```

### `.claude/skills/tdd/SKILL.md`

```markdown
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
```

### `.claude/skills/implement/SKILL.md`

```markdown
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
```

### `.claude/skills/self-review/SKILL.md`

```markdown
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
```

### `.claude/skills/responsive-verify/SKILL.md`

```markdown
---
name: responsive-verify
description: Use to verify implemented UI against Figma at mobile, tablet and desktop viewports using Playwright MCP and Figma MCP screenshots plus computed-style measurement. Produces a discrepancy report (gate G4).
---

# Responsive Visual Verification

## Setup
- Ensure the dev server is running (`npm run dev`). Note the URL from its output; do not assume the port.
- You need the Figma node IDs per breakpoint from design.md § Frames.

## Per viewport (375×812, 768×1024, 1280×800)
1. Playwright MCP: resize the browser → navigate to the route/story → wait for the network to be idle → take a screenshot.
2. Figma MCP: `get_screenshot` for the matching frame node, if it exists. If it doesn't, verify against
   the design.md responsive behavior table only.
3. Compare, checklist style:
   - layout structure and order; alignment; stacking/columns
   - spacing (gaps, padding); sizes of key elements
   - typography (size, weight, line height); colors (tokens)
   - visibility of elements per breakpoint
   - overflow: `document.documentElement.scrollWidth <= innerWidth`
4. Measure, don't eyeball, for key elements. Use Playwright evaluate to read `getComputedStyle` and
   `getBoundingClientRect`, and compare with design.md values.
5. Check interaction states that the design specifies (focus-visible, hover on desktop, disabled, error).

## Report (returned to the orchestrator)
| Viewport | Element | Expected (source) | Actual (measured) | Severity |
Severity: **blocking** (wrong layout/color/missing element/overflow) · **minor** (≤ 2px drift, subpixel
font rendering) · **design-gap** (Figma lacks info → UNKNOWN question).

Never claim "pixel-perfect". State what was measured. Verdict: PASS (no blocking) / FAIL.
```

### `.claude/skills/session-control/SKILL.md`

```markdown
---
name: session-control
description: Use to manage context size and continuity — when starting/ending a task, when the conversation grows long, before /compact or /clear, or when resuming work. Defines handoff format and context budget rules.
---

# Session Control

## Principles
- Context is a budget. Large irrelevant context degrades accuracy and increases hallucination.
- State lives in **files** (specs, tasks.md, progress.md), not in the conversation.
- The SessionStart hook re-injects state after `/clear` and after compaction.

## Rules
1. **One task per session.** Start: read the task block, its ACs and the relevant design.md rows only.
   End: `/handoff` → `/clear`.
2. **Delegate heavy reads** to subagents (figma-analyst, reviewer, visual-verifier). They return summaries
   of ≤ ~40 lines. Their raw output stays out of the main thread.
3. **Read narrowly:** grep first, then read specific line ranges. Avoid re-reading files you already summarized.
4. **Figma:** `get_metadata` first. `get_design_context` only on small nodes. Persist the facts to design.md once.
5. **Long sessions:** if the conversation is long, a task spans many fix loops, or you notice you are
   re-reading things, run `/handoff`, then either `/clear` (preferred) or
   `/compact keep: current task, gate status, failing test names, next step`.
6. **Stuck detection:** after 3 failed fix attempts on the same error, stop. Write a handoff with a
   hypothesis list and ask the human. Do not thrash.

## Handoff entry format (appended to specs/<feature>/progress.md)
### <YYYY-MM-DD HH:MM> — <Task ID> — <in-progress|done|blocked>
- Did: <bullets>
- Evidence: <commands + results, e.g. "npm run verify → all pass">
- Gates: G1 ✅ G2 ✅ G3 ✅ G4 ⏳ G5 ⏳
- Next step (exact, actionable): <…>
- Open questions / blockers: <…>
- Files touched: <paths>
```

---

## 7. Subagents (`.claude/agents/`)

### `figma-analyst.md`

```markdown
---
name: figma-analyst
description: Extracts verified design facts from Figma via MCP into specs/<feature>/design.md. Use for any Figma reading so raw MCP output stays out of the main context. Never writes production code.
model: inherit
---

You are a meticulous design analyst. Follow `.claude/skills/figma-extract/SKILL.md` exactly.

- Only write to `specs/<feature>/design.md` (and propose tokens there; do not edit tokens.css).
- Cite a node ID or Figma variable for every value. Unobserved values → `UNKNOWN` with a question.
- If the Figma MCP is unavailable or unauthenticated, stop immediately and report it.
- Return a ≤ 40-line summary: frames found per breakpoint, components (reuse/new), token mappings and
  proposals, number of UNKNOWNs with the questions.
```

### `test-writer.md`

```markdown
---
name: test-writer
description: Writes failing, AC-tagged tests (Vitest/Testing Library and Playwright) for one task, proving red. Use at gate G2 before any implementation.
model: inherit
---

You write tests only. Follow `.claude/skills/tdd/SKILL.md`.

Input: task block, ACs, relevant design.md rows.
- Write tests for every AC in the task, tagged `[<SPEC>-AC-NN]`.
- You may create minimal stubs (component returning null, typed props) so failures are assertion
  failures. You may not implement behavior.
- Verify every import/API you use exists (testing library versions in package.json).
- Run the tests and confirm they fail for the right reason.

Return: test file paths, an AC→test mapping table, and the summarized failing output (test names + assertion messages).
```

### `implementer.md`

```markdown
---
name: implementer
description: Implements production code for one task to make failing tests pass, mobile-first with tokens only. Use at gate G3 after test-writer proved red.
model: inherit
---

Follow `.claude/skills/implement/SKILL.md`.

- Scope: only the files needed for the given task. Do not modify tests. If you believe a test is wrong,
  stop and explain why, citing the AC.
- Verify every import, prop, token and path before using it.
- Finish by running `npx vitest related --run <changed files>` and `npm run verify`.

Return: files changed, a one-line description per file, the verify summary, and any deviations or UNKNOWNs encountered.
```

### `visual-verifier.md`

```markdown
---
name: visual-verifier
description: Verifies implemented UI against Figma at 375/768/1280 using Playwright MCP + Figma screenshots and computed-style measurement. Use at gate G4. Read-only for source code.
model: inherit
---

Follow `.claude/skills/responsive-verify/SKILL.md`. Do not edit source files.

Return the discrepancy table and a verdict (PASS = no blocking items). Keep it ≤ 50 lines.
```

### `reviewer.md`

```markdown
---
name: reviewer
description: Independent code reviewer with fresh context. Reviews the current diff against the task's ACs using the self-review checklist. Use at gate G5 and whenever a second opinion is needed. Read-only.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a skeptical senior reviewer. You did not write this code. Assume nothing that you have not verified.

1. Read the task block and ACs in `specs/<feature>/tasks.md` and `requirements.md`.
2. Inspect the diff: `git diff HEAD` and `git status`.
3. Apply `.claude/skills/self-review/SKILL.md` fully. Run `npm run verify` yourself.
4. Do not modify files. Bash is only for read-only commands and the test/verify scripts.

Output exactly the report format from the self-review skill. Every blocking item must name file:line and a concrete fix.
```

---

## 8. Slash commands (`.claude/commands/`)

### `spec.md`

```markdown
---
description: Draft a new feature spec from a request + Figma links (stops at G0 for human approval)
argument-hint: <feature-slug> <figma-url> [more urls / notes]
---
Arguments: $ARGUMENTS  (first token = feature slug, rest = Figma URLs and notes)

1. Use the spec-writing skill. Create `specs/<feature>/` from `specs/_templates/`.
2. Delegate to the **figma-analyst** subagent with the Figma URLs to fill `design.md`.
3. Draft `requirements.md` (Status: DRAFT) from the request, notes and design facts. Cite sources.
4. Do NOT create tasks yet. Do NOT write code.
5. Reply with: a summary, the AC list, Assumptions, Open questions, design UNKNOWNs, and token proposals. Then:
   "Review specs/<feature>/requirements.md and design.md. Set `Status: APPROVED` to pass G0, then run `/plan <feature>`."
```

### `plan.md`

```markdown
---
description: Create tasks.md for an APPROVED spec
argument-hint: <feature-slug>
---
Feature: $ARGUMENTS

1. Verify `specs/$ARGUMENTS/requirements.md` has `Status: APPROVED`. If not, stop.
2. If design.md still has blocking UNKNOWNs, list them and stop.
3. Using the spec-writing skill's tasks.md rules, write `specs/$ARGUMENTS/tasks.md`.
   Every AC must be covered by at least one task. Include an AC coverage table at the end.
4. Reply with the task list and ask the human to confirm before running `/implement $ARGUMENTS`.
```

### `implement.md`

```markdown
---
description: Orchestrate ONE task through the gated TDD loop (G1→G5)
argument-hint: <feature-slug> [task-id]
---
Arguments: $ARGUMENTS (feature slug, optional task id; default = first unchecked task)

You are the **orchestrator**. Delegate the work; verify the results; keep the main context small.

0. **Preflight** (stop on failure): spec APPROVED; task exists; `git status` noted; no unrelated dirty files
   (if there are, ask the human).
1. Load only: the task block, its ACs, and the relevant design.md rows.
2. **G1:** if the task touches UI and the design rows are missing or contain UNKNOWNs → delegate **figma-analyst** for the
   listed node IDs. Blocking UNKNOWN → stop and ask.
3. **G2 Red:** delegate **test-writer**. Then run the reported tests yourself and confirm they fail on assertions.
4. **G3 Green:** delegate **implementer**. Then run `npm run verify` yourself.
   Max 3 implementer loops; then stop with a handoff.
5. **G4 Visual** (UI tasks): delegate **visual-verifier**. Blocking items → back to implementer (max 2 loops).
6. **G5 Review:** delegate **reviewer**. FAIL → implementer fixes the blocking items → re-review (max 2 rounds).
7. **Close:** check the task in tasks.md, append the progress.md entry (session-control format), and print the gate
   summary with evidence. Recommend: "Review the diff, commit, then `/clear`." Do not commit or push yourself.
```

### `verify.md`

```markdown
---
description: Run quality gates and report evidence
argument-hint: [--full]
---
Run `npm run verify $ARGUMENTS`. Report the per-step pass/fail table and the AC traceability output.
On failures, show the first relevant error per step and propose the fix. Do not apply it unless asked.
```

### `review.md`

```markdown
---
description: Independent review of current changes (gate G5)
argument-hint: <feature-slug> [task-id]
---
Delegate to the **reviewer** subagent with: feature `$ARGUMENTS`, the task block, and its ACs.
Relay its report verbatim. Do not fix anything unless the user asks.
```

### `handoff.md`

```markdown
---
description: Persist session state to progress.md so the context can be cleared safely
argument-hint: <feature-slug>
---
Append a handoff entry to `specs/$ARGUMENTS/progress.md` using the session-control skill format.
Base it only on evidence from this session (commands actually run, files actually changed via `git status`).
Then tell the user: "State saved. Safe to `/clear`."
```

### `status.md`

```markdown
---
description: Show spec/task/gate status across features
---
For each folder in `specs/` (excluding `_templates`): print the Status, tasks done/total, next task, and the last
handoff "Next step". Then run `git status --short`. Keep it under 30 lines.
```

---

## 9. Spec templates (`specs/`)

### `specs/README.md`

```markdown
# Specs
One folder per feature: `specs/<feature-slug>/`

| File | Purpose | Who edits |
|---|---|---|
| requirements.md | What & why. EARS ACs with IDs. Status lifecycle. | Agent drafts; **human approves** (then frozen by hook) |
| design.md | Verified Figma facts, tokens, responsive behavior, file plan | figma-analyst; human reviews |
| tasks.md | Ordered, session-sized tasks mapped to ACs | Agent (/plan), human confirms |
| progress.md | Handoff log + spec change requests | Agent (/handoff) |

Status lifecycle: `DRAFT` → `APPROVED` (human) → `DONE` (human, after `npm run verify:full` passes).
Changing an APPROVED spec: the human sets it back to `DRAFT`, edits, re-approves, and adds a Change log line.
```

### `specs/_templates/requirements.md`

```markdown
# <Feature name> — Requirements
Spec-ID: <FEAT>
Status: DRAFT
Figma: <url(s)>
Owner: <name>
<!-- Spec-ID: short UPPERCASE, used in AC IDs and test names -->
<!-- Status lifecycle: DRAFT → APPROVED (human only) → DONE -->

## 1. Goal
<One paragraph: user problem and outcome.>

## 2. Users & context
<Who, on which devices, in which situation.>

## 3. Acceptance criteria (EARS)
| ID | Criterion | Breakpoints | Verify by | Source |
|---|---|---|---|---|
| FEAT-AC-01 | WHEN the user submits the form with an empty email, THE SYSTEM SHALL show "Email is required" below the email field and move focus to it. | all | unit | figma:12:345 |
| FEAT-AC-02 | WHERE viewport ≥ 1024px, THE SYSTEM SHALL display the form and illustration side by side. | lg+ | e2e | figma:12:400 |

## 4. Non-functional
- Accessibility: WCAG 2.2 AA; full keyboard operation; visible focus
- Mobile: touch targets ≥ 44×44px; no horizontal scroll from 320px width
- Performance: <e.g. no layout shift on load for this view>

## 5. Out of scope
- <…>

## 6. Assumptions (must be confirmed by a human)
- <…>

## 7. Open questions
- <…>

## Change log
- <date> — created (DRAFT)
```

### `specs/_templates/design.md`

```markdown
# <Feature name> — Design Facts
Spec-ID: <FEAT>
Figma file key: <KEY>
Extracted: <YYYY-MM-DD> via Figma MCP (tools: get_metadata, get_variable_defs, get_design_context, get_screenshot)
Rule: every value cites `figma:<nodeId>` or `figma-var:<name>`. Unobserved → section 8.

## 1. Frames per breakpoint
| Breakpoint | Frame name | Node ID | Figma width |
|---|---|---|---|
| mobile (base) | | | 375 |
| md ≥768 | | | |
| lg ≥1024 | | | |

## 2. Component inventory
| Component | Figma node | Reuse (path) / New (planned path) | Variants & states |
|---|---|---|---|

## 3. Tokens
| Figma variable | Value | Code token | Status |
|---|---|---|---|
| color/primary/500 | #1A73E8 | `--color-primary-500` | exists / NEW PROPOSAL |

## 4. Responsive behavior
| Element | Mobile (base) | md | lg | Source |
|---|---|---|---|---|
| Header nav | hamburger, drawer | same | inline links | figma:1:2 / figma:1:9 |

## 5. States & interactions
| Element | default | hover | focus-visible | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|

## 6. Assets
| Asset | Node ID | Format | Destination path |
|---|---|---|---|

## 7. Accessibility notes
<Landmarks, heading levels, labels, focus order, motion.>

## 8. Unknowns / gaps (DO NOT guess)
| # | Question | Blocking? | Answer (human) |
|---|---|---|---|

## 9. File plan
<Files to create/modify, grouped by task-to-be.>
```

### `specs/_templates/tasks.md`

```markdown
# <Feature name> — Tasks
Spec-ID: <FEAT>
Rules: one task = one session · tests first · each task closes only with gate evidence.

- [ ] T01 — <Add missing tokens from design.md §3>
  - ACs: —
  - Tests (first): <n/a or token presence test>
  - Files: src/styles/tokens.css, docs/design-system.md
  - Figma: —
  - Done when: verify passes · reviewer PASS

- [ ] T02 — <Component X: mobile base layout + states>
  - ACs: FEAT-AC-01, FEAT-AC-03
  - Tests (first): src/features/<f>/X.test.tsx
  - Files: src/features/<f>/X.tsx
  - Figma: 12:345
  - Done when: red logged · green · verify · G4 visual PASS · reviewer PASS

- [ ] T03 — <Page composition + responsive e2e (md/lg)>
  - ACs: FEAT-AC-02
  - Tests (first): e2e/<f>.spec.ts
  - Files: …
  - Figma: 12:400
  - Done when: …

## AC coverage
| AC | Task(s) |
|---|---|
```

### `specs/_templates/progress.md`

```markdown
# <Feature name> — Progress & Handoff

## Spec change requests
<!-- Agents propose changes here; humans decide. Format: date · AC · proposal · reason -->

## Log
<!-- Appended by /handoff. Newest at bottom. Each entry starts with "### " -->
```

---

## 10. Docs

### `docs/conventions.md`

```markdown
# Code Conventions (human-owned; agents follow)

## Structure
- `src/components/` shared, presentational, reusable (no feature logic)
- `src/features/<feature>/` feature components, hooks, tests co-located (`X.tsx`, `X.test.tsx`)
- `e2e/` Playwright specs, one file per feature: `<feature>.spec.ts`
- `src/styles/tokens.css` design tokens (CSS custom properties)

## Components
- Function components, typed props interface `XProps`, named exports
- Props for variants (`variant`, `size`) mapped from Figma component properties
- No inline styles except dynamic values. No raw colors (token guard enforces this)

## Responsive (mobile-first)
- Base = mobile. Enhance with min-width breakpoints: md 768 · lg 1024 · xl 1280
- Layout via flex/grid + gap tokens. No absolute positioning for layout
- Images: responsive (`max-width:100%`, `srcset` where provided)
- Touch targets ≥ 44px. Hover is never the only affordance

## Accessibility
- Semantic elements first. Every interactive element has an accessible name
- `:focus-visible` styles from tokens. Respect `prefers-reduced-motion`

## Tests
- AC-tagged names `[FEAT-AC-NN]`. Role-based queries. No DOM snapshots
```

### `docs/design-system.md`

```markdown
# Design System Mapping (Figma ↔ Code)

Source of truth for values: Figma variables. Source of truth for names in code: `src/styles/tokens.css`.
Agents add rows only for tokens they add in an approved task (citing the Figma variable).

## Naming rule
Figma `color/primary/500` → CSS `--color-primary-500` · `spacing/4` → `--space-4` · `radius/md` → `--radius-md`

## Breakpoints
| Name | min-width | Figma frame width |
|---|---|---|
| base | 0 | 375 |
| md | 768px | 768 |
| lg | 1024px | 1440 (scaled) |
| xl | 1280px | — |

## Token table
| Figma variable | CSS token | Value | Added in (spec/task) |
|---|---|---|---|
```

---

## 11. `scripts/verify.mjs` (gate runner + AC traceability)

```js
#!/usr/bin/env node
// Usage: node scripts/verify.mjs [--full]
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = process.cwd();
const full = process.argv.includes('--full');
const results = [];

const steps = [
  ['lint', 'npm run -s lint'],
  ['typecheck', 'npm run -s typecheck'],
  ['unit', 'npm run -s test'],
  ['build', 'npm run -s build'],
  ...(full ? [['e2e (responsive)', 'npm run -s test:e2e']] : []),
];

for (const [name, cmd] of steps) {
  console.log(`\n▶ ${name}: ${cmd}`);
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: root });
  results.push([name, r.status === 0]);
}

// ---- AC traceability: every AC of APPROVED/DONE specs should appear in a test name ----
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    if (['node_modules', 'dist', 'build', 'coverage'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(test|spec)\.[jt]sx?$/.test(e) && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(e))) acc.push(p);
  }
  return acc;
}

const testText = [...walk(join(root, 'src')), ...walk(join(root, 'e2e'))].map((f) => readFileSync(f, 'utf8')).join('\n');
let traceFail = false;
const specsDir = join(root, 'specs');

if (existsSync(specsDir)) {
  for (const f of readdirSync(specsDir)) {
    const reqPath = join(specsDir, f, 'requirements.md');
    if (f.startsWith('_') || !existsSync(reqPath)) continue;
    const req = readFileSync(reqPath, 'utf8');
    const status = req.match(/^Status:\s*(\w+)/m)?.[1];
    if (!['APPROVED', 'DONE'].includes(status)) continue;

    const acs = [...new Set(req.match(/\b[A-Z][A-Z0-9]+-AC-\d+\b/g) || [])];
    const missing = acs.filter((ac) => !testText.includes(`[${ac}]`));
    const label = `trace ${f} (${status})`;
    if (!missing.length) {
      results.push([label, true]);
    } else if (status === 'DONE' || full) {
      results.push([label, false]);
      traceFail = true;
      console.log(`\n✖ ${label}: missing tests for ${missing.join(', ')}`);
    } else {
      console.log(`\n⚠ ${label}: not yet covered: ${missing.join(', ')}`);
    }
  }
}

console.log('\n==== Gate summary ====');
for (const [n, ok] of results) console.log(`${ok ? '✅' : '❌'} ${n}`);
const failed = results.some(([, ok]) => !ok) || traceFail;
console.log(failed ? '\nGATES FAILED' : '\nALL GATES PASSED');
process.exit(failed ? 1 : 0);
```

---

## 12. `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 5173);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
});
```

---

## 13. `package.json` scripts (merge into yours)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "verify": "node scripts/verify.mjs",
    "verify:full": "node scripts/verify.mjs --full"
  }
}
```

Dev dependencies, if not already present:

```bash
npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom \
  @playwright/test eslint prettier typescript
npx playwright install chromium
```

---

## 14. `.github/workflows/ci.yml`

This is the same gate the agent uses, enforced on every PR.

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run verify:full
```

## 15. `.gitignore` additions

```
.claude/settings.local.json
.claude/.state/
test-results/
playwright-report/
coverage/
```

---

## 16. Setup and smoke test (about 10 minutes)

1. Copy all the files above. Fill in **Project facts** in `CLAUDE.md` and the breakpoints in `docs/design-system.md`.
2. Create `src/styles/tokens.css`, even with a few starter variables.
3. Connect Figma:
   - Start `claude`, run `/mcp` and authenticate Figma.
   - Confirm the tool names match the ones in `figma-extract`.
4. Smoke-test the hooks:
   - **Protection:** ask *"Edit .claude/settings.json"*. It should be BLOCKED.
   - **Token guard:** ask *"Create src/Test.tsx with `color: #ff0000`"*. The token guard should fire and the agent should fix it.
   - **Session state:** run `/clear`. The SessionStart state block should appear.
5. Run `npm run verify` once manually to confirm the scripts work.
6. Run your first feature:
   1. `/spec login https://www.figma.com/design/KEY/App?node-id=12-345`
   2. Review the draft and set `Status: APPROVED` yourself.
   3. `/plan login`
   4. `/implement login`
   5. Review the diff and commit.
   6. `/clear`
   7. Run `/implement login` again for the next task.
   8. When all tasks are done, run `npm run verify:full` and set `Status: DONE`.

---

## How each requirement is covered

| Requirement | Mechanisms |
|---|---|
| **1. Avoid hallucination** | **Rules:** CLAUDE.md rule 2 + rule 7 (Figma code is reference only).<br>**Design values:** `figma-extract` cites node IDs and writes `UNKNOWN` instead of guessing; the token-guard hook rejects raw colors.<br>**Code:** the implement skill's verify-before-use step.<br>**Review:** the reviewer's hallucination audit; frozen approved specs. |
| **2. Gates for verification** | G0–G6 table, `scripts/verify.mjs` (lint, types, unit, build, e2e, AC traceability), Stop hook, G4 visual report, CI |
| **3. TDD** | `tdd` skill (proven red, AC-tagged tests, layout-intent Playwright tests), test-writer separated from implementer, traceability gate |
| **4. Orchestration + hooks** | `/implement` orchestrator → figma-analyst → test-writer → implementer → visual-verifier → reviewer, with bounded retry loops; 4 hooks (SessionStart, PreToolUse, PostToolUse, Stop) |
| **5. Self-review skill** | `self-review` skill plus the `reviewer` subagent, which reviews with a fresh context and read-only tools and returns a structured PASS/FAIL report |
| **6. Implementation skill** | `implement` skill: mobile-first, tokens, reuse, minimal diff, evidence before checking tasks off |
| **7. Session control** | One task per session, file-based state, `/handoff` then `/clear`, SessionStart re-injection, subagents absorb heavy Figma output, metadata-first Figma reads, stuck detection after 3 failed attempts |

**Tip:** once the first few features land, have the agent run Figma's `create_design_system_rules` tool, if your MCP version has it. Review the output and fold the useful parts into `docs/design-system.md`. Keep `CLAUDE.md` lean.