import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';

const output = new URL('../dist/', import.meta.url);
const audit = JSON.parse(await readFile(new URL('../migration/task-6b-manifest.json', import.meta.url), 'utf8'));
const nodes = (node) => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');
const readPage = async (route) => nodes(parse(await readFile(new URL(route.slice(1) + 'index.html', output), 'utf8')));

test('published guide pages start with the archive warning and render every image and source danger', async () => {
  for (const page of audit.pages) {
    const all = await readPage(page.route);
    assert.equal(all.filter((n) => n.tagName === 'h1').length, 1, page.route);
    const content = all.find((n) => attr(n, 'class')?.split(' ').includes('sl-markdown-content'));
    const first = content.childNodes.find((n) => n.tagName);
    assert.equal(attr(first, 'data-callout'), 'warning', page.route);
    assert.match(text(first), /осенний семестр 2026 года/);
    assert.match(text(first), page.route.includes('github-classroom') ? /Архивная инструкция/ : /Инструкция требует обновления/);
    if (page.route.endsWith('/budget/')) assert.match(text(first), /сейчас не является рабочей инструкцией/);
    const images = nodes(content).filter((n) => n.tagName === 'img');
    assert.equal(images.length, page.assets.length, page.route);
    for (const image of images) {
      const src = attr(image, 'src');
      assert.ok(src.startsWith('/ml-dl-course-site/_astro/'));
      assert.ok(attr(image, 'alt'));
      assert.ok(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0);
      assert.ok((await stat(new URL(src.slice('/ml-dl-course-site/'.length), output))).isFile());
    }
    if (/commit-and-push|budget/.test(page.route)) {
      assert.ok(nodes(content).some((n) => attr(n, 'data-callout') === 'danger'));
      assert.match(text(content), page.route.endsWith('/budget/') ? /Проблемы при просмотре биллинга/ : /Не сохраняйте файлы более 100 мб/);
    }
    if (page.route.includes('clone-repository')) assert.ok(all.some((n) => attr(n, 'href') === 'https://t.me/c/3075180202/7/308'));
  }
});

test('guide overview and production sidebar link to every published archived guide', async () => {
  const all = await readPage('/guides/');
  const sidebar = all.find((n) => attr(n, 'id') === 'starlight__sidebar');
  const content = all.find((n) => attr(n, 'class')?.split(' ').includes('sl-markdown-content'));
  for (const page of audit.pages) {
    for (const section of [sidebar, content]) assert.ok(nodes(section).some((n) => n.tagName === 'a' && new URL(attr(n, 'href') ?? '', 'https://example.invalid/ml-dl-course-site/guides/').pathname === '/ml-dl-course-site' + page.route), page.route);
  }
});
