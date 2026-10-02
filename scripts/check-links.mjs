import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import config from '../astro.config.mjs';

// Check the built site without making requests to external resources.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDir = path.resolve(projectRoot, process.argv[2] ?? 'dist');
const base = `/${config.base.split('/').filter(Boolean).join('/')}/`;
const site = new URL(config.site);

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(filename);
    return entry.name.endsWith('.html') ? [filename] : [];
  }));
  return files.flat();
}

function inspect(html) {
  const ids = new Set();
  const links = [];
  function walk(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === 'a' && attrs.name) ids.add(attrs.name);
    for (const name of ['href', 'src']) {
      if (attrs[name]) links.push(attrs[name]);
    }
    for (const child of node.childNodes ?? []) walk(child);
  }
  walk(parse(html));
  return { ids, links };
}

async function exists(filename) {
  try {
    return (await stat(filename)).isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

const files = await htmlFiles(outputDir).catch((error) => {
  if (error.code === 'ENOENT') throw new Error('Build output is missing. Run npm run build first.');
  throw error;
});
if (files.length === 0) throw new Error('No HTML pages found in build output.');

const pages = new Map(await Promise.all(files.map(async (filename) => [
  filename, inspect(await readFile(filename, 'utf8')),
])));
const errors = new Set();
let checked = 0;

for (const [filename, page] of pages) {
  const relative = path.relative(outputDir, filename).split(path.sep).join('/');
  const pageUrl = new URL(base + relative.replace(/(^|\/)index\.html$/, '$1'), site);
  for (const link of page.links) {
    let target;
    try {
      target = new URL(link, pageUrl);
    } catch {
      errors.add(`${relative}: invalid URL ${link}`);
      continue;
    }
    if (!['http:', 'https:'].includes(target.protocol) || target.origin !== site.origin) continue;
    checked++;
    if (!target.pathname.startsWith(base)) {
      errors.add(`${relative}: URL outside configured base ${link}`);
      continue;
    }
    const relativeTarget = decodeURIComponent(target.pathname.slice(base.length));
    const candidate = path.resolve(outputDir, relativeTarget);
    if (candidate !== outputDir && !candidate.startsWith(outputDir + path.sep)) {
      errors.add(`${relative}: URL outside build output ${link}`);
      continue;
    }
    const resolved = await exists(candidate) ? candidate : path.join(candidate, 'index.html');
    if (!await exists(resolved)) {
      errors.add(`${relative}: missing file for ${link}`);
      continue;
    }
    const fragment = decodeURIComponent(target.hash.slice(1)).split(':~:text=')[0];
    if (fragment && pages.has(resolved) && !pages.get(resolved).ids.has(fragment)) {
      errors.add(`${relative}: missing anchor for ${link}`);
    }
  }
}

if (errors.size) {
  console.error([...errors].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} HTML pages and ${checked} internal URLs: no broken links or anchors.`);
}
