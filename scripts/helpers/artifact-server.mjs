import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.xml': 'application/xml' };

// Serve only physical artifact files under the project base. No Astro/Vite,
// route rewrites, SPA fallback, or runtime redirect configuration.
export async function startArtifactServer(directory, base, port = 0) {
  const root = path.resolve(directory);
  const misses = [];
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    try {
      if (pathname === base.slice(0, -1)) { res.writeHead(301, { Location: base }); res.end(); return; }
      if (!pathname.startsWith(base)) throw Error('Outside project base');
      let filename = path.resolve(root, decodeURIComponent(pathname.slice(base.length)));
      if (filename !== root && !filename.startsWith(root + path.sep)) throw Error('Outside artifact');
      if ((await stat(filename)).isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' }); res.end(); return; }
        filename = path.join(filename, 'index.html');
      }
      const body = await readFile(filename);
      res.writeHead(200, { 'Content-Type': types[path.extname(filename)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      misses.push(pathname);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(root, '404.html')).catch(() => 'Not found'));
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: 'http://127.0.0.1:' + server.address().port + base, misses,
    close: () => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }) };
}
