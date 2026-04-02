#!/usr/bin/env node
/**
 * Replaces top-level `console.error('…', err)` in App Router `route.ts` files
 * with `logRequestError(request, routePath, err, msg)`.
 *
 * Skips files listed in SKIP (nested handlers without `request` in scope).
 * Run: node scripts/migrate-api-route-console.mjs
 * Then: npm run typecheck
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(__dirname, '../src/app/api');

const SKIP = new Set([
  // Inner catches use `error` but `request` is not in scope — fix by hand if needed
  path.join(apiRoot, 'webhooks/green-api/route.ts'),
]);

const IMPORT =
  "import { logRequestError } from '@/lib/server/request-logging';\n";

function walkRouteTs(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkRouteTs(p));
    else if (ent.name === 'route.ts') out.push(p);
  }
  return out;
}

function routePathFromFile(file) {
  const rel = path.relative(apiRoot, file).replace(/\\/g, '/');
  return '/api/' + rel.replace(/\/route\.ts$/, '');
}

/** console.error('msg', errVar); or double quotes */
function replaceErrors(content, routePath) {
  let s = content;
  const re =
    /console\.error\(\s*((?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`\\]*`))\s*,\s*(\w+)\s*\)\s*;/g;
  s = s.replace(re, (_m, msgLit, errVar) => {
    return `logRequestError(request, '${routePath}', ${errVar}, ${msgLit});`;
  });
  return s;
}

function ensureImport(s) {
  if (s.includes("from '@/lib/server/request-logging'")) return s;
  if (!s.includes('logRequestError')) return s;
  const lines = s.split('\n');
  // Insert after the last *complete* import line (do not splice inside `import {` blocks)
  let insertAfter = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('import ') && t.includes(' from ')) insertAfter = i;
  }
  if (insertAfter === -1) return IMPORT + s;
  lines.splice(insertAfter + 1, 0, IMPORT.trimEnd());
  return lines.join('\n');
}

for (const file of walkRouteTs(apiRoot)) {
  if (SKIP.has(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('console.error')) continue;
  const routePath = routePathFromFile(file);
  const next = replaceErrors(raw, routePath);
  if (next === raw) continue;
  fs.writeFileSync(file, ensureImport(next));
  console.log('updated', path.relative(path.join(__dirname, '..'), file));
}
