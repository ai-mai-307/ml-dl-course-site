import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const audit = JSON.parse(await readFile(new URL('migration/task-6b-manifest.json', root), 'utf8'));
const hash = (data) => createHash('sha256').update(data).digest('hex');
const read = async (file) => (await readFile(new URL(file, root), 'utf8')).replaceAll('\r\n', '\n');

test('five legacy guides preserve the complete source except recorded mechanical edits and new warnings', async () => {
  assert.deepEqual(audit.pages.map((p) => p.source), [
    'docs/index/howtoclassroom.md', 'docs/index/clone_repo.md',
    'docs/index/datasphere_commint_and_push.md', 'docs/index/what_is_dataset.md', 'docs/index/manage_budget.md',
  ]);
  for (const page of audit.pages) {
    assert.equal(hash(await readFile(new URL(page.source, root))), page.sourceSha256);
    let expected = await read(page.source);
    for (const edit of page.edits) {
      assert.ok(['local-image-and-alt', 'title-to-frontmatter', 'secondary-h1-to-h2', 'admonition-to-callout'].includes(edit.kind));
      assert.ok(expected.includes(edit.before), page.source + ': missing recorded source');
      expected = expected.replace(edit.before, () => edit.after);
    }
    const actual = await read(page.target);
    assert.match(actual, /\ncontentKind: guide\n/);
    assert.match(actual, /\ndraft: false\n/);
    assert.doesNotMatch(actual.split('\n---\n')[0], /\n(?:courseId|termId):/);
    const body = actual.replace(/^---\n[\s\S]*?\n---\n\n/, '');
    assert.ok(body.startsWith(page.warning));
    assert.equal(body.slice(page.warning.length), expected, page.source);
    assert.match(page.warning, /осенний семестр 2026 года/);
    assert.match(page.warning, /GitHub Classroom не используется|грантовый доступ к Yandex DataSphere/);
    if (page.route.endsWith('/budget/')) assert.match(page.warning, /прежней схеме грантового доступа и сейчас не является рабочей инструкцией/);
  }
});

test('all 32 referenced guide screenshots remain byte-identical and page-local', async () => {
  let count = 0;
  for (const page of audit.pages) {
    const images = [...(await read(page.source)).matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
    assert.equal(page.assets.length, images.length);
    const targetDir = page.target.slice(0, -'index.md'.length);
    assert.equal((await readdir(new URL(targetDir + 'assets/', root))).length, images.length);
    for (const asset of page.assets) {
      assert.ok(asset.newPath.startsWith(targetDir + 'assets/'));
      assert.match(asset.newPath, /\/[a-z0-9-]+\.png$/);
      const source = await readFile(new URL(asset.oldPath, root));
      assert.equal(hash(source), asset.sha256);
      assert.deepEqual(await readFile(new URL(asset.newPath, root)), source);
      assert.ok(asset.alt.length > 0);
      count++;
    }
  }
  assert.equal(count, 32);
});

test('all five legacy guide routes have one recorded archive migration target', async () => {
  const csv = await read('migration/route-map.csv');
  for (const page of audit.pages) {
    const oldRoute = '/' + page.source.slice(5, -3) + '/';
    const rows = csv.split('\n').filter((row) => row.startsWith('"' + oldRoute + '",'));
    assert.equal(rows.length, 1);
    assert.ok(rows[0].includes('"' + page.route + '","primary-redirect-target","migrated-published-outdated"'));
  }
});
