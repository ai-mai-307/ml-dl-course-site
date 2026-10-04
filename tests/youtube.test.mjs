import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml, mdxToJs } from 'satteri';
import { parseFragment } from 'parse5';
import { youtubePreviews, parseYouTubeUrl } from '../src/plugins/youtube.ts';
import { obsidianCallouts } from '../src/plugins/obsidian-callouts.ts';

const base = '/ml-dl-course-site';
const options = { features: { rawHtml: true }, mdastPlugins: [youtubePreviews(base), obsidianCallouts] };
const render = async (source) => (await markdownToHtml(source, options)).html;
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
const elements = (html, name) => nodes(parseFragment(html)).filter((n) => n.tagName === name);
const id = 'M7lc1UVf-VE';

test('YouTube video URLs are restricted to HTTPS watch and short links, preserving the source link', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=' + id,
    'https://youtube.com/watch?v=' + id + '&t=30',
    'https://m.youtube.com/watch?v=' + id,
    'https://youtu.be/' + id + '?si=share',
    'https://youtu.be/' + id + '/',
  ]) assert.deepEqual(parseYouTubeUrl(url), { id, href: url });
  for (const url of ['not a URL', 'https://youtu.be/VIDEO_ID', 'https://www.youtube.com/watch',
    'http://youtu.be/' + id, 'javascript:alert(1)', 'https://youtube.com.evil.invalid/watch?v=' + id,
    'https://youtube.com@evil.invalid/watch?v=' + id, 'https://user@youtu.be/' + id,
    'https://youtu.be:444/' + id, 'https://youtu.be/' + id + '/extra',
    'https://www.youtube.com/embed/' + id, 'https://www.youtube.com/watch?v=' + id + '&v=' + id,
    'https://www.youtube.com/watch?v=bad%22id',
  ]) assert.equal(parseYouTubeUrl(url), undefined, url);
});

test('valid callouts generate a lazy thumbnail, native keyboard button and conditional module, never an iframe', async () => {
  for (const url of ['https://www.youtube.com/watch?v=' + id, 'https://youtu.be/' + id]) {
    const html = await render('> [!YOUTUBE] Подпись\n> ' + url);
    assert.equal(elements(html, 'youtube-preview').length, 1);
    const button = elements(html, 'button')[0];
    assert.equal(attr(button, 'type'), 'button');
    assert.equal(attr(button, 'aria-label'), 'Воспроизвести: Подпись');
    assert.equal(attr(button, 'disabled'), '');
    const img = elements(html, 'img')[0];
    assert.equal(attr(img, 'loading'), 'lazy');
    assert.equal(attr(img, 'src'), 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg');
    assert.equal(elements(html, 'iframe').length, 0);
    assert.equal(attr(elements(html, 'a')[0], 'href'), url);
    assert.equal(attr(elements(html, 'script')[0], 'src'), base + '/scripts/youtube-preview.js');
    assert.equal(attr(elements(html, 'script')[0], 'type'), 'module');
  }
  const rootHtml = (await markdownToHtml('> [!YOUTUBE]\n> https://youtu.be/' + id, { ...options, mdastPlugins: [youtubePreviews('/'), obsidianCallouts] })).html;
  assert.equal(attr(elements(rootHtml, 'script')[0], 'src'), '/scripts/youtube-preview.js');
});

test('Obsidian/Markdown link bodies use their href; titles are text and HTML-escaped', async () => {
  const html = await render('> [!youtube]\n> [Название & описание](https://youtu.be/' + id + '?si=abc)');
  assert.equal(attr(elements(html, 'youtube-preview')[0], 'data-title'), 'Название & описание');
  const authorLink = await render('> [!YOUTUBE]\n> [https://www.youtube.com/watch?v=VIDEO_ID](https://youtu.be/' + id + ')');
  assert.equal(attr(elements(authorLink, 'youtube-preview')[0], 'data-video-id'), id);
  assert.equal(attr(elements(authorLink, 'youtube-preview')[0], 'data-title'), 'Видео на YouTube');
  const escaped = await render('> [!YOUTUBE] **<script>alert(1)</script>**\n> https://youtu.be/' + id);
  assert.equal(elements(escaped, 'script').length, 1, 'only the local module, never caption HTML');
  assert.ok(escaped.includes('&lt;script&gt;'));
});

test('invalid or ambiguous blocks preserve their content as normal callouts; ordinary/escaped/fenced syntax is unchanged', async () => {
  for (const source of [
    '> [!YOUTUBE]\n> https://example.com/watch?v=' + id,
    '> [!YOUTUBE]\n> https://youtu.be/VIDEO_ID',
    '> [!YOUTUBE]\n> https://youtu.be/' + id + '\n> Additional text',
    '> [!YOUTUBE]\n> https://youtu.be/' + id + '\n>\n> Another paragraph.',
    '> [!YOUTUBE]\n> https://youtu.be/' + id + ' https://youtu.be/' + id,
  ]) {
    const html = await render(source);
    assert.equal(elements(html, 'youtube-preview').length, 0);
    assert.equal(elements(html, 'script').length, 0);
    assert.equal(elements(html, 'aside').length, 1);
    assert.ok(elements(html, 'a').length > 0);
  }
  const html = await render('> [!WARNING]\n> Warning body.\n\n> \\[!YOUTUBE]\n> https://youtu.be/' + id + '\n\n\x60\x60\x60md\n> [!YOUTUBE]\n> https://youtu.be/' + id + '\n\x60\x60\x60');
  assert.equal(elements(html, 'youtube-preview').length, 0);
  assert.equal(elements(html, 'script').length, 0);
  assert.ok(html.includes('Warning body.'));
});

test('the transform also compiles in MDX without requiring it for ordinary authoring', async () => {
  const result = await mdxToJs('> [!YOUTUBE]\n> https://youtu.be/' + id, options);
  assert.match(result.code, /youtube-preview/);
});
