import { cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Existing course tests exercise public references using stable fixtures.
// They do not publish or rewrite the author's real draft chapters.
export async function seedCourseDocs(fixture) {
  for (const slug of ['introduction', 'linear-models']) {
    await cp(path.join(root, 'tests/fixtures/docs', slug + '.md'),
      path.join(fixture, 'src/content/docs/textbook/ml', slug, 'index.md'));
  }
}
