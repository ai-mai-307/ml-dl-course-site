import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Browser tests need no npm runtime. Set CHROME_PATH when Chrome is installed elsewhere.
export async function chromePath() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
  for (const candidate of candidates) { try { await access(candidate); return candidate; } catch {} }
}

export async function openChrome(executable) {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'youtube-browser-test-'));
  const child = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  async function close() {
    socket?.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit'); child.kill(); await exited;
    }
    const relative = path.relative(os.tmpdir(), path.resolve(profile));
    if (!relative.startsWith('youtube-browser-test-') || relative.includes(path.sep)) throw Error('Unsafe profile path');
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
  try {
    const port = await new Promise((resolve, reject) => {
      let stderr = '';
      const timer = setTimeout(() => reject(Error('Chrome startup timed out')), 15000);
      const fail = (error) => { clearTimeout(timer); reject(error); };
      child.once('error', fail);
      child.once('exit', (code) => fail(Error('Chrome exited ' + code)));
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
        const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(stderr);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    const tab = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
    socket = new WebSocket(tab.webSocketDebuggerUrl);
    await once(socket, 'open');
    let nextId = 0;
    const pending = new Map();
    const requests = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
      const item = pending.get(message.id);
      if (item) {
        clearTimeout(item.timer); pending.delete(message.id);
        message.error ? item.reject(Error(JSON.stringify(message.error))) : item.resolve(message.result);
      }
    });
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); reject(Error(method + ' timed out')); }, 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    async function evaluate(expression) {
      const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    }
    async function waitFor(expression) {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw Error('Browser condition timed out: ' + expression);
    }
    await cdp('Page.enable'); await cdp('Network.enable');
    return { cdp, evaluate, waitFor, requests, close };
  } catch (error) { await close(); throw error; }
}
