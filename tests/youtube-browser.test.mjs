import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { markdownToHtml } from 'satteri';
import { youtubePreviews } from '../src/plugins/youtube.ts';
import { obsidianCallouts } from '../src/plugins/obsidian-callouts.ts';
import { chromePath, openChrome } from './helpers/chrome.mjs';

const executable = await chromePath();

test('real browser: pointer/Enter/Space activate only their player, failures and no-JS preserve the source link',
  { skip: !process.env.CI && !executable && 'Install Chrome or set CHROME_PATH for keyboard/browser tests', timeout: 45000 }, async () => {
  assert.ok(executable, 'Chrome is required in CI; install Chrome or set CHROME_PATH');
  const runtime = await readFile(new URL('../public/scripts/youtube-preview.js', import.meta.url), 'utf8');
  const css = (await Promise.all(['src/styles/themes/research-brown.css', 'src/styles/themes/shared.css', 'src/styles/content.css'].map((file) => readFile(new URL('../' + file, import.meta.url), 'utf8')))).join('\n').replace(/@import[^;]+;/g, '');
  const options = { features: { rawHtml: true }, mdastPlugins: [youtubePreviews('/test'), obsidianCallouts] };
  const source = '> [!YOUTUBE] First video\n> https://youtu.be/M7lc1UVf-VE\n\n> [!YOUTUBE] Second video\n> https://www.youtube.com/watch?v=KHVR587oW8I';
  const embed = (await markdownToHtml(source, options)).html;
  const ordinary = (await markdownToHtml('> [!NOTE]\n> No video.', options)).html;
  const html = (body) => '<!doctype html><html><head><style>' + css + '</style></head><body><div class="sl-markdown-content">' + body + '</div></body></html>';
  let moduleRequests = 0;
  const server = createServer((request, response) => {
    if (request.url === '/test/scripts/youtube-preview.js') {
      moduleRequests++; response.setHeader('Content-Type', 'text/javascript'); response.end(runtime);
    } else { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html(request.url === '/plain' ? ordinary : embed)); }
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await openChrome(executable);
    const { cdp, evaluate, waitFor, requests } = browser;
    // Test deterministically offline: thumbnails and player requests are blocked.
    await cdp('Network.setBlockedURLs', { urls: ['*://*.ytimg.com/*', '*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await cdp('Page.navigate', { url: base + '/plain' });
    await waitFor('document.readyState === "complete"');
    assert.equal(moduleRequests, 0, 'a page with no embed loads no runtime');
    await cdp('Page.navigate', { url: base + '/' });
    await waitFor('document.querySelectorAll("youtube-preview[data-ready]").length === 2');
    assert.equal(moduleRequests, 1, 'two previews share one module request');
    assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
    assert.ok(!requests.some((url) => url.includes('youtube-nocookie.com') || url.includes('/iframe_api')));
    await waitFor('[...document.querySelectorAll("youtube-preview img")].every(img => img.hidden)');
    assert.equal(await evaluate('document.querySelectorAll(".youtube-preview figcaption a").length'), 2);
    await evaluate('document.querySelector("youtube-preview button").focus()');
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    // Tab back to the first native button to exercise an actual keyboard focus state.
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
    assert.ok(await evaluate('document.activeElement.matches("youtube-preview button:focus-visible")'));
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await waitFor('document.querySelectorAll("iframe").length === 1');
    const player = await evaluate('({src:document.querySelector("iframe").src,title:document.querySelector("iframe").title,policy:document.querySelector("iframe").referrerPolicy,focused:document.activeElement.tagName})');
    assert.equal(player.src, 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&playsinline=1');
    assert.equal(player.title, 'First video');
    assert.equal(player.policy, 'strict-origin-when-cross-origin');
    assert.equal(player.focused, 'IFRAME');
    assert.equal(await evaluate('document.querySelectorAll("youtube-preview button").length'), 1);
    await evaluate('document.querySelector("youtube-preview button").focus()');
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', text: ' ', unmodifiedText: ' ', windowsVirtualKeyCode: 32 });
    assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 1);
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await waitFor('document.querySelectorAll("iframe").length === 2');
    assert.equal(await evaluate('document.querySelectorAll(".youtube-preview figcaption a").length'), 2);
    const ratio = await evaluate('(()=>{const r=document.querySelector(".youtube-preview__frame").getBoundingClientRect();return r.width/r.height;})()');
    assert.ok(Math.abs(ratio - 16/9) < 0.01);
    // Pointer activation uses the same native click and still never inserts multiple players.
    await cdp('Page.navigate', { url: base + '/' });
    await waitFor('!!document.querySelector("youtube-preview[data-ready]")');
    const point = await evaluate('(()=>{const r=document.querySelector("youtube-preview button").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await waitFor('document.querySelectorAll("iframe").length === 1');
    assert.equal(await evaluate('document.querySelectorAll(".youtube-preview figcaption a").length'), 2);
    // A browser without JavaScript still has ordinary, accessible original-video links.
    await cdp('Emulation.setScriptExecutionDisabled', { value: true });
    await cdp('Page.navigate', { url: base + '/no-js' });
    await waitFor('location.pathname === "/no-js" && document.readyState === "complete"');
    assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
    assert.equal(await evaluate('document.querySelectorAll(".youtube-preview figcaption a").length'), 2);
    assert.equal(await evaluate('document.querySelectorAll("youtube-preview button:disabled").length'), 2);
  } finally {
    await browser?.close(); server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
