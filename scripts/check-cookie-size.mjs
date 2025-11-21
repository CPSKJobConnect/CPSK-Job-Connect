#!/usr/bin/env node
// scripts/check-cookie-size.mjs
// Scans `src/**` for usages of `setCookieSafe(...)` and `res.setHeader('Set-Cookie', ...)`.
// For literal/parsable cookie name+value pairs this script computes the UTF-8
// byte length of `name + value` and reports violations when > 4096 bytes.

import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const SRC = path.join(ROOT, 'src');
const MAX_BYTES = 4096;
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git') continue;
      files.push(...await walk(full));
    } else if (ent.isFile()) {
      if (exts.has(path.extname(ent.name))) files.push(full);
    }
  }
  return files;
}

function byteLengthUTF8(str) {
  return Buffer.byteLength(str || '', 'utf8');
}

function lineForIndex(content, idx) {
  const before = content.slice(0, idx);
  return before.split('\n').length;
}

function snippetAround(content, idx, length = 160) {
  const start = Math.max(0, idx - 40);
  return content.slice(start, Math.min(content.length, idx + length));
}

async function scanFile(file) {
  const content = await fs.readFile(file, 'utf8');
  const results = [];

  // 1) Find literal Set-Cookie in res.setHeader('Set-Cookie', 'name=value; ...')
  const setHeaderRegex = /\bsetHeader\s*\(\s*['\"]Set-Cookie['\"]\s*,\s*(['\"])([\s\S]*?)\1\s*\)/g;
  let m;
  while ((m = setHeaderRegex.exec(content)) !== null) {
    const full = m[0];
    const cookieText = m[2];
    const idx = m.index;
    // parse cookie name=value up to first semicolon
    const pair = cookieText.split(';')[0] || '';
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const bytes = byteLengthUTF8(name + value);
      if (bytes > MAX_BYTES) {
        results.push({ type: 'setHeader-literal', file, idx, line: lineForIndex(content, idx), snippet: snippetAround(content, idx), bytes, name, value });
      }
    } else {
      // unknown format
      results.push({ type: 'setHeader-unknown', file, idx, line: lineForIndex(content, idx), snippet: snippetAround(content, idx), reason: 'unable to parse name=value' });
    }
  }

  // 2) Find buildSetCookieHeader('name','value') usage inside res.setHeader or otherwise
  const buildCallRegex = /buildSetCookieHeader\s*\(\s*(['\"])(.*?)\1\s*,\s*(['\"])(.*?)\3\s*\)/g;
  while ((m = buildCallRegex.exec(content)) !== null) {
    const idx = m.index;
    const name = m[2];
    const value = m[4];
    const bytes = byteLengthUTF8(name + value);
    if (bytes > MAX_BYTES) {
      results.push({ type: 'buildSetCookieHeader-literal', file, idx, line: lineForIndex(content, idx), snippet: snippetAround(content, idx), bytes, name, value });
    }
  }

  // 3) Find setCookieSafe(res, 'name', 'value') literal calls
  const setSafeRegex = /\bsetCookieSafe\s*\(\s*[^,]+,\s*(['\"])(.*?)\1\s*,\s*(['\"])(.*?)\3/g;
  while ((m = setSafeRegex.exec(content)) !== null) {
    const idx = m.index;
    const name = m[2];
    const value = m[4];
    const bytes = byteLengthUTF8(name + value);
    if (bytes > MAX_BYTES) {
      results.push({ type: 'setCookieSafe-literal', file, idx, line: lineForIndex(content, idx), snippet: snippetAround(content, idx), bytes, name, value });
    }
  }

  // 4) Find res.setHeader('Set-Cookie', buildSetCookieHeader(...)) where buildSetCookieHeader args might be literals
  const setHeaderBuildRegex = /\bsetHeader\s*\(\s*['\"]Set-Cookie['\"]\s*,\s*buildSetCookieHeader\s*\(\s*(['\"])(.*?)\1\s*,\s*(['\"])(.*?)\3\s*\)\s*\)/g;
  while ((m = setHeaderBuildRegex.exec(content)) !== null) {
    const idx = m.index;
    const name = m[2];
    const value = m[4];
    const bytes = byteLengthUTF8(name + value);
    if (bytes > MAX_BYTES) {
      results.push({ type: 'setHeader-build-literal', file, idx, line: lineForIndex(content, idx), snippet: snippetAround(content, idx), bytes, name, value });
    }
  }

  return results;
}

async function main() {
  const files = await walk(SRC).catch(() => []);
  if (files.length === 0) {
    console.log('No source files found under src/ to scan.');
    process.exit(0);
  }

  const all = [];
  for (const f of files) {
    try {
      const hits = await scanFile(f);
      all.push(...hits);
    } catch (err) {
      console.error('Error scanning', f, err && err.stack ? err.stack : String(err));
    }
  }

  if (all.length === 0) {
    console.log('No cookie size violations found.');
    process.exit(0);
  }

  console.error('\nCookie size violations detected:');
  for (const v of all) {
    if (v.bytes) {
      console.error(`\n- ${v.type} ${v.file}:${v.line} — name+value bytes=${v.bytes} > ${MAX_BYTES}\n  snippet: ${String(v.snippet).replace(/\n/g,'\\n').slice(0, 400)}`);
    } else {
      console.error(`\n- ${v.type} ${v.file}:${v.line} — ${v.reason || 'unknown issue'}\n  snippet: ${String(v.snippet).replace(/\n/g,'\\n').slice(0, 400)}`);
    }
  }

  process.exit(2);
}

if (import.meta.url === `file://${process.cwd()}/${path.relative(process.cwd(), process.argv[1] || '')}` || require.main === module) {
  main().catch(err => { console.error(err && err.stack ? err.stack : err); process.exit(3); });
}
