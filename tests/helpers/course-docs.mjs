import { cp, readFile, writeFile } from 'node:fs/promises';
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
  // Publish only the course's demo references inside the isolated fixture.
  for (const relative of [
    'guides/git/index.md',
    ...['overview.md', 'assessment.md', 'exam.md', 'assignments/hw-03.md']
      .map((file) => 'courses/ml/2026-fall/' + file),
  ]) {
    const filename = path.join(fixture, 'src/content/docs', relative);
    await writeFile(filename, (await readFile(filename, 'utf8')).replace('draft: true', 'draft: false'));
  }
}
