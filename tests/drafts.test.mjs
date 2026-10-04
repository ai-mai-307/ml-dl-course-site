import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { isVisible } from '../src/utils/publishing.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const toolsDir = path.join(root, '.tools');
const astroPackageUrl = new URL(import.meta.resolve('astro/package.json'));
const astroPackage = JSON.parse(await readFile(astroPackageUrl, 'utf8'));
const cli = fileURLToPath(new URL(astroPackage.bin.astro, astroPackageUrl));

test('custom collections publish by default and show drafts only in development', () => {
  for (const draft of [undefined, false, true]) {
    assert.equal(isVisible({ data: { draft } }, false), draft !== true);
    assert.equal(isVisible({ data: { draft } }, true), true);
  }
});

test('Obsidian templates match real schemas and drafts stay out of production', { timeout: 120000 }, async () => {
  await mkdir(toolsDir, { recursive: true });
  const fixture = await mkdtemp(path.join(toolsDir, 'draft-build-test-'));
  let server;
  async function stopServer() {
    if (server && server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    server = undefined;
  }
  const write = async (relative, text) => {
    const target = path.join(fixture, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text, 'utf8');
  };
  const build = () => spawnSync(process.execPath, [cli, 'build'], {
    cwd: fixture, encoding: 'utf8', timeout: 35000, windowsHide: true,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  try {
    for (const item of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      await cp(path.join(root, item), path.join(fixture, item), { recursive: true });
    }
    // This fixture intentionally omits draft to test the publication default.
    await cp(path.join(root, 'tests/fixtures/course.yaml'), path.join(fixture, 'src/content/courses/ml/2026-fall.yaml'));
    const kinds = ['textbook', 'guide', 'assignment', 'exam', 'note'];
    const expanded = new Map();
    for (const kind of kinds) {
      const template = (await readFile(path.join(root, `src/content/_templates/${kind}.md`), 'utf8')).replaceAll('\r\n', '\n');
      assert.match(template, /^---\n[\s\S]*\ndraft: true\n---\s*$/, 'template must contain only frontmatter');
      assert.equal(template.split('\n---').length, 2);
      // Match Obsidian core Templates substitution; include YAML-sensitive title characters.
      const content = template.replaceAll('{{title}}', `PRIVATE_TEMPLATE_${kind}: "quotes" and 'apostrophe'`)
        .replaceAll('{{date:YYYY-MM-DD}}', '2030-01-02');
      assert.ok(!content.includes('{{'));
      expanded.set(kind, content);
      const relative = kind === 'note' ? 'notes/authoring-draft.md' : `docs/authoring-fixtures/${kind}.md`;
      await write(`src/content/${relative}`, `${content}\nPRIVATE_BODY_${kind}\n`);
    }
    await write('src/content/docs/authoring-fixtures/public.md', expanded.get('textbook')
      .replace(/title: >-\n  [^\n]+/, 'title: Public document').replace('draft: true\n', ''));
    for (const [id, flag] of [['default', ''], ['explicit', 'draft: false\n']]) {
      await write(`src/content/notes/public-${id}.md`, expanded.get('note')
        .replace(/title: >-\n  [^\n]+/, `title: Public note ${id}`).replace('draft: true\n', flag));
    }
    await write('src/content/courses/fixture/2099-fall.yaml', 'courseId: fixture\ntermId: 2099-fall\ntitle: PRIVATE_COURSE_SENTINEL\ndescription: Fixture\nstatus: active\ndraft: true\npages:\n  - role: overview\n    doc: authoring-fixtures/textbook\n');
    const configPath = path.join(fixture, 'astro.config.mjs');
    const config = (await readFile(configPath, 'utf8')).replace('sidebar: [', "sidebar: [\n        { label: 'Fixture docs', items: [{ autogenerate: { directory: 'authoring-fixtures' } }] },");
    await writeFile(configPath, config, 'utf8');

    // This temporary dev-only probe checks parsed defaults and types in the actual collections.
    const probePath = 'src/pages/schema-fixture.json.ts';
    await write(probePath, `import { getCollection } from 'astro:content';
export async function GET() {
  const result = {};
  for (const collection of ['docs', 'notes', 'courses']) {
    result[collection] = (await getCollection(collection)).map(({ id, data }) => ({ id, data }));
  }
  return Response.json(result);
}`);
    const portProbe = createServer();
    portProbe.listen(0, '127.0.0.1');
    await once(portProbe, 'listening');
    const port = portProbe.address().port;
    await new Promise((resolve) => portProbe.close(resolve));
    let output = '';
    server = spawn(process.execPath, [cli, 'dev', '--host', '127.0.0.1', '--port', String(port)], {
      cwd: fixture, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    });
    server.stdout.on('data', (data) => { output += data; });
    server.stderr.on('data', (data) => { output += data; });
    const base = `http://127.0.0.1:${port}/ml-dl-course-site/`;
    let response;
    for (let attempt = 0; attempt < 450; attempt++) {
      assert.equal(server.exitCode, null, output);
      try { response = await fetch(`${base}schema-fixture.json`, { signal: AbortSignal.timeout(1500) }); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    assert.ok(response?.ok, `Development schema probe failed: ${response?.status ?? 'no response'}\n${output}`);
    const collections = await response.json();
    for (const kind of kinds) {
      const collection = kind === 'note' ? 'notes' : 'docs';
      const id = kind === 'note' ? 'authoring-draft' : `authoring-fixtures/${kind}`;
      const entry = collections[collection].find((entry) => entry.id === id);
      assert.equal(entry.data.draft, true);
      assert.equal(entry.data.title, `PRIVATE_TEMPLATE_${kind}: "quotes" and 'apostrophe'`);
      if (kind !== 'note') assert.equal(entry.data.contentKind, kind);
      else {
        assert.equal(entry.data.publishedAt, '2030-01-02T00:00:00.000Z');
        assert.equal(entry.data.description, '');
        assert.deepEqual(entry.data.tags, []);
      }
      if (kind === 'assignment' || kind === 'exam') {
        assert.equal(entry.data.courseId, '');
        assert.equal(entry.data.termId, '');
      }
      const page = await fetch(`${base}${collection === 'notes' ? 'notes/' : ''}${id}/`);
      assert.equal(page.status, 200, `${id}\n${output}`);
      assert.ok((await page.text()).includes(`PRIVATE_BODY_${kind}`));
    }
    assert.equal(collections.docs.find((entry) => entry.id === 'authoring-fixtures/public').data.draft, false);
    assert.equal(collections.notes.find((entry) => entry.id === 'public-default').data.draft, false);
    assert.equal(collections.courses.find((entry) => entry.id === 'ml/2026-fall').data.draft, false);
    assert.ok(!Object.values(collections).flat().some((entry) => entry.id.includes('_templates')));
    for (const route of ['notes/', 'courses/', 'courses/fixture/2099-fall/', 'guides/']) {
      const page = await fetch(`${base}${route}`);
      assert.equal(page.status, 200, output);
      assert.ok(/PRIVATE_TEMPLATE_|PRIVATE_COURSE_SENTINEL/.test(await page.text()), `Draft navigation missing from ${route}`);
    }
    await stopServer();
    await rm(path.join(fixture, probePath));

    const production = build();
    assert.equal(production.status, 0, `${production.error ?? ''}\n${production.stdout}\n${production.stderr}`);
    for (const route of ['notes/public-default', 'notes/public-explicit', 'authoring-fixtures/public', 'courses/ml/2026-fall']) {
      assert.ok((await stat(path.join(fixture, 'dist', route, 'index.html'))).isFile());
    }
    for (const route of ['notes/authoring-draft', 'courses/fixture/2099-fall', ...kinds.slice(0, 4).map((kind) => `authoring-fixtures/${kind}`)]) {
      await assert.rejects(stat(path.join(fixture, 'dist', route, 'index.html')), { code: 'ENOENT' });
    }
    async function checkOutput(directory) {
      for (const item of await readdir(directory, { withFileTypes: true })) {
        const filename = path.join(directory, item.name);
        if (item.isDirectory()) await checkOutput(filename);
        else if (/\.(html|xml|json|js)$/.test(item.name)) {
          assert.doesNotMatch(await readFile(filename, 'utf8'), /PRIVATE_TEMPLATE_|PRIVATE_BODY_|PRIVATE_COURSE_SENTINEL/, filename);
        }
      }
    }
    await checkOutput(path.join(fixture, 'dist'));
    const noteList = await readFile(path.join(fixture, 'dist/notes/index.html'), 'utf8');
    assert.match(noteList, /Public note default/);
    assert.match(noteList, /Public note explicit/);

    const manifestPath = path.join(fixture, 'src/content/courses/ml/2026-fall.yaml');
    const manifest = await readFile(manifestPath, 'utf8');
    for (const target of ['courses/ml/2026-fall/overview', 'textbook/ml/introduction']) {
      await writeFile(manifestPath, manifest.replace(`doc: ${target}`, 'doc: authoring-fixtures/textbook'), 'utf8');
      const invalid = build();
      assert.equal(invalid.status, 1);
      assert.match(`${invalid.stdout}\n${invalid.stderr}`, /is a draft and has no production page/);
    }
    await writeFile(manifestPath, manifest, 'utf8');
    await writeFile(configPath, config.replace('sidebar: [', "sidebar: [\n        { slug: 'authoring-fixtures/textbook' },"), 'utf8');
    const manualDraftLink = build();
    assert.equal(manualDraftLink.status, 1);
    assert.match(`${manualDraftLink.stdout}\n${manualDraftLink.stderr}`, /specified in the Starlight sidebar config does not exist/);
  } finally {
    await stopServer();
    const relative = path.relative(toolsDir, path.resolve(fixture));
    assert.ok(relative.startsWith('draft-build-test-') && !relative.includes(path.sep));
    await rm(fixture, { recursive: true, force: true });
  }
});
