import { seedCourseDocs } from './helpers/course-docs.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
const astroPackageUrl = new URL(import.meta.resolve('astro/package.json'));
const astroPackage = JSON.parse(await readFile(astroPackageUrl, 'utf8'));
const astroCli = fileURLToPath(new URL(astroPackage.bin.astro, astroPackageUrl));

test('actual Astro builds validate course pages, module numbering, references, and schema errors', { timeout: 120000 }, async () => {
  await mkdir(toolsDir, { recursive: true });
  const fixture = await mkdtemp(path.join(toolsDir, 'course-build-test-'));
  try {
    // An isolated copy; no edits to the author's manifest, content store, or production dist.
    for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
    }
    // Keep schema/route tests independent of the author's real courses.
    await seedCourseDocs(fixture);
    await cp(path.join(root, 'tests/fixtures/course.yaml'), path.join(fixture, 'src/content/courses/ml/2026-fall.yaml'));
    const build = () => spawnSync(process.execPath, [astroCli, 'build'], {
      cwd: fixture,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
      encoding: 'utf8', timeout: 35000, windowsHide: true,
    });
    const valid = build();
    assert.equal(valid.status, 0, `${valid.error ?? ''}\n${valid.stdout}\n${valid.stderr}`);
    const html = await readFile(path.join(fixture, 'dist/courses/ml/2026-fall/index.html'), 'utf8');
    const page = parse(html);
    const nodes = [];
    function walk(node) { nodes.push(node); node.childNodes?.forEach(walk); }
    walk(page);
    const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
    const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');
    const descendants = (root) => [root, ...(root.childNodes ?? []).flatMap(descendants)];
    assert.match(text(page), /Черновик/);
    assert.match(text(page), /Осень 2026/);
    assert.match(text(page), /2026-fall/);
    assert.deepEqual(nodes.filter((node) => node.tagName === 'h3' && attr(node, 'id')?.startsWith('module-')).map((node) => [attr(node, 'id'), text(node).trim()]), [
      ['module-1', '1. Введение в машинное обучение'], ['module-2', '2. Линейные модели'],
    ]);
    const information = nodes.find((node) => attr(node, 'aria-labelledby') === 'course-information');
    const curriculum = nodes.find((node) => attr(node, 'aria-labelledby') === 'curriculum');
    assert.ok(information && curriculum);
    assert.ok(nodes.indexOf(information) < nodes.indexOf(curriculum));
    assert.deepEqual(descendants(information).filter((node) => attr(node, 'data-course-page-role')).map((node) => attr(node, 'data-course-page-role')), ['overview', 'assessment', 'exam']);
    assert.ok(!descendants(curriculum).some((node) => attr(node, 'data-course-page-role')));
    const secondModule = nodes.find((node) => attr(node, 'aria-labelledby') === 'module-2');
    const theory = descendants(secondModule).find((node) => attr(node, 'data-resource-role') === 'theory');
    assert.deepEqual(descendants(theory).filter((node) => node.tagName === 'a').map((node) => attr(node, 'href')), [
      '/ml-dl-course-site/textbook/ml/introduction/', '/ml-dl-course-site/textbook/ml/linear-models/',
    ]);
    for (const role of ['theory', 'assignment', 'guide', 'notebook', 'slides', 'repository', 'other']) {
      assert.ok(nodes.some((node) => attr(node, 'data-resource-role') === role), `Missing role ${role}`);
    }
    assert.ok(nodes.some((node) => node.tagName === 'a' && attr(node, 'href') === '/ml-dl-course-site/textbook/ml/linear-models/'));
    assert.ok(nodes.some((node) => node.tagName === 'a' && text(node) === 'Домашнее задание №3 — заглушка'));
    assert.ok(!text(page).includes('Здесь появится каноническая глава'));

    // Also prove the real loader respects custom slugs, not just source filenames.
    const docPath = path.join(fixture, 'src/content/docs/textbook/ml/linear-models/index.md');
    await writeFile(docPath, (await readFile(docPath, 'utf8')).replace('contentKind: textbook', 'contentKind: textbook\nslug: textbook/renamed-example'), 'utf8');
    const manifestPath = path.join(fixture, 'src/content/courses/ml/2026-fall.yaml');
    const manifest = (await readFile(manifestPath, 'utf8')).replaceAll('\r\n', '\n').replaceAll('doc: textbook/ml/linear-models', 'doc: textbook/renamed-example');
    // Exercise a display-only label and every remaining organizational role in the real schema.
    const extraPages = ['schedule', 'policy', 'resources', 'other'].map((role) => `  - role: ${role}\n    doc: courses/ml/2026-fall/overview\n`).join('');
    const custom = manifest.replace('pages:\n', `pages:\n${extraPages}`).replace('modules:\n  - title:', 'modules:\n  - label: Вводный блок\n    title:');
    await writeFile(manifestPath, custom, 'utf8');
    const renamed = build();
    assert.equal(renamed.status, 0, `${renamed.stdout}\n${renamed.stderr}`);
    const renamedHtml = await readFile(path.join(fixture, 'dist/courses/ml/2026-fall/index.html'), 'utf8');
    assert.ok(renamedHtml.includes('href="/ml-dl-course-site/textbook/renamed-example/"'));
    assert.match(renamedHtml, /Вводный блок\. Введение/);
    assert.match(renamedHtml, /2\. Линейные модели/);
    for (const role of ['schedule', 'policy', 'resources', 'other']) assert.ok(renamedHtml.includes(`data-course-page-role="${role}"`));

    await writeFile(manifestPath, `${manifest}\n  - title: Hidden validation fixture\n    published: false\n    resources:\n      - type: doc\n        role: theory\n        doc: textbook/missing-build-test\n`, 'utf8');
    const invalid = build();
    assert.equal(invalid.status, 1, 'astro build must reject a missing reference');
    assert.match(`${invalid.stdout}\n${invalid.stderr}`, /Course manifest "ml\/2026-fall", module 3: missing docs reference "textbook\/missing-build-test"/);

    await writeFile(manifestPath, manifest.replace('doc: courses/ml/2026-fall/overview', 'doc: courses/missing-overview'), 'utf8');
    const missingPage = build();
    assert.equal(missingPage.status, 1);
    assert.match(`${missingPage.stdout}\n${missingPage.stderr}`, /page 1 \(overview\): missing docs reference "courses\/missing-overview"/);

    for (const [source, diagnostic] of [
      [manifest.replace('modules:\n  - title:', 'modules:\n  - number: 42\n    title:'), /number/],
      [manifest.replace('modules:\n  - title:', 'modules:\n  - label: " "\n    title:'), /label/],
      [manifest.replace('role: overview', 'role: theory'), /role/],
      [manifest.replace('doc: courses/ml/2026-fall/overview', 'href: https://example.com/'), /doc/],
    ]) {
      await writeFile(manifestPath, source, 'utf8');
      const invalidSchema = build();
      assert.equal(invalidSchema.status, 1, 'invalid manifest must fail the real schema');
      assert.match(`${invalidSchema.stdout}\n${invalidSchema.stderr}`, diagnostic);
    }
  } finally {
    // Delete only the unique directory created above, after verifying its absolute location.
    const relative = path.relative(toolsDir, path.resolve(fixture));
    assert.ok(relative.startsWith('course-build-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});
