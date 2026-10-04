import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { parse } from 'parse5';
import config from '../astro.config.mjs';
import { legacyRoutes } from '../src/utils/legacy-routes.mjs';

const dist = new URL('../dist/', import.meta.url);
const base = config.base.replace(/\/$/, '') + '/';
const origin = config.site;
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find(a => a.name === key)?.value;
const read = async route => parse(await readFile(new URL(route.replace(/^\//, '') + (route.endsWith('/') ? 'index.html' : ''), dist), 'utf8'));

test('every mapped route emits a static redirect to an existing destination with exactly one site base', async () => {
  assert.equal(config.output, 'static');
  assert.equal(config.trailingSlash, 'always');
  assert.equal(origin, 'https://ai-mai-307.github.io');
  assert.equal(base, '/ml-dl-course-site/');
  assert.ok(legacyRoutes.some(r => r.relationship === 'primary-redirect-target'));
  assert.ok(legacyRoutes.some(r => r.relationship === 'archive-fallback'));
  for (const { from, to } of legacyRoutes) {
    const elements = nodes(await read(from));
    const expected = new URL(base + to.slice(1), origin).href;
    const refresh = elements.find(n => n.tagName === 'meta' && attr(n, 'http-equiv')?.toLowerCase() === 'refresh');
    assert.ok(refresh, 'No meta refresh: ' + from);
    const target = attr(refresh, 'content').match(/^\s*\d+\s*;\s*url=(.+)$/i)?.[1];
    assert.ok(target, 'Invalid refresh: ' + from);
    assert.equal(new URL(target, new URL(base + from.slice(1), origin)).href, expected);
    assert.equal(attr(elements.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical'), 'href'), expected);
    assert.ok(elements.some(n => n.tagName === 'a' && new URL(attr(n, 'href'), origin).href === expected), 'Missing non-JS link: ' + from);
    assert.ok((await stat(new URL(to.slice(1) + 'index.html', dist))).isFile());
    assert.ok(!legacyRoutes.some(r => r.from === to), 'Redirect chains are not allowed');
  }
});

test('archive notice and production 404 provide safe base-prefixed exits', async () => {
  for (const route of ['/archive/', '/404.html']) {
    const elements = nodes(await read(route));
    assert.equal(elements.filter(n => n.tagName === 'h1').length, 1);
    for (const target of ['', 'textbook/', 'courses/']) {
      assert.ok(elements.some(n => n.tagName === 'a' && new URL(attr(n, 'href'), new URL(base + route.slice(1), origin)).pathname === base + target), route + ': missing ' + target);
    }
    const sidebar = elements.find(n => attr(n, 'id') === 'starlight__sidebar');
    assert.ok(!sidebar || !nodes(sidebar).some(n => n.tagName === 'a' && attr(n, 'href') === base + 'archive/'));
  }
});
