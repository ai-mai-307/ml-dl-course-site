import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';

const dist = new URL('../dist/', import.meta.url);
const sections = [['textbook', 'Учебник'], ['courses', 'Курсы'], ['guides', 'Инструкции'], ['notes', 'Заметки'], ['about', 'Обо мне']];
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
const text = (n) => n.value ?? (n.childNodes ?? []).map(text).join('');
const hasClass = (n, name) => attr(n, 'class')?.split(' ').includes(name);
const load = async (route) => parse(await readFile(new URL(route + 'index.html', dist), 'utf8'));

test('production home presents the five public sections without the opening-soon message', async () => {
  const page = await load('');
  assert.equal(text(nodes(page).find((n) => n.tagName === 'h1')), 'Машинное и глубокое обучение');
  assert.match(text(page), /Учебник, материалы курсов, практические инструкции и авторские заметки\./);
  assert.doesNotMatch(text(page), /Новая версия сайта готовится к открытию|Пример оформления/);
  const nav = nodes(page).find((n) => n.tagName === 'nav' && attr(n, 'aria-label') === 'Разделы сайта');
  assert.ok(nav);
  assert.deepEqual(nodes(nav).filter((n) => n.tagName === 'a').map((n) => [attr(n, 'href'), text(n)]), sections.map(([route, label]) => ['/ml-dl-course-site/' + route + '/', label]));
});

test('all public section pages share exactly five top-level navigation entries', async () => {
  for (const [route] of sections) {
    const page = await load(route + '/');
    const sidebar = nodes(page).find((n) => attr(n, 'id') === 'starlight__sidebar');
    const top = nodes(sidebar).find((n) => n.tagName === 'ul' && hasClass(n, 'top-level'));
    const labels = top.childNodes.filter((n) => n.tagName === 'li').map((li) => {
      const entry = li.childNodes.find((n) => n.tagName);
      return text(entry.tagName === 'details' ? entry.childNodes.find((n) => n.tagName === 'summary') : entry).trim();
    });
    assert.deepEqual(labels, sections.map(([, label]) => label), route);
    assert.doesNotMatch(text(sidebar), /Пример оформления|демонстра/i);
    assert.ok(nodes(sidebar).some((n) => n.tagName === 'a' && attr(n, 'href') === '/ml-dl-course-site/about/'));
    if (route === 'notes' || route === 'about') {
      const pagination = nodes(page).find((n) => hasClass(n, 'pagination-links'));
      assert.ok(!pagination || !nodes(pagination).some((n) => n.tagName === 'a'));
    }
  }
});

test('production Notes has an honest empty state and About remains an editable public reference page', async () => {
  const notes = nodes(await load('notes/')).find((n) => hasClass(n, 'sl-markdown-content'));
  assert.match(text(notes), /Заметок пока нет\./);
  assert.match(text(notes), /Здесь будут появляться авторские статьи и короткие заметки\./);
  assert.ok(!nodes(notes).some((n) => n.tagName === 'article' || n.tagName === 'ul'));
  const about = nodes(await load('about/')).find((n) => hasClass(n, 'sl-markdown-content'));
  const first = about.childNodes.find((n) => n.tagName);
  assert.equal(attr(first, 'data-callout'), 'warning');
  assert.ok(text(first).includes('Раздел обновляется.'));
  assert.ok(text(first).includes('Здесь будет информация об авторе сайта, преподавании и других проектах.'));
  const source = await readFile(new URL('../src/content/docs/about/index.md', import.meta.url), 'utf8');
  assert.match(source, /\ncontentKind: reference\n/);
  assert.match(source, /\ndraft: false\n/);
});
