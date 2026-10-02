import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml, mdxToJs } from 'satteri';
import { parseFragment } from 'parse5';
import { obsidianCallouts } from '../src/plugins/obsidian-callouts.ts';
import { math } from '../src/plugins/math.ts';

const options = { features: { math: true, rawHtml: true }, mdastPlugins: [obsidianCallouts, math] };
const render = async (source) => (await markdownToHtml(source, options)).html;
function elements(html, tag) {
  const found = [];
  function walk(node) {
    if (node.tagName === tag) found.push(node);
    node.childNodes?.forEach(walk);
  }
  walk(parseFragment(html));
  return found;
}
const attr = (node, name) => node.attrs.find((item) => item.name === name)?.value;

test('callout keeps a formatted title, immediate body, links, lists, and local images', async () => {
  const html = await render('> [!NOTE] **Заголовок** и $n=3$\n> Текст [ссылки](../)\n>\n> - пункт\n>\n> ![Схема](./assets/diagram.svg)');
  assert.equal(elements(html, 'aside').length, 1);
  assert.match(html, /<strong>Заголовок<\/strong>/);
  assert.equal(elements(html, 'math').length, 1);
  assert.match(html, /<p>Текст /);
  assert.equal(attr(elements(html, 'a')[0], 'href'), '../');
  assert.equal(elements(html, 'li').length, 1);
  assert.equal(attr(elements(html, 'img')[0], 'src'), './assets/diagram.svg');
});

test('default titles, aliases, case, and unknown callout types', async () => {
  for (const [type, title, variant] of [
    ['NOTE', 'Заметка', 'note'], ['hInT', 'Совет', 'tip'],
    ['WARNING', 'Предупреждение', 'caution'], ['BUG', 'Ошибка', 'danger'],
    ['CITE', 'Цитата', 'quote'], ['custom-kind', 'custom-kind', 'note'],
    ['constructor', 'constructor', 'note'],
  ]) {
    const html = await render(`> [!${type}]\n> Тело`);
    assert.match(html, new RegExp(`>${title}</p>`));
    assert.match(attr(elements(html, 'aside')[0], 'class'), new RegExp(`obsidian-callout--${variant}`));
    assert.match(html, /<p>Тело<\/p>/);
  }
});

test('native disclosure defaults and nested callouts', async () => {
  for (const [sign, open] of [['+', true], ['-', false]]) {
    const html = await render(`> [!TIP]${sign} Заголовок\n> Текст\n>\n> > [!WARNING]\n> > Вложенное замечание`);
    const details = elements(html, 'details');
    assert.equal(details.length, 1);
    assert.equal(attr(details[0], 'open') !== undefined, open);
    assert.equal(elements(html, 'summary').length, 1);
    assert.equal(elements(html, 'aside').length, 1);
    assert.match(html, /Вложенное замечание/);
  }
});

test('ordinary quotes, escaped markers, and fenced or inline code stay literal', async () => {
  const html = await render('> Обычная цитата\n\n> \\[!NOTE]\n> Буквальная запись\n\n`$x$`\n\n```md\n> [!NOTE]\n$$\nx\n$$\n```');
  assert.equal(elements(html, 'blockquote').length, 2);
  assert.equal(elements(html, 'aside').length, 0);
  assert.equal(elements(html, 'math').length, 0);
  assert.equal(elements(html, 'code').length, 2);
  assert.match(html, /\$x\$/);
});

test('inline and block math produce static HTML and accessible MathML', async () => {
  const inline = await render('До $a^2$ после.');
  assert.equal(elements(inline, 'p').length, 1, 'inline math must not split its paragraph');
  assert.match(inline, /^<p>До <span class="katex">/);
  assert.match(inline.trim(), /<\/span> после\.<\/p>$/);
  const html = await render('Текст $a^2$\n\n$$\n\\frac{1}{n}\\sum_{i=1}^n x_i\n$$');
  assert.equal(elements(html, 'math').length, 2);
  assert.match(html, /katex-display/);
  assert.match(html, /katex-html/);
  assert.match(html, /katex-mathml/);
  assert.equal(elements(html, 'script').length, 0);
  await assert.rejects(render('$\\unknownAuthoringCommand{x}$'), /Undefined control sequence/);
});

test('GFM tables and footnotes remain available', async () => {
  const html = await render('| A | B |\n| - | - |\n| 1 | 2 |\n\nСноска[^one]\n\n[^one]: Пояснение.');
  assert.equal(elements(html, 'table').length, 1);
  assert.match(html, /Пояснение/);
  assert.match(html, /data-footnote-ref/);
});

test('the same plugins compile in MDX without requiring MDX for ordinary content', async () => {
  const result = await mdxToJs('> [!NOTE]\n> Формула $x^2$\n\n<div>MDX</div>', options);
  assert.match(result.code, /obsidian-callout/);
  assert.match(result.code, /katex/);
});
