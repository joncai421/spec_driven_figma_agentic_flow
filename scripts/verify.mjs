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
