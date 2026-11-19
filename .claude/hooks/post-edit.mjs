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
