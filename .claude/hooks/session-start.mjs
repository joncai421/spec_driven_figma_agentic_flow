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
