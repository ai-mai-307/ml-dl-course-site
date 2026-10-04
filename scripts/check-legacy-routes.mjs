import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'parse5';
import config from '../astro.config.mjs';
import { legacyRoutes } from '../src/utils/legacy-routes.mjs';

// Enumerate the actual MkDocs output, including pages outside its nav.
const base = config.base.replace(/\/$/, '') + '/';
const root = fileURLToPath(new URL('../', import.meta.url));
async function routes(dir, prefix = '/') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...await routes(path.join(dir, entry.name), prefix + entry.name + '/'));
    else if (entry.name.endsWith('.html')) result.push(prefix + (entry.name === 'index.html' ? '' : entry.name));
  }
  return result.sort();
}
const legacy = await routes(path.join(root, 'site')).catch(() => { throw Error('Run mkdocs build --strict first (site/ is required).'); });
const modern = new Set(await routes(path.join(root, 'dist')));
const unchanged = new Set(['/', '/404.html']);
const mapping = new Map(legacyRoutes.map((entry) => [entry.from, entry]));
assert.ok(legacy.length > 0);
for (const route of legacy) {
  assert.ok(unchanged.has(route) || mapping.has(route), 'Unclassified legacy HTML route: ' + route);
  assert.ok(modern.has(route), 'Missing Astro output for legacy route: ' + route);
}
for (const route of unchanged) assert.ok(legacy.includes(route) && modern.has(route), 'Missing unchanged route ' + route);
for (const entry of legacyRoutes) {
  assert.ok(legacy.includes(entry.from), 'Mapped URL did not exist in MkDocs output: ' + entry.from);
  assert.ok(modern.has(entry.to), 'Missing destination: ' + entry.to);
}

// Audit local assets actually referenced by the old HTML. They are served by
// MkDocs on rollback; redirects contain no old layout/content asset references.
const assets = new Set();
const missing = new Set();
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
for (const route of legacy) {
  const file = path.join(root, 'site', route.endsWith('/') ? route + 'index.html' : route);
  for (const node of nodes(parse(await readFile(file, 'utf8')))) {
    for (const attr of node.attrs ?? []) {
      if (!['href', 'src'].includes(attr.name)) continue;
      const url = new URL(attr.value, new URL(base + route.slice(1), config.site));
      if (url.origin !== new URL(config.site).origin || !path.extname(url.pathname) || /\.html$/.test(url.pathname)) continue;
      assets.add(url.pathname);
      try { assert.ok((await stat(path.join(root, 'site', decodeURIComponent(url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname)))).isFile()); }
      catch { missing.add(url.pathname); }
    }
  }
}
const primary = legacyRoutes.filter((r) => r.relationship === 'primary-redirect-target');
const fallback = legacyRoutes.filter((r) => r.relationship === 'archive-fallback');
console.log(JSON.stringify({ legacyHtml: legacy.length, astroHtml: modern.size, unchanged: [...unchanged], canonical: primary.map(r => [r.from, r.to]), fallback: fallback.map(r => r.from), legacyReferencedAssets: assets.size, missingLegacyAssets: [...missing] }, null, 2));
if (missing.size) console.warn('Legacy source references missing assets (preserved for audit, not copied into Astro): ' + [...missing].join(', '));
console.log('PASS: every legacy HTML route has an explicit production behavior.');
