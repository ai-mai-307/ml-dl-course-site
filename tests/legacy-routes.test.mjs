import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRouteMap } from '../src/utils/legacy-routes.mjs';

const header = 'legacy_route,target_route,relationship,status,source_section\n';
const row = '"/old/","/new/","primary-redirect-target","published","Description, with ""quotes"""';
test('route map preserves quoted descriptions and rejects malformed or unsafe routes', () => {
  assert.deepEqual(parseRouteMap(header + row)[0], { from: '/old/', to: '/new/', relationship: 'primary-redirect-target', status: 'published', description: 'Description, with "quotes"' });
  for (const bad of [row + '\n' + row, row.replace('/new/', '/old/'), row.replace('/new/', '//external/'), row.replace('/new/', '/new/../'), row.replace('primary-redirect-target', 'typo'), row.replace('primary-redirect-target', 'archive-fallback'), row + ',extra']) {
    assert.throws(() => parseRouteMap(header + bad));
  }
});
