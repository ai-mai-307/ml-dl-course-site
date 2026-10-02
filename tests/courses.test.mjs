import assert from 'node:assert/strict';
import test from 'node:test';
import { courseUrl, resolveCourse, roleLabels, pageRoleLabels, termLabel } from '../src/utils/courses.ts';

const reference = (id, role = 'theory', label) => ({ type: 'doc', role, doc: { collection: 'docs', id }, label });
const module = (title, resources = [], options = {}) => ({ title, resources, published: true, ...options });
const coursePage = (role, id, label) => ({ role, doc: { collection: 'docs', id }, label });
const course = (modules, pages = []) => ({ id: 'ml/2026-fall', collection: 'courses', data: {
  courseId: 'ml', termId: '2026-fall', title: 'Пример', description: 'Маршрут', status: 'draft', modules, pages,
} });
const document = (id, draft = false) => ({ id, collection: 'docs', data: { title: 'Заголовок документа', draft }, body: 'CANONICAL_BODY_NOT_FOR_COURSE_PAGE' });
const base = '/ml-dl-course-site/';

test('one module resolves several textbook pages without copying their bodies', async () => {
  const received = [];
  const result = await resolveCourse(course([module('Тема', [
    reference('textbook/chapter-8'), reference('textbook/chapter-2'), reference('guides/git', 'guide', 'Своя подпись'),
  ])]), async (ref) => { received.push(ref); return document(ref.id); }, base);
  assert.deepEqual(received, ['textbook/chapter-8', 'textbook/chapter-2', 'guides/git'].map((id) => ({ collection: 'docs', id })));
  const theory = result.modules[0].groups[0].resources;
  assert.equal(result.modules[0].label, '1');
  assert.equal(theory.length, 2);
  assert.equal(theory[0].label, 'Заголовок документа');
  assert.deepEqual(theory.map((item) => item.href), [`${base}textbook/chapter-8/`, `${base}textbook/chapter-2/`]);
  assert.equal(result.modules[0].groups[1].resources[0].label, 'Своя подпись');
  assert.ok(!JSON.stringify(result).includes('CANONICAL_BODY_NOT_FOR_COURSE_PAGE'));
});

test('module numbering follows manifest positions and resource order within each role follows YAML', async () => {
  const resources = Object.keys(roleLabels).map((role) => ({ type: 'link', role, label: role, href: `https://example.com/#${role}` }));
  resources.push({ type: 'link', role: 'theory', label: 'second theory', href: 'https://example.com/#second' });
  const input = [module('Поздняя глава', resources), module('Скрытый', [], { published: false }), module('Ранняя глава')];
  const result = await resolveCourse(course(input), async () => undefined, base);
  assert.deepEqual(result.modules.map((item) => [item.position, item.label, item.title]), [[1, '1', 'Поздняя глава'], [3, '3', 'Ранняя глава']]);
  assert.equal(result.modules[0].groups.length, 9);
  assert.deepEqual(result.modules[0].groups[0].resources.map((item) => item.label), ['theory', 'second theory']);
  const reordered = await resolveCourse(course([input[2], input[0]]), async () => undefined, base);
  assert.deepEqual(reordered.modules.map((item) => [item.label, item.title]), [['1', 'Ранняя глава'], ['2', 'Поздняя глава']]);
});

test('optional custom labels do not change positions or numbering of following modules', async () => {
  const result = await resolveCourse(course([
    module('Первый', [], { label: 'Приложение' }), module('Второй'), module('Третий', [], { label: 'Приложение' }),
  ]), async () => undefined, base);
  assert.deepEqual(result.modules.map((item) => [item.position, item.label]), [[1, 'Приложение'], [2, '2'], [3, 'Приложение']]);
});

test('all course page roles resolve typed references separately from modules in manifest order', async () => {
  const pages = Object.keys(pageRoleLabels).map((role) => coursePage(role, `courses/ml/2026-fall/${role}`));
  pages[1].label = 'Особая подпись';
  const result = await resolveCourse(course([module('Тема')], pages), async (ref) => document(ref.id), base);
  assert.deepEqual(result.pages.map((page) => page.role), Object.keys(pageRoleLabels));
  assert.equal(result.pages[0].label, 'Заголовок документа');
  assert.equal(result.pages[1].label, 'Особая подпись');
  assert.equal(result.pages[0].href, `${base}courses/ml/2026-fall/overview/`);
  assert.equal(result.modules[0].label, '1');
  assert.deepEqual(result.modules[0].groups, []);
  assert.ok(!JSON.stringify(result).includes('CANONICAL_BODY_NOT_FOR_COURSE_PAGE'));
});

test('missing references fail with manifest/module position, including unpublished modules', async () => {
  for (const published of [true, false]) {
    await assert.rejects(
      resolveCourse(course([module('Тема', [reference('textbook/missing')], { published, label: 'Не номер' })]), async () => undefined, base),
      /Course manifest "ml\/2026-fall", module 1: missing docs reference "textbook\/missing"/,
    );
  }
});

test('missing organizational pages fail with manifest, page position, and role', async () => {
  await assert.rejects(
    resolveCourse(course([], [coursePage('exam', 'courses/missing-exam')]), async () => undefined, base),
    /Course manifest "ml\/2026-fall", page 1 \(exam\): missing docs reference "courses\/missing-exam"/,
  );
});

test('visible module resources and organizational pages cannot link to draft documents', async () => {
  for (const input of [course([module('Тема', [reference('textbook/draft')])]), course([], [coursePage('policy', 'courses/draft')])]) {
    await assert.rejects(resolveCourse(input, async (ref) => document(ref.id, true), base), /draft and has no production page/);
  }
});

test('development can preview draft documents referenced by course pages and modules', async () => {
  const result = await resolveCourse(
    course([module('Тема', [reference('textbook/draft')])], [coursePage('policy', 'courses/draft')]),
    async (ref) => document(ref.id, true), base, true,
  );
  assert.equal(result.pages[0].href, `${base}courses/draft/`);
  assert.equal(result.modules[0].groups[0].resources[0].href, `${base}textbook/draft/`);
});

test('manifest path must agree with its course and term IDs', async () => {
  await assert.rejects(resolveCourse({ ...course([]), id: 'wrong/path' }, async () => undefined, base), /expected path "ml\/2026-fall.yaml"/);
});

test('document index IDs, URL prefixes, empty courses, and term labels', async () => {
  for (const [id, href] of [['index', base], ['guides/index', `${base}guides/`]]) {
    const result = await resolveCourse(course([module('Тема', [reference(id)])]), async () => document(id), base);
    assert.equal(result.modules[0].groups[0].resources[0].href, href);
  }
  assert.equal(courseUrl(course([]), '/'), '/courses/ml/2026-fall/');
  assert.equal(courseUrl(course([]), base.slice(0, -1)), `${base}courses/ml/2026-fall/`);
  assert.equal(termLabel('2026-fall'), 'Осень 2026');
  const empty = await resolveCourse(course([]), async () => undefined, base);
  assert.deepEqual(empty.modules, []);
  assert.deepEqual(empty.pages, []);
});
