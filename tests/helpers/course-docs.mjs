import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Existing course tests exercise public references using stable fixtures.
// They do not rewrite the author's real chapters or publish working demo documents.
export async function seedCourseDocs(fixture) {
  for (const slug of ['introduction', 'linear-models']) {
    await cp(path.join(root, 'tests/fixtures/docs', slug + '.md'),
      path.join(fixture, 'src/content/docs/textbook/ml', slug, 'index.md'));
  }
  // Demo documents are test fixtures, never part of the author's content.
  const target = path.join(fixture, 'src/content/docs/courses/ml/2026-fall');
  await mkdir(target, { recursive: true });
  await cp(path.join(root, 'tests/fixtures/course-docs'), target, { recursive: true });
  await mkdir(path.join(fixture, 'src/content/courses/ml'), { recursive: true });
  const guide = path.join(fixture, 'src/content/docs/guides/git/index.md');
  await writeFile(guide, (await readFile(guide, 'utf8')).replace('draft: true', 'draft: false'));
}
