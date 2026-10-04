import { readFileSync } from 'node:fs';

// A deliberately small, strict reader for this map's five quoted, single-line CSV fields.
export function parseRouteMap(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.shift() !== 'legacy_route,target_route,relationship,status,source_section') throw Error('Invalid route-map header');
  const seen = new Set();
  return lines.map((line, index) => {
    const fields = [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((m) => m[1].replaceAll('""', '"'));
    if (fields.length !== 5 || fields.map((v) => '"' + v.replaceAll('"', '""') + '"').join(',') !== line) throw Error('Invalid route-map row ' + (index + 2));
    const [from, to, relationship, status, description] = fields;
    for (const route of [from, to]) {
      if (!/^\/(?:[a-z0-9_-]+\/)+$/.test(route)) throw Error('Invalid mapped route: ' + route);
    }
    if (seen.has(from) || from === to) throw Error('Duplicate or self redirect: ' + from);
    if (!['primary-redirect-target', 'archive-fallback'].includes(relationship)) throw Error('Unknown route relationship: ' + relationship);
    if (relationship === 'archive-fallback' && to !== '/archive/') throw Error('Archive fallback must target /archive/');
    seen.add(from);
    return { from, to, relationship, status, description };
  });
}

export const legacyRoutes = parseRouteMap(readFileSync(new URL('../../migration/route-map.csv', import.meta.url), 'utf8'));
// Astro static redirect destinations are literal paths; base is not added automatically.
export const legacyRedirects = (base) => Object.fromEntries(legacyRoutes.map(({ from, to }) => [from, base.replace(/\/$/, '') + to]));
