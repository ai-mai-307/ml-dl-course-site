import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import test, { after } from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import config from '../astro.config.mjs';

// The authoring example is a draft. Verify it using the real production pipeline
// in a disposable copy, without publishing the demonstration on the public site.
const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
await mkdir(toolsDir, { recursive: true });
const fixture = await mkdtemp(path.join(toolsDir, 'authoring-output-test-'));
after(async () => {
  const relative = path.relative(toolsDir, path.resolve(fixture));
  assert.ok(relative.startsWith('authoring-output-test-') && !relative.includes(path.sep));
  await rm(fixture, { recursive: true, force: true });
});
for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
  await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
}
const examplePath = path.join(fixture, 'src/content/docs/guides/authoring-example/index.md');
await writeFile(examplePath, (await readFile(examplePath, 'utf8')).replace('draft: true', 'draft: false'));
const packageUrl = new URL(import.meta.resolve('astro/package.json'));
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'));
const cli = fileURLToPath(new URL(packageJson.bin.astro, packageUrl));
const build = spawnSync(process.execPath, [cli, 'build'], {
  cwd: fixture, encoding: 'utf8', timeout: 90000, windowsHide: true,
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
});
assert.equal(build.status, 0, (build.error ?? '') + '\n' + build.stdout + '\n' + build.stderr);
const output = pathToFileURL(path.join(fixture, 'dist') + path.sep);
const html = await readFile(new URL('guides/authoring-example/index.html', output), 'utf8');
const page = parse(html);
function elements(root, tag) {
  const found = [];
  function walk(node) {
    if (node.tagName === tag) found.push(node);
    node.childNodes?.forEach(walk);
  }
  walk(root);
  return found;
}
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join('');
const base = `${config.base.replace(/\/$/, '')}/`;
function assetUrl(src) {
  assert.ok(src.startsWith(base), `Asset outside site base: ${src}`);
  return new URL(src.slice(base.length), output);
}

test('built Markdown keeps inline math in its paragraph and block math separate', () => {
  const paragraph = elements(page, 'p').find((node) => text(node).startsWith('Формулу можно'));
  assert.ok(paragraph);
  assert.equal(elements(paragraph, 'math').length, 1);
  assert.match(text(paragraph), /Более длинное выражение/);
  assert.equal(elements(page, 'math').filter((node) => attr(node, 'display') === 'block').length, 2);
  assert.equal(elements(page, 'h1').length, 1);
});

test('built callouts, highlighted code, table, and footnote are present', () => {
  assert.ok(elements(page, 'aside').some((node) => attr(node, 'data-callout') === 'note'));
  const disclosure = elements(page, 'details').find((node) => attr(node, 'data-callout') === 'tip');
  assert.ok(disclosure);
  assert.equal(attr(disclosure, 'open'), undefined);
  assert.equal(elements(disclosure, 'summary').length, 1);
  const code = elements(page, 'pre').find((node) => text(node).includes('mean = sum(values)'));
  assert.ok(code);
  assert.ok(elements(code, 'span').some((node) => attr(node, 'style')?.includes('--')));
  assert.equal(elements(page, 'table').length, 1);
  assert.ok(elements(page, 'a').some((node) => attr(node, 'data-footnote-ref') !== undefined));
});

test('page-local image and KaTeX styles/fonts are emitted as local build assets', async () => {
  const image = elements(page, 'img').find((node) => attr(node, 'src')?.includes('authoring-flow.'));
  assert.ok(image);
  assert.ok(attr(image, 'alt'));
  assert.ok((await stat(assetUrl(attr(image, 'src')))).isFile());
  const styles = elements(page, 'link').filter((node) => attr(node, 'rel') === 'stylesheet');
  const css = (await Promise.all(styles.map((node) => readFile(assetUrl(attr(node, 'href')), 'utf8')))).join('\n');
  assert.match(css, /\.katex/);
  assert.match(css, /\.obsidian-callout/);
  const fonts = [...css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)].map((match) => match[1]);
  assert.ok(fonts.length > 0);
  for (const font of fonts) assert.ok((await stat(assetUrl(font))).isFile());
});
