#!/usr/bin/env node
// Recursively scan src/app/api/** for App Router API files that export
// POST/PUT/PATCH/DELETE and check whether they are wrapped with a guard.
import { readdir } from 'fs/promises';
import { readFileSync, statSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src', 'app', 'api');
const GUARD_NAMES = [
  'withResponseCsrfGuard',
  'withCsrfGuard',
  'withResponseCookieSizeGuard',
  'withCookieSizeGuard',
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(res)));
    else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) files.push(res);
  }
  return files;
}

function findStateChangingExports(source) {
  const re = /\bexport\s+(?:const|let|var|async function|function)\s+(POST|PUT|PATCH|DELETE)\b/g;
  const methods = new Set();
  let m;
  while ((m = re.exec(source)) !== null) methods.add(m[1]);
  return Array.from(methods);
}

function containsGuard(source) {
  return GUARD_NAMES.some((g) => source.includes(g + '(') || source.includes(g + ' '));
}

async function main() {
  try {
    const st = statSync(ROOT);
    if (!st.isDirectory()) {
      console.log('No src/app/api directory found.');
      return process.exit(0);
    }
  } catch (e) {
    console.log('No src/app/api directory found.');
    return process.exit(0);
  }

  const files = await walk(ROOT);
  const report = [];

  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const exports = findStateChangingExports(src);
    if (exports.length === 0) continue;
    const wrapped = containsGuard(src);
    report.push({ file: path.relative(process.cwd(), f), exports, wrapped });
  }

  if (report.length === 0) {
    console.log('No App Router API state-changing exports found under src/app/api.');
    return process.exit(0);
  }

  let unwrapped = 0;
  console.log('CSRF coverage report:\n');
  for (const r of report) {
    const status = r.wrapped ? 'WRAPPED  ' : 'UNWRAPPED';
    console.log(`${status} ${r.file}  → exported: ${r.exports.join(', ')}`);
    if (!r.wrapped) unwrapped++;
  }

  console.log('\nSummary:');
  console.log(`  checked files: ${report.length}`);
  console.log(`  unwrapped files: ${unwrapped}`);

  if (unwrapped > 0) {
    console.error('\nAction required: wrap the UNWRAPPED routes with a CSRF guard (e.g. withResponseCsrfGuard).');
    process.exit(1);
  } else {
    console.log('\nAll detected state-changing App Router exports are wrapped.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Scanner error:', err);
  process.exit(2);
});
