#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { parse } from '@typescript-eslint/parser';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx']);

function isTextFile(filename) {
  return EXT.has(path.extname(filename));
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist') continue;
      files.push(...(await collectFiles(full)));
    } else if (e.isFile() && isTextFile(full)) {
      files.push(full);
    }
  }
  return files;
}

function reportEntry(filePath, node, type, snippet) {
  return {
    file: path.relative(ROOT, filePath),
    line: node.loc?.start.line ?? null,
    column: node.loc?.start.column ?? null,
    type,
    snippet: snippet ?? null,
  };
}

function getSourceLine(src, line) {
  const lines = src.split(/\r?\n/);
  return lines[line - 1] ?? '';
}

function traverse(node, cb) {
  if (!node || typeof node !== 'object') return;
  cb(node);
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) traverse(c, cb);
    } else if (child && typeof child.type === 'string') {
      traverse(child, cb);
    }
  }
}

async function analyzeFile(filePath) {
  const src = await fs.readFile(filePath, 'utf8');
  let ast;
  try {
    ast = parse(src, {
      loc: true,
      range: true,
      tokens: true,
      comment: true,
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    });
  } catch (err) {
    // skip files that can't be parsed
    return { file: path.relative(ROOT, filePath), parseError: String(err) };
  }

  const violations = [];

  traverse(ast, (node) => {
    // dangerouslySetInnerHTML in JSX
    if (node.type === 'JSXAttribute' && node.name && node.name.name === 'dangerouslySetInnerHTML') {
      const snippet = getSourceLine(src, node.loc.start.line).trim();
      violations.push(reportEntry(filePath, node, 'dangerouslySetInnerHTML', snippet));
    }

    // Assignment to .innerHTML or ['innerHTML']
    if (node.type === 'AssignmentExpression') {
      const left = node.left;
      if (left && left.type === 'MemberExpression') {
        // property as identifier
        if (!left.computed && left.property && left.property.type === 'Identifier' && left.property.name === 'innerHTML') {
          const snippet = getSourceLine(src, node.loc.start.line).trim();
          const tainted = isSuspicious(node.right);
          const entry = reportEntry(filePath, node, 'innerHTML-assignment', snippet);
          if (tainted) entry.tainted = true;
          violations.push(entry);
        }
        // property as literal: obj['innerHTML']
        if (left.computed && left.property && left.property.type === 'Literal' && left.property.value === 'innerHTML') {
          const snippet = getSourceLine(src, node.loc.start.line).trim();
          const tainted = isSuspicious(node.right);
          const entry = reportEntry(filePath, node, "innerHTML-assignment", snippet);
          if (tainted) entry.tainted = true;
          violations.push(entry);
        }
      }
    }

    // setAttribute('innerHTML', ...)
    if (node.type === 'CallExpression' && node.callee) {
      const callee = node.callee;
      if (callee.type === 'MemberExpression' && callee.property && callee.property.type === 'Identifier' && callee.property.name === 'setAttribute') {
        const firstArg = node.arguments && node.arguments[0];
        if (firstArg && ((firstArg.type === 'Literal' && firstArg.value === 'innerHTML') || (firstArg.type === 'Literal' && firstArg.raw === '"innerHTML"'))) {
          const snippet = getSourceLine(src, node.loc.start.line).trim();
          violations.push(reportEntry(filePath, node, "setAttribute-innerHTML", snippet));
        }
      }
    }

    // eval(...) call
    if (node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier' && node.callee.name === 'eval') {
      const snippet = getSourceLine(src, node.loc.start.line).trim();
      const entry = reportEntry(filePath, node, 'eval-call', snippet);
      if (node.arguments && node.arguments.some(isSuspicious)) entry.tainted = true;
      violations.push(entry);
    }

    // new Function(...) or Function(...)
    if ((node.type === 'NewExpression' || node.type === 'CallExpression') && node.callee && node.callee.type === 'Identifier' && node.callee.name === 'Function') {
      const snippet = getSourceLine(src, node.loc.start.line).trim();
      const entry = reportEntry(filePath, node, 'Function-constructor', snippet);
      if ((node.arguments || []).some(isSuspicious)) entry.tainted = true;
      violations.push(entry);
    }
  });

  return { file: path.relative(ROOT, filePath), violations };
}

// Heuristic: detect if expression contains user-input-like sources
function isSuspicious(node) {
  if (!node) return false;
  let found = false;
  traverse(node, (n) => {
    if (!n || found) return;
    // member expressions like req.body, req.query
    if (n.type === 'MemberExpression') {
      // req.body, req.query
      if (n.object && n.object.type === 'Identifier' && n.object.name === 'req' && n.property && n.property.type === 'Identifier' && ['body', 'query', 'params'].includes(n.property.name)) {
        found = true; return;
      }
      // e.target.value or event.target.value
      if (n.property && n.property.type === 'Identifier' && n.property.name === 'value') {
        // if object is MemberExpression with property 'target' it's suspicious
        if (n.object && n.object.type === 'MemberExpression' && n.object.property && n.object.property.type === 'Identifier' && n.object.property.name === 'target') {
          found = true; return;
        }
      }
      // window.location, location.search
      if (n.object && n.object.type === 'Identifier' && ['window', 'location'].includes(n.object.name)) {
        found = true; return;
      }
      // searchParams.get(...)
      if (n.property && n.property.type === 'Identifier' && n.property.name === 'get') {
        if (n.object && ((n.object.type === 'Identifier' && ['searchParams', 'URLSearchParams'].includes(n.object.name)) || n.object.type === 'MemberExpression')) {
          found = true; return;
        }
      }
    }
    // Call expressions like searchParams.get(...), formData.get(...), localStorage.getItem(...)
    if (n.type === 'CallExpression') {
      if (n.callee.type === 'MemberExpression' && n.callee.property && n.callee.property.type === 'Identifier') {
        const prop = n.callee.property.name;
        if (['get', 'getItem', 'valueOf'].includes(prop)) {
          // check object identifier
          const obj = n.callee.object;
          if (obj && ((obj.type === 'Identifier' && ['searchParams', 'formData', 'localStorage', 'sessionStorage', 'URLSearchParams'].includes(obj.name)) || (obj.type === 'MemberExpression'))) {
            found = true; return;
          }
        }
      }
      // decodeURIComponent, JSON.parse of input are suspicious
      if (n.callee.type === 'Identifier' && ['decodeURIComponent', 'decodeURI', 'JSON.parse'].includes(n.callee.name)) {
        found = true; return;
      }
    }
    // Identifier names that are likely sources
    if (n.type === 'Identifier' && ['req', 'body', 'query', 'params', 'formData', 'searchParams', 'localStorage', 'sessionStorage', 'event', 'e', 'input'].includes(n.name)) {
      found = true; return;
    }
  });
  return found;
}

async function main() {
  try {
    const exists = await fs.stat(SRC).then(() => true).catch(() => false);
    if (!exists) {
      console.error('No src/ directory found — nothing to scan');
      process.exit(0);
    }

    const files = await collectFiles(SRC);
    const results = [];
    for (const f of files) {
      const r = await analyzeFile(f);
      results.push(r);
    }

    // Aggregate violations
    const violations = [];
    const parseErrors = [];
    for (const r of results) {
      if (r.parseError) parseErrors.push(r);
      if (r.violations && r.violations.length) {
        for (const v of r.violations) violations.push(v);
      }
    }

    // Print report
    console.log('\nText-safety scan report');
    console.log('========================\n');

    if (parseErrors.length) {
      console.log('Files skipped due to parse errors:');
      for (const p of parseErrors) console.log(` - ${p.file}: ${p.parseError}`);
      console.log('');
    }

    if (violations.length === 0) {
      console.log('No unsafe text-insertion or eval/Function usage found in src/');
      process.exit(0);
    }

    for (const v of violations) {
      console.log(`${v.file}:${v.line}:${v.column}  ${v.type}`);
      if (v.snippet) console.log(`  > ${v.snippet}`);
    }

    console.log('\nSummary:');
    console.log(`Total files scanned: ${results.length}`);
    console.log(`Total violations: ${violations.length}`);
    process.exit(1);
  } catch (err) {
    console.error('Error running text-safety scan:', err);
    process.exit(2);
  }
}

main();
