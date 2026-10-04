import { seedCourseDocs } from './helpers/course-docs.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
const contentRoot = 'src/content/docs/textbook/ml/preprocessing';
const slugs = ['scaling', 'categorical-features', 'temporal-features', 'outliers', 'missing-values', 'sklearn-api'];
const read = async (file) => (await readFile(path.join(root, file), 'utf8')).replaceAll('\r\n', '\n');
const body = (markdown) => markdown.replace(/^---\n[\s\S]*?\n---\n\n/, '');
const csvRows = (csv) => csv.trim().split('\n').slice(1).map((line) => [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((m) => m[1].replaceAll('""', '"')));

test('lecture split preserves every source paragraph, code block, formula, and source link', async () => {
  const source = await read('docs/ml/lecture_02.md');
  const sections = [...source.matchAll(/^## (.+)$/gm)];
  const assets = csvRows(await read('migration/task-4-assets.csv'));
  for (const [i, slug] of slugs.entries()) {
    const page = await read(`${contentRoot}/${slug}/index.md`);
    assert.match(page, /\ndraft: true\n/);
    assert.match(page, /\ncontentKind: textbook\n/);
    assert.equal(JSON.parse(page.match(/^title: (.+)$/m)[1]), sections[i][1]);
    let restored = body(page).split('\n\n---\n\n')[0].replace(/^(#{2,5}) /gm, '#$1 ');
    for (const [oldPath, newPath, , alt] of assets) {
      const oldName = path.basename(oldPath, '.png');
      restored = restored.replace(`![${alt}](./assets/${path.basename(newPath)})`, `![${oldName}](image/lecture_02/${oldName}.png)`);
    }
    for (const [, tex] of source.matchAll(/\\\((.*?)\\\)/g)) restored = restored.replace(`$${tex}$`, `\\(${tex}\\)`);
    assert.equal(restored.trim(), source.slice(sections[i].index + sections[i][0].length, sections[i + 1].index).trim(), slug);
  }
  const landing = body(await read(`${contentRoot}/index.md`));
  assert.equal(landing.split('\n\n## Темы раздела')[0], source.slice(source.indexOf('\n') + 1, sections[0].index).trim());
  assert.equal(landing.slice(landing.indexOf('## Использованные источники')).trim(), source.slice(sections[6].index).trim());
  for (const slug of slugs) assert.ok(landing.includes(`](./${slug}/)`));
  const routes = csvRows(await read('migration/route-map.csv')).filter((row) => row[0] === '/ml/lecture_02/');
  assert.equal(routes.length, 7);
  assert.deepEqual(routes.filter((row) => row[2] === 'primary-redirect-target').map((row) => row[1]), ['/textbook/ml/preprocessing/']);
  assert.ok(routes.every((row) => row[0] === '/ml/lecture_02/' && row[3] === 'migrated-draft'));
});

test('all 13 referenced images are copied byte-for-byte and unused legacy assets remain', async () => {
  const assets = csvRows(await read('migration/task-4-assets.csv'));
  const sourceImages = [...(await read('docs/ml/lecture_02.md')).matchAll(/!\[[^\]]*\]\((image\/lecture_02\/[^)]+)\)/g)].map((m) => `docs/ml/${m[1]}`);
  assert.deepEqual(assets.map((row) => row[0]).sort(), sourceImages.sort());
  for (const [oldPath, newPath, hash] of assets) {
    const original = await readFile(path.join(root, oldPath));
    assert.deepEqual(await readFile(path.join(root, newPath)), original);
    assert.equal(createHash('sha256').update(original).digest('hex'), hash);
    assert.match(newPath, /\/assets\/[a-z0-9-]+\.png$/);
  }
  assert.ok((await readFile(path.join(root, 'docs/ml/image/lecture_02/1760444292702.png'))).length > 0);
});

test('review copy builds all migrated pages and composes one module from six documents', { timeout: 120000 }, async () => {
  await mkdir(toolsDir, { recursive: true });
  const fixture = await mkdtemp(path.join(toolsDir, 'migration-build-test-'));
  try {
    for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
    }
    await seedCourseDocs(fixture);
    // Production omits drafts. Publish ONLY in this disposable copy to exercise
    // real image, math, code and link generation without changing author visibility.
    for (const slug of ['', ...slugs]) {
      const filename = `${contentRoot}/${slug ? slug + '/' : ''}index.md`;
      const source = await read(filename);
      assert.match(source, /\ndraft: true\n/);
      await writeFile(path.join(fixture, filename), source.replace('\ndraft: true\n', '\ndraft: false\n'));
    }
    const manifestPath = 'src/content/courses/ml/2026-fall.yaml';
    const manifest = await read(manifestPath);
    assert.match(manifest, /\ndraft: true\n/);
    await writeFile(path.join(fixture, manifestPath), manifest.replace('\ndraft: true\n', '\ndraft: false\n'));
    const astroPackageUrl = new URL(import.meta.resolve('astro/package.json'));
    const astroPackage = JSON.parse(await readFile(astroPackageUrl, 'utf8'));
    const cli = fileURLToPath(new URL(astroPackage.bin.astro, astroPackageUrl));
    const build = spawnSync(process.execPath, [cli, 'build'], {
      cwd: fixture, encoding: 'utf8', timeout: 60000, windowsHide: true,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    assert.equal(build.status, 0, `${build.error ?? ''}\n${build.stdout}\n${build.stderr}`);
    const allNodes = (node) => [node, ...(node.childNodes ?? []).flatMap(allNodes)];
    const attr = (node, name) => node.attrs?.find((attr) => attr.name === name)?.value;
    const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');
    let images = 0;
    let math = 0;
    for (const slug of slugs) {
      const html = await readFile(path.join(fixture, `dist/textbook/ml/preprocessing/${slug}/index.html`), 'utf8');
      const nodes = allNodes(parse(html));
      images += nodes.filter((node) => node.tagName === 'img').length;
      math += nodes.filter((node) => node.tagName === 'math').length;
      if (slug === 'sklearn-api') {
        const code = nodes.filter((node) => node.tagName === 'pre');
        assert.equal(code.length, 3);
        const original = [...(await read('docs/ml/lecture_02.md')).matchAll(/```python\n([\s\S]*?)\n```/g)].map((m) => m[1].trimEnd());
        // Expressive Code uses block-level ec-line elements, not newline text nodes.
        const codeText = (node) => allNodes(node).filter((line) => attr(line, 'class') === 'ec-line')
          .map((line) => text(line).replace(/\n$/, '')).join('\n').trimEnd();
        assert.deepEqual(code.map(codeText), original);
      }
      if (slug === 'missing-values') {
        assert.ok(nodes.some((node) => node.tagName === 'blockquote' && text(node).includes('Подчеркнем еще рах')));
        assert.ok(!text(parse(html)).includes('\\('), 'legacy math delimiters must render');
      }
    }
    assert.equal(images, 13);
    assert.ok(math >= 15, `Expected inline and block MathML, got ${math}`);
    const course = allNodes(parse(await readFile(path.join(fixture, 'dist/courses/ml/2026-fall/index.html'), 'utf8')));
    const module = course.find((node) => attr(node, 'aria-labelledby') === 'module-3');
    assert.ok(module);
    assert.deepEqual(allNodes(module).filter((node) => node.tagName === 'a' && attr(node, 'href')?.includes('/preprocessing/')).map((node) => attr(node, 'href')), slugs.map((slug) => `/ml-dl-course-site/textbook/ml/preprocessing/${slug}/`));
    assert.ok(!text(module).includes('В машинном обучении качество предсказаний'));
    const links = spawnSync(process.execPath, ['--experimental-strip-types', path.join(root, 'scripts/check-links.mjs'), path.join(fixture, 'dist')], { cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true });
    assert.equal(links.status, 0, `${links.stdout}\n${links.stderr}`);
  } finally {
    const relative = path.relative(toolsDir, path.resolve(fixture));
    assert.ok(relative.startsWith('migration-build-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});
