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
