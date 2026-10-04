import { seedCourseDocs } from './helpers/course-docs.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
const contentRoot = 'src/content/docs/textbook/ml/preprocessing';
const audit = JSON.parse(await readFile(path.join(root, 'migration/task-4c-manifest.json'), 'utf8'));
const read = async (file) => (await readFile(path.join(root, file), 'utf8')).replaceAll('\r\n', '\n');
const body = (markdown) => markdown.replace(/^---\n[\s\S]*?\n---\n\n/, '');
const hash = (data) => createHash('sha256').update(data).digest('hex');
const csvRows = (csv) => csv.trim().split('\n').slice(1).map((line) => [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((m) => m[1].replaceAll('""', '"')));
const nodes = (node) => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');

test('merged preprocessing preserves all legacy sections, code, formulas and source links', async () => {
  const source = await read('docs/ml/lecture_02.md');
  assert.equal(hash(await readFile(path.join(root, 'docs/ml/lecture_02.md'))), audit.legacySourceSha256);
  const page = await read(contentRoot + '/index.md');
  assert.match(page, /\ndraft: false\n/);
  assert.match(page, /\ncontentKind: textbook\n/);
  let restored = body(page);
  for (const asset of audit.assets) {
    const originalName = path.basename(asset.legacy, '.png');
    restored = restored.replace('![' + asset.alt + '](./assets/' + path.basename(asset.after) + ')',
      '![' + originalName + '](image/lecture_02/' + originalName + '.png)');
  }
  for (const [, tex] of source.matchAll(/\\\((.*?)\\\)/g)) restored = restored.replace('$' + tex + '$', '\\(' + tex + '\\)');
  const originalSections = [...source.matchAll(/^## (.+)$/gm)];
  const actualSections = [...restored.matchAll(/^## (.+)$/gm)];
  assert.deepEqual(actualSections.map((m) => m[1]), originalSections.map((m) => m[1]));
  assert.equal(restored.slice(0, actualSections[0].index).trim(), source.slice(source.indexOf('\n') + 1, originalSections[0].index).trim());
  for (let i = 0; i < originalSections.length; i++) {
    assert.equal(restored.slice(actualSections[i].index, actualSections[i + 1]?.index).trim(),
      source.slice(originalSections[i].index, originalSections[i + 1]?.index).trim(), originalSections[i][1]);
  }
  // Compare directly with the six pre-cleanup migrated bodies, not only legacy.
  const merged = body(page);
  const headings = [...merged.matchAll(/^## (.+)$/gm)];
  for (const [i, section] of audit.mergedSections.entries()) {
    const originalBody = merged.slice(headings[i].index + headings[i][0].length + 2, headings[i + 1].index - 2)
      .replace(/^(#{3,6}) /gm, (heading) => heading.slice(1));
    assert.equal(hash(originalBody), section.sha256, section.slug);
    await assert.rejects(stat(path.join(root, contentRoot, section.slug)), { code: 'ENOENT' });
  }
  const routes = csvRows(await read('migration/route-map.csv')).filter((row) => row[0] === '/ml/lecture_02/');
  assert.deepEqual(routes.map((row) => row.slice(0, 4)), [
    ['/ml/lecture_02/', '/textbook/ml/preprocessing/', 'primary-redirect-target', 'migrated-published'],
  ]);
});

test('all 13 preprocessing assets move intact into one page-local directory', async () => {
  const sourceImages = [...(await read('docs/ml/lecture_02.md')).matchAll(/!\[[^\]]*\]\((image\/lecture_02\/[^)]+)\)/g)].map((m) => 'docs/ml/' + m[1]);
  assert.deepEqual(audit.assets.map((a) => a.legacy).sort(), sourceImages.sort());
  assert.equal((await readdir(path.join(root, contentRoot, 'assets'))).length, 13);
  for (const asset of audit.assets) {
    const original = await readFile(path.join(root, asset.legacy));
    assert.deepEqual(await readFile(path.join(root, asset.after)), original);
    assert.equal(hash(original), asset.sha256);
    assert.match(asset.after, /preprocessing\/assets\/[a-z0-9-]+\.png$/);
  }
  assert.ok((await readFile(path.join(root, 'docs/ml/image/lecture_02/1760444292702.png'))).length > 0);
});

test('fence audit preserves all code and other chapters except their publication flag', async () => {
  for (const chapter of audit.unchangedChapters) {
    assert.equal(hash((await readFile(path.join(root, chapter.file), 'utf8')).replace('draft: false', 'draft: true')), chapter.sha256, chapter.file);
  }
  const found = [];
  for (const file of [contentRoot + '/index.md', ...audit.unchangedChapters.map((p) => p.file)]) {
    for (const [i, match] of [...(await read(file)).matchAll(/^(\x60{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1[ \t]*$/gm)].entries()) {
      found.push({ file, index: i + 1, language: match[2].trim(), codeSha256: hash(match[3]) });
    }
  }
  assert.deepEqual(found, audit.fencedBlocks);
  assert.equal(found.length, 3);
  assert.ok(found.every((block) => block.language === 'python'));
  const legacyCode = [...(await read('docs/ml/lecture_02.md')).matchAll(/\x60{3}python\n([\s\S]*?)\n\x60{3}/g)].map((m) => m[1]);
  const actualCode = [...(await read(contentRoot + '/index.md')).matchAll(/\x60{3}python\n([\s\S]*?)\n\x60{3}/g)].map((m) => m[1]);
  assert.deepEqual(actualCode, legacyCode);
});

test('merged review copy renders Python highlighting and the demo course references one chapter', { timeout: 120000 }, async () => {
  await mkdir(toolsDir, { recursive: true });
  const fixture = await mkdtemp(path.join(toolsDir, 'migration-build-test-'));
  try {
    for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
    }
    await seedCourseDocs(fixture);
    await cp(path.join(root, 'tests/fixtures/course-preprocessing.yaml'),
      path.join(fixture, 'src/content/courses/ml/2026-fall.yaml'));
    const packageUrl = new URL(import.meta.resolve('astro/package.json'));
    const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'));
    const cli = fileURLToPath(new URL(packageJson.bin.astro, packageUrl));
    const build = spawnSync(process.execPath, [cli, 'build'], {
      cwd: fixture, encoding: 'utf8', timeout: 60000, windowsHide: true,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    assert.equal(build.status, 0, (build.error ?? '') + '\n' + build.stdout + '\n' + build.stderr);
    const html = await readFile(path.join(fixture, 'dist/textbook/ml/preprocessing/index.html'), 'utf8');
    const elements = nodes(parse(html));
    assert.equal(elements.filter((n) => n.tagName === 'h1').length, 1);
    assert.equal(elements.filter((n) => n.tagName === 'img').length, 13);
    assert.ok(elements.filter((n) => n.tagName === 'math').length >= 15);
    assert.ok(elements.some((n) => n.tagName === 'blockquote' && text(n).includes('Подчеркнем еще рах')));
    const code = elements.filter((n) => n.tagName === 'pre');
    assert.equal(code.length, 3);
    const original = [...(await read('docs/ml/lecture_02.md')).matchAll(/\x60{3}python\n([\s\S]*?)\n\x60{3}/g)].map((m) => m[1].trimEnd());
    const codeText = (n) => nodes(n).filter((line) => attr(line, 'class') === 'ec-line').map((line) => text(line).replace(/\n$/, '')).join('\n').trimEnd();
    assert.deepEqual(code.map(codeText), original);
    for (const block of code) {
      assert.equal(attr(block, 'data-language'), 'python');
      const tokenStyles = nodes(block).filter((n) => n.tagName === 'span' && attr(n, 'style')).map((n) => attr(n, 'style'));
      assert.ok(new Set(tokenStyles).size >= 3, 'real Python tokens must have several colors');
      assert.ok(tokenStyles.some((style) => style.includes('--0:') && style.includes('--1:')), 'both themes must be emitted');
    }
    const copyButtons = elements.filter((n) => n.tagName === 'button' && attr(n, 'data-code') !== undefined);
    assert.equal(copyButtons.length, 3);
    assert.deepEqual(copyButtons.map((n) => attr(n, 'data-code').replaceAll(String.fromCharCode(127), '\n')), original);
    const course = nodes(parse(await readFile(path.join(fixture, 'dist/courses/ml/2026-fall/index.html'), 'utf8')));
    const module = course.find((n) => attr(n, 'aria-labelledby') === 'module-3');
    assert.ok(module);
    assert.deepEqual(nodes(module).filter((n) => n.tagName === 'a' && attr(n, 'href')?.includes('/preprocessing/')).map((n) => attr(n, 'href')),
      ['/ml-dl-course-site/textbook/ml/preprocessing/']);
    assert.ok(!text(module).includes('В машинном обучении качество предсказаний'));
    const links = spawnSync(process.execPath, ['--experimental-strip-types', path.join(root, 'scripts/check-links.mjs'), path.join(fixture, 'dist')], {
      cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true,
    });
    assert.equal(links.status, 0, links.stdout + '\n' + links.stderr);
  } finally {
    const relative = path.relative(toolsDir, path.resolve(fixture));
    assert.ok(relative.startsWith('migration-build-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});
