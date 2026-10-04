import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir, lstat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import config from '../astro.config.mjs';
import { startArtifactServer } from './helpers/artifact-server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const base = config.base.replace(/\/$/, '') + '/';
const server = await startArtifactServer(dist, base);
async function files(dir) {
  const result = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const info = await lstat(full);
    assert.ok(!info.isSymbolicLink(), 'Pages artifact must not contain symlinks: ' + full);
    if (info.isDirectory()) result.push(...await files(full)); else result.push(full);
  }
  return result;
}
try {
  const output = await files(dist);
  let fonts = 0, css = 0, js = 0, images = 0, html = 0;
  // Verify every physical artifact file through HTTP, at its real base-prefixed URL.
  for (const file of output) {
    const relative = path.relative(dist, file).split(path.sep).map(encodeURIComponent).join('/');
    const route = relative.replace(/(^|\/)index\.html$/, '$1');
    const response = await fetch(server.url + route);
    assert.equal(response.status, 200, route);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(file), route);
    const type = response.headers.get('content-type');
    if (/\.woff2?$/.test(file)) { fonts++; assert.match(type, /^font\//); }
    if (file.endsWith('.css')) { css++; assert.match(type, /^text\/css/); }
    if (/\.m?js$/.test(file)) { js++; assert.match(type, /javascript/); }
    if (/\.(png|svg|webp|gif|jpe?g|ico)$/.test(file)) images++;
    if (file.endsWith('.html')) html++;
  }
  assert.ok(fonts && css && js && images && html);
  const missing = await fetch(server.url + 'missing-artifact-test/');
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), await readFile(path.join(dist, '404.html'), 'utf8'));
  assert.equal((await fetch(new URL('/textbook/', server.url))).status, 404, 'Server must not hide a missing base prefix');
  assert.equal((await fetch(server.url + base.slice(1))).status, 404, 'Server must not hide a duplicate base prefix');
  server.misses.length = 0;
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--experimental-strip-types', 'scripts/check-browser.mjs', server.url], { cwd: root, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(Error('Artifact browser check failed: ' + code)));
  });
  // Native redirect HTML has no favicon declaration; Chrome may probe the
  // origin-level /favicon.ico. All declared page icons must remain under base.
  assert.deepEqual(server.misses.filter(url => url !== '/favicon.ico'), [], 'Browser requested missing artifact resources');
  console.log('PASS: raw dist/ mounted at ' + base + ': ' + JSON.stringify({ html, fonts, css, js, images }) + '; exact bytes; 404 status; no missing declared browser assets.');
} finally { await server.close(); }
