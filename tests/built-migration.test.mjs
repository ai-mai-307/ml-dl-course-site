import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const audit = JSON.parse(await readFile(new URL('../migration/task-4b-manifest.json', import.meta.url), 'utf8'));
const routes = [
  'textbook/ml/preprocessing/',
  ...audit.pages.map((page) => page.route.slice(1)),
  'courses/ml/2026-fall/',
];
test('production excludes all real textbook drafts and their course from pages, lists and sitemap', async () => {
  for (const route of routes) {
    await assert.rejects(stat(path.join(dist, route, 'index.html')), { code: 'ENOENT' });
  }
  async function check(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) await check(filename);
      else if (/\.(html|xml)$/.test(item.name)) {
        const content = await readFile(filename, 'utf8');
        for (const route of routes) {
          const leaked = route.startsWith('courses/')
            ? content.includes('/' + route + '"') || content.includes('/' + route + '<')
            : content.includes('/' + route);
          assert.ok(!leaked, filename + ': leaked ' + route);
        }
      }
    }
  }
  await check(dist);
});
