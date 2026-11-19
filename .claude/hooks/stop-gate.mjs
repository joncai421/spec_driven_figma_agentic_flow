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
