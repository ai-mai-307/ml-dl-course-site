import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const audit = JSON.parse(await readFile(new URL('../migration/task-4b-manifest.json', import.meta.url), 'utf8'));
const routes = ['textbook/ml/preprocessing/', ...audit.pages.map((page) => page.route.slice(1))];
const hiddenRoutes = [
  'courses/ml/2026-fall/',
  ...['overview', 'assessment', 'exam', 'assignments/hw-03'].map((page) => 'courses/ml/2026-fall/' + page + '/'),
  'guides/git/', 'guides/authoring-example/',
];
const nodes = (node) => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;

test('production publishes all ten real chapters in the textbook overview and sidebar', async () => {
  assert.equal(routes.length, 10);
  const landingHtml = await readFile(path.join(dist, 'textbook/index.html'), 'utf8');
  assert.doesNotMatch(landingHtml, /Материалы раздела готовятся к публикации/);
  const landing = nodes(parse(landingHtml));
  const sidebar = landing.find((node) => attr(node, 'id') === 'starlight__sidebar');
  const overview = landing.find((node) => attr(node, 'class')?.split(' ').includes('sl-markdown-content'));
  assert.ok(sidebar && overview);
  const links = (node) => nodes(node).filter((n) => n.tagName === 'a').map((n) => attr(n, 'href'));
  for (const route of routes) {
    const href = '/ml-dl-course-site/' + route;
    assert.ok(links(sidebar).includes(href), 'Missing sidebar chapter: ' + route);
    assert.ok(links(overview).includes(href), 'Missing overview chapter: ' + route);
    const html = await readFile(path.join(dist, route, 'index.html'), 'utf8');
    const elements = nodes(parse(html));
    assert.equal(elements.filter((n) => n.tagName === 'h1').length, 1, route);
    assert.ok(!elements.some((n) => attr(n, 'class')?.split(' ').includes('draft-banner')), route);
    assert.ok(elements.some((n) => n.tagName === 'h2'), 'Empty chapter: ' + route);
  }
});

test('production keeps demo materials out of pages, navigation, lists and sitemap', async () => {
  for (const route of hiddenRoutes) {
    await assert.rejects(stat(path.join(dist, route, 'index.html')), { code: 'ENOENT' });
  }
  async function check(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) await check(filename);
      else if (/\.(html|xml)$/.test(item.name)) {
        const content = await readFile(filename, 'utf8');
        for (const route of hiddenRoutes) {
          // Match a complete URL: the private course's public list is a different route.
          assert.ok(!content.includes('/' + route + '"') && !content.includes('/' + route + '<'),
            filename + ': leaked ' + route);
        }
      }
    }
  }
  await check(dist);
});
