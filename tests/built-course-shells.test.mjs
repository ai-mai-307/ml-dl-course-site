import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';
import { fallCourses, organizationalRoles, updatingWarning } from './fixtures/course-shells.mjs';

const dist = new URL('../dist/', import.meta.url);
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
const text = (n) => n.value ?? (n.childNodes ?? []).map(text).join('');
const content = (n) => nodes(n).find((e) => attr(e, 'class')?.split(' ').includes('sl-markdown-content'));
const html = async (route) => parse(await readFile(new URL(route + '/index.html', dist), 'utf8'));
const prefix = '/ml-dl-course-site/';

test('public course index lists exactly the three Fall 2026 courses with their audiences and term', async () => {
  const page = content(await html('courses'));
  const links = nodes(page).filter((n) => n.tagName === 'a');
  assert.equal(links.length, 3);
  for (const course of fallCourses) {
    const link = links.find((n) => attr(n, 'href') === prefix + 'courses/' + course.id + '/2026-fall/');
    assert.ok(link, course.id);
    assert.equal(text(link), course.title);
    assert.ok(text(page).includes(course.audience));
  }
  assert.equal((text(page).match(/Осень 2026/g) ?? []).length, 3);
  assert.doesNotMatch(text(page), /демонстра|не опубликован/i);
});

for (const course of fallCourses) {
  test('published course shell and five organizational documents: ' + course.id, async () => {
    const route = 'courses/' + course.id + '/2026-fall';
    const page = await html(route);
    const elements = nodes(page);
    assert.equal(text(elements.find((n) => n.tagName === 'h1')), course.title);
    assert.ok(text(page).includes(course.audience));
    assert.match(text(page), /Идёт обучение/);
    assert.match(text(page), /Осень 2026/);
    assert.match(text(page), /Материалы курса обновляются по ходу осеннего семестра 2026 года/);
    assert.ok(!elements.some((n) => attr(n, 'class')?.includes('draft-banner')));
    const info = elements.find((n) => attr(n, 'aria-labelledby') === 'course-information');
    const curriculum = elements.find((n) => attr(n, 'aria-labelledby') === 'curriculum');
    assert.deepEqual(nodes(info).filter((n) => attr(n, 'data-course-page-role')).map((n) => attr(n, 'data-course-page-role')), organizationalRoles);
    assert.match(text(curriculum), /Модули пока не опубликованы/);
    assert.ok(!nodes(curriculum).some((n) => attr(n, 'class') === 'course-module'));
    for (const role of organizationalRoles) {
      const href = prefix + route + '/' + role + '/';
      assert.ok(nodes(info).some((n) => n.tagName === 'a' && attr(n, 'href') === href));
      const doc = await html(route + '/' + role);
      const first = content(doc).childNodes.find((n) => n.tagName);
      assert.equal(attr(first, 'data-callout'), 'warning');
      assert.ok(text(first).includes('Информация обновляется.'));
      assert.ok(text(first).includes(updatingWarning));
      assert.ok(nodes(doc).some((n) => n.tagName === 'a' && attr(n, 'href') === '../'));
      assert.doesNotMatch(text(content(doc)), /экзамен/i);
    }
  });
}

test('removed demo manifest and exclusive course documents are absent from author content', async () => {
  for (const path of ['courses/ml/2026-fall.yaml', ...['overview', 'assessment', 'exam', 'assignments/hw-03'].map((p) => 'docs/courses/ml/2026-fall/' + p + '.md')]) {
    await assert.rejects(stat(new URL('../src/content/' + path, import.meta.url)), { code: 'ENOENT' });
  }
});
