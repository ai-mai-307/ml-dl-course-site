import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
const audit = JSON.parse(await readFile(path.join(root, 'migration/task-4b-manifest.json'), 'utf8'));
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const read = async (file) => (await readFile(path.join(root, file), 'utf8')).replaceAll('\r\n', '\n');
const body = (text) => text.replace(/^---\n[\s\S]*?\n---\n\n/, '');
const nodes = (node) => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((attr) => attr.name === name)?.value;

test('baseline covers exactly nine lectures and preserves all content outside recorded mechanical edits', async () => {
  assert.equal(audit.pages.length, 9);
  assert.deepEqual(audit.pages.map((p) => p.source), [
    'docs/ml/lecture_01.md', 'docs/ml/lecture_03.md', 'docs/ml/lecture_04.md', 'docs/ml/lecture_05.md',
    'docs/dl/lecture_01.md', 'docs/dl/lecture_02.md', 'docs/dl/lecture_03.md', 'docs/dl/lecture_04.md', 'docs/dl/lecture_05.md',
  ]);
  const allowed = new Set(['title-to-frontmatter', 'secondary-h1-to-h2', 'admonition-to-callout', 'local-image', 'external-link-protocol', 'math-syntax-compatibility']);
  for (const page of audit.pages) {
    assert.equal(hash(await readFile(path.join(root, page.source))), page.sourceSha256);
    let expected = await read(page.source);
    for (const edit of page.edits) {
      assert.ok(allowed.has(edit.kind), edit.kind);
      assert.ok(expected.includes(edit.before), page.source + ': missing recorded source');
      expected = expected.replace(edit.before, () => edit.after);
    }
    const actual = await read(page.target);
    assert.equal(body(actual), expected, page.source);
    assert.match(actual, /\ndraft: false\n/);
    assert.match(actual, /\ncontentKind: textbook\n/);
    assert.doesNotMatch(actual.split('\n---\n')[0], /\n(?:courseId|termId):/);
    assert.doesNotMatch(body(actual), /^!!!|^\?\?\?/m);
    assert.deepEqual([...body(actual).matchAll(/^#{2,6} (.+)$/gm)].map((m) => m[1]),
      [...expected.matchAll(/^#{2,6} (.+)$/gm)].map((m) => m[1]));
  }
});

test('baseline copies exactly the referenced assets and preserves all GIF bytes', async () => {
  assert.equal(audit.assets.length, 58);
  assert.equal(audit.assets.filter((a) => a.oldPath.endsWith('.gif')).length, 3);
  for (const page of audit.pages) {
    const referenced = [...(await read(page.source)).matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
      .map((m) => path.posix.normalize(path.posix.dirname(page.source) + '/' + m[1]));
    assert.deepEqual(audit.assets.filter((a) => a.source === page.source).map((a) => a.oldPath), referenced);
  }
  for (const asset of audit.assets) {
    const original = await readFile(path.join(root, asset.oldPath));
    assert.equal(hash(original), asset.sha256);
    assert.deepEqual(await readFile(path.join(root, asset.newPath)), original);
    assert.equal(path.basename(asset.newPath), path.basename(asset.oldPath));
  }
});

test('all nine baseline route mappings remain unchanged', async () => {
  const routes = await read('migration/route-map.csv');
  for (const page of audit.pages) {
    const oldRoute = '/' + page.source.slice(5, -3) + '/';
    const matching = routes.split('\n').filter((row) => row.startsWith('"' + oldRoute + '"'));
    assert.equal(matching.length, 1);
    assert.ok(matching[0].includes('"' + page.route + '","primary-redirect-target","migrated-published"'));
  }
});

test('all published baseline chapters compile, render and pass link checks in an isolated copy', { timeout: 180000 }, async () => {
  await mkdir(toolsDir, { recursive: true });
  const fixture = await mkdtemp(path.join(toolsDir, 'baseline-build-test-'));
  try {
    for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
    }
    for (const file of [...audit.pages.map((p) => p.target), 'src/content/docs/textbook/ml/preprocessing/index.md']) {
      assert.match(await read(file), /\ndraft: false\n/);
    }
    const astroPackageUrl = new URL(import.meta.resolve('astro/package.json'));
    const astroPackage = JSON.parse(await readFile(astroPackageUrl, 'utf8'));
    const cli = fileURLToPath(new URL(astroPackage.bin.astro, astroPackageUrl));
    const build = spawnSync(process.execPath, [cli, 'build'], {
      cwd: fixture, encoding: 'utf8', timeout: 90000, windowsHide: true,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    assert.equal(build.status, 0, (build.error ?? '') + '\n' + build.stdout + '\n' + build.stderr);
    let math = 0;
    let images = 0;
    let callouts = 0;
    let tables = 0;
    let gifs = 0;
    for (const page of audit.pages) {
      const html = await readFile(path.join(fixture, 'dist', page.route, 'index.html'), 'utf8');
      const elements = nodes(parse(html));
      const content = elements.find((n) => attr(n, 'class')?.split(' ').includes('sl-markdown-content'));
      assert.ok(content, page.route);
      const renderedHeadings = nodes(content).filter((n) => /^h[2-6]$/.test(n.tagName ?? ''));
      const sourceHeadings = [...body(await read(page.target)).matchAll(/^#{2,6} /gm)];
      assert.equal(renderedHeadings.length, sourceHeadings.length, page.route + ': incomplete chapter rendering');
      assert.equal(elements.filter((n) => n.tagName === 'h1').length, 1, page.route);
      assert.equal(elements.filter((n) => n.tagName === 'img').length, page.images, page.route + ': ' + elements.filter((n) => n.tagName === 'img').map((n) => attr(n, 'src')).join(', '));
      math += elements.filter((n) => n.tagName === 'math').length;
      images += elements.filter((n) => n.tagName === 'img').length;
      callouts += elements.filter((n) => attr(n, 'data-callout')).length;
      tables += elements.filter((n) => n.tagName === 'table').length;
      for (const image of elements.filter((n) => n.tagName === 'img')) {
        const src = attr(image, 'src');
        assert.ok(src.startsWith('/ml-dl-course-site/'));
        assert.ok((await stat(path.join(fixture, 'dist', decodeURIComponent(src.slice('/ml-dl-course-site/'.length))))).isFile());
        if (src.endsWith('.gif')) {
          gifs++;
          const original = audit.assets.find((a) => a.oldPath.endsWith('.gif') && src.includes(path.basename(a.oldPath, '.gif') + '.'));
          assert.ok(original, src);
          assert.deepEqual(await readFile(path.join(fixture, 'dist', src.slice('/ml-dl-course-site/'.length))), await readFile(path.join(root, original.oldPath)));
        }
        assert.ok(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0);
      }
    }
    assert.equal(images, 58);
    assert.equal(gifs, 3);
    assert.ok(math > 100, 'math output must be present across the real chapters');
    assert.equal(callouts, 11);
    assert.ok(tables >= 1);
    const landing = nodes(parse(await readFile(path.join(fixture, 'dist/textbook/index.html'), 'utf8')));
    const textContent = (n) => (n.value ?? '') + (n.childNodes ?? []).map(textContent).join('');
    const sidebarGroups = landing.filter(n => n.tagName === 'summary').map(textContent);
    assert.ok(sidebarGroups.includes('Машинное обучение'));
    assert.ok(sidebarGroups.includes('Глубокое обучение'));
    assert.ok(!sidebarGroups.includes('Предварительная обработка данных'), 'preprocessing is now a single link, not a group');
    assert.ok(!sidebarGroups.some(label => /introduction|linear-models|scaling|neural-network-foundations/.test(label)));
    const chapterLinks = landing.filter((n) => n.tagName === 'a' && attr(n, 'href')?.startsWith('/ml-dl-course-site/textbook/'));
    for (const page of audit.pages) assert.ok(chapterLinks.some((n) => attr(n, 'href') === '/ml-dl-course-site' + page.route), page.route);
    const check = spawnSync(process.execPath, ['--experimental-strip-types', path.join(root, 'scripts/check-links.mjs'), path.join(fixture, 'dist')], {
      cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true,
    });
    assert.equal(check.status, 0, check.stdout + '\n' + check.stderr);
    console.log('Baseline review copy: ' + math + ' MathML formulas, ' + images + ' images, ' + callouts + ' callouts, ' + tables + ' tables. ' + check.stdout.trim());
  } finally {
    const relative = path.relative(toolsDir, path.resolve(fixture));
    assert.ok(relative.startsWith('baseline-build-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});
