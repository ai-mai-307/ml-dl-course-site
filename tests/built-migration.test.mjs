import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
test('production excludes the real migration drafts and their course from pages, lists and sitemap', async () => {
  for (const route of ['textbook/ml/preprocessing', 'courses/ml/2026-fall/index.html']) {
    await assert.rejects(stat(path.join(dist, route)), { code: 'ENOENT' });
  }
  async function check(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) await check(filename);
      else if (/\.(html|xml)$/.test(item.name)) {
        assert.doesNotMatch(await readFile(filename, 'utf8'), /\/textbook\/ml\/preprocessing\/|\/courses\/ml\/2026-fall\/(?:["<])/, filename);
      }
    }
  }
  await check(dist);
});
