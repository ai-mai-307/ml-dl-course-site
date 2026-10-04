import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';
import { markdownToHtml } from 'satteri';
import { textbookGroups } from '../src/utils/textbook.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const base = '/ml-dl-course-site/';
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
const text = (n) => n.value ?? (n.childNodes ?? []).map(text).join('');
const content = (n) => nodes(n).find((e) => attr(e, 'class')?.split(' ').includes('sl-markdown-content'));
const readPage = async (route) => parse(await readFile(path.join(dist, route, 'index.html'), 'utf8'));
const links = (n) => nodes(n).filter((e) => e.tagName === 'a').map((e) => attr(e, 'href'));

// Product routes and current source, not an inventory of historical source bytes.
const chapters = textbookGroups.flatMap((g) => g.chapters);
test('published textbook chapters are reachable in the overview and sidebar', async () => {
  const landing = await readPage('textbook');
  const sidebar = nodes(landing).find((n) => attr(n, 'id') === 'starlight__sidebar');
  for (const chapter of chapters) {
    assert.ok(links(sidebar).includes(base + chapter.id + '/'), chapter.id);
    assert.ok(links(content(landing)).includes(base + chapter.id + '/'), chapter.id);
    const page = await readPage(chapter.id);
    assert.equal(nodes(page).filter((n) => n.tagName === 'h1').length, 1, chapter.id);
    assert.ok(nodes(content(page)).some((n) => n.tagName === 'h2'), chapter.id);
    assert.ok(!nodes(page).some((n) => attr(n, 'class')?.includes('draft-banner')));
  }
  const groups = nodes(sidebar).filter((n) => n.tagName === 'summary').map(text);
  for (const group of textbookGroups) assert.ok(groups.includes(group.label));
  assert.ok(!groups.includes('Предварительная обработка данных'), 'single-page chapters are links, not redundant groups');
});

test('current textbook images are emitted with dimensions; GIF animation bytes survive optimization', async () => {
  for (const chapter of chapters) {
    const sourceFile = path.join(root, 'src/content/docs', chapter.id, 'index.md');
    const source = await readFile(sourceFile, 'utf8');
    const sourceImages = nodes(parse((await markdownToHtml(source)).html)).filter((n) => n.tagName === 'img');
    const images = nodes(content(await readPage(chapter.id))).filter((n) => n.tagName === 'img');
    assert.equal(images.length, sourceImages.length, chapter.id);
    for (const [i, image] of images.entries()) {
      const src = attr(image, 'src');
      if (/^https?:/.test(src)) continue;
      assert.ok(src.startsWith(base), src);
      const output = path.join(dist, decodeURIComponent(src.slice(base.length)));
      assert.ok((await stat(output)).isFile(), src);
      assert.ok(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0, src);
      const original = attr(sourceImages[i], 'src');
      if (original.endsWith('.gif')) {
        assert.ok(src.endsWith('.gif'));
        assert.deepEqual(await readFile(output), await readFile(path.resolve(path.dirname(sourceFile), original)));
      }
    }
  }
});

test('textbook math and code render without freezing editable content to old snapshots', async () => {
  let formulaCount = 0;
  for (const chapter of chapters) {
    const page = content(await readPage(chapter.id));
    const elements = nodes(page);
    assert.ok(!elements.some((n) => attr(n, 'class')?.includes('katex-error')), chapter.id);
    formulaCount += elements.filter((n) => n.tagName === 'math').length;
    const source = (await readFile(path.join(root, 'src/content/docs', chapter.id, 'index.md'), 'utf8')).replaceAll('\r\n', '\n');
    const fences = [...source.matchAll(/^(\x60{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1[ \t]*$/gm)];
    const blocks = elements.filter((n) => n.tagName === 'pre');
    assert.equal(blocks.length, fences.length, chapter.id);
    for (const [i, block] of blocks.entries()) {
      const language = fences[i][2].trim();
      const expected = fences[i][3].trimEnd();
      const actual = nodes(block).filter((n) => attr(n, 'class') === 'ec-line').map((n) => text(n).replace(/\n$/, '')).join('\n').trimEnd();
      assert.equal(actual, expected, chapter.id);
      if (language) assert.equal(attr(block, 'data-language'), language);
      if (language === 'python') {
        const styles = nodes(block).filter((n) => n.tagName === 'span').map((n) => attr(n, 'style') ?? '');
        assert.ok(styles.some((s) => s.includes('--0:') && s.includes('--1:')));
      }
    }
    const copy = elements.filter((n) => n.tagName === 'button' && attr(n, 'data-code') !== undefined);
    assert.deepEqual(copy.map((n) => attr(n, 'data-code').replaceAll(String.fromCharCode(127), '\n').trimEnd()), fences.map((f) => f[3].trimEnd()));
  }
  assert.ok(formulaCount > 0, 'textbook must contain accessible MathML');
});

test('development pages and fixtures stay out of production routes, navigation and sitemap', async () => {
  const hidden = ['courses/ml/2026-fall/', 'guides/git/', 'guides/authoring-example/', 'notes/note-1/'];
  for (const route of hidden) await assert.rejects(stat(path.join(dist, route, 'index.html')), { code: 'ENOENT' });
  for (const route of ['migration', 'design', 'site-v2-starter']) await assert.rejects(stat(path.join(dist, route)), { code: 'ENOENT' });
  async function check(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await check(file);
      else if (/\.(html|xml)$/.test(entry.name)) {
        const source = await readFile(file, 'utf8');
        for (const route of hidden) assert.ok(!source.includes('/' + route + '"') && !source.includes('/' + route + '<'), file + ': ' + route);
      }
    }
  }
  await check(dist);
});

test('legacy route map has unique source routes and existing production targets', async () => {
  const csv = await readFile(path.join(root, 'migration/route-map.csv'), 'utf8');
  const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((m) => m[1].replaceAll('""', '"')));
  assert.ok(rows.length > 0);
  assert.equal(new Set(rows.map((r) => r[0])).size, rows.length);
  for (const [from, to] of rows) {
    assert.ok(from.startsWith('/') && to.startsWith('/'));
    assert.ok((await stat(path.join(dist, to, 'index.html'))).isFile(), from + ' -> ' + to);
  }
});
