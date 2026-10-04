import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromePath, openChrome } from '../tests/helpers/chrome.mjs';
import { textbookGroups } from '../src/utils/textbook.ts';

// Run against a production preview, not dev: Pagefind is generated at build time.
const base = (process.argv[2] || 'http://localhost:4321/ml-dl-course-site/').replace(/\/$/, '');
const executable = await chromePath();
assert.ok(executable, 'Install Chrome/Chromium or set CHROME_PATH');
const browser = await openChrome(executable);
const screenshots = process.env.BROWSER_SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const routes = ['/', '/textbook/', '/textbook/ml/preprocessing/', '/textbook/dl/neural-network-foundations/',
  '/courses/', '/courses/deep-learning/2026-fall/', '/courses/ai-design/2026-fall/',
  '/courses/intro-ml-dl-pish/2026-fall/', '/guides/datasphere/budget/', '/notes/', '/notes/cross-entropy/', '/about/'];
try {
  const { cdp, evaluate, waitFor, requests } = browser;
  const navigate = async (route) => {
    const url = base + route;
    const result = await cdp('Page.navigate', { url });
    assert.equal(result.errorText, undefined);
    await waitFor('location.href === ' + JSON.stringify(url) + ' && document.readyState === "complete" && !!document.querySelector("h1")');
    await evaluate('document.fonts.ready.then(() => true)');
  };
  let pages = 0;
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
    for (const theme of ['light', 'dark']) {
      await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
      for (const route of routes) {
        await navigate(route);
        const state = await evaluate('({heading:document.querySelector("h1").textContent,theme:document.documentElement.dataset.theme,design:getComputedStyle(document.documentElement).getPropertyValue("--design-name").trim(),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,iframes:document.querySelectorAll("youtube-preview iframe").length})');
        assert.equal(state.theme, theme);
        assert.equal(state.design, 'research-brown');
        assert.ok(state.heading.trim());
        assert.ok(!state.overflow, route + ': horizontal overflow');
        assert.equal(state.iframes, 0);
        assert.ok(await evaluate('[...document.images].filter(i=>i.src.startsWith(location.origin)).every(i=>!i.complete||i.naturalWidth>0)'), route + ': broken local image');
        if (route === '/guides/datasphere/budget/') assert.equal(await evaluate('document.querySelector(".sl-markdown-content").firstElementChild.dataset.callout'), 'warning');
        if (route === '/notes/cross-entropy/') {
          await waitFor('!!document.querySelector("youtube-preview[data-ready]")');
          await evaluate('document.querySelector("youtube-preview").scrollIntoView({block:"center"})');
          await waitFor('document.querySelector("youtube-preview img").complete');
          const imageLoaded = await evaluate('document.querySelector("youtube-preview img").naturalWidth>0');
          // Availability of the remote thumbnail is diagnostic; the fallback remains useful offline.
          console.log('YouTube thumbnail: ' + (imageLoaded ? 'loaded' : 'fallback') + ', ' + width + 'px ' + theme);
          assert.ok(await evaluate('document.querySelector(".youtube-preview figcaption a").href.startsWith("https://")'));
        }
        if (screenshots) {
          const shot = await cdp('Page.captureScreenshot', { format: 'png' });
          const name = (route === '/' ? 'home' : route.slice(1,-1).replaceAll('/', '-')) + '-' + width + '-' + theme + '.png';
          await writeFile(path.join(screenshots, name), Buffer.from(shot.data, 'base64'));
        }
        pages++;
      }
      if (width === 390) {
        await evaluate('document.querySelector(".sl-menu-button").click()');
        assert.ok(await evaluate('document.querySelector("#starlight__sidebar").matches(":popover-open")'));
        await evaluate('document.querySelector(".sl-menu-button").click()');
      }
    }
  }
  assert.ok(!requests.some((url) => url.includes('youtube-nocookie.com') || url.includes('/iframe_api')));
  await navigate('/notes/cross-entropy/');
  await waitFor('!!document.querySelector("youtube-preview[data-ready]")');
  await evaluate('document.querySelector("youtube-preview button").focus()');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor('!!document.querySelector("youtube-preview iframe")');
  assert.ok(await evaluate('document.querySelector("youtube-preview iframe").src.startsWith("https://www.youtube-nocookie.com/embed/")'));
  assert.ok(await evaluate('!!document.querySelector(".youtube-preview figcaption a")'));

  // Index coverage for every textbook chapter and the renamed real note.
  await navigate('/');
  const indexEntries = await evaluate('(async()=>{const pf=await import(' + JSON.stringify(base + '/pagefind/pagefind.js') + ');const result=await pf.search(null);return Promise.all(result.results.map(async r=>(await r.data()).url));})()');
  for (const id of [...textbookGroups.flatMap(g => g.chapters).map(c => c.id), 'notes/cross-entropy']) {
    assert.ok(indexEntries.some(u => new URL(u, base + '/').pathname.endsWith('/' + id + '/')), 'Search missing ' + id);
  }
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
    for (const [route, query] of [['/notes/cross-entropy/', 'Кросс-энтропия'], ['/courses/ai-design/2026-fall/', 'конструировании'], ['/about/', 'Максим']]) {
      await navigate('/');
      await waitFor('!!document.querySelector("button[data-open-modal]:not([disabled])")');
      await evaluate('document.querySelector("button[data-open-modal]").click()');
      await waitFor('!!document.querySelector(".pagefind-ui__search-input")');
      await evaluate('document.querySelector(".pagefind-ui__search-input").focus()');
      await cdp('Input.insertText', { text: query });
      await waitFor('[...document.querySelectorAll(".pagefind-ui__result-link")].some(a=>a.href.split("#")[0]===' + JSON.stringify(base + route) + ')');
      await evaluate('[...document.querySelectorAll(".pagefind-ui__result-link")].find(a=>a.href.split("#")[0]===' + JSON.stringify(base + route) + ').click()');
      await waitFor('location.href.split("#")[0]===' + JSON.stringify(base + route) + '&&!!document.querySelector("h1")');
    }
  }
  await navigate('/');
  const hidden = await evaluate('(async()=>{const pf=await import(' + JSON.stringify(base + '/pagefind/pagefind.js') + ');const all=await pf.search(null);return Promise.all(all.results.map(async r=>(await r.data()).url));})()');
  assert.ok(hidden.length > 0);
  assert.ok(!hidden.some(u => /\/guides\/(authoring-example|git)\/|\/courses\/ml\/|\/notes\/note-1\/|\/migration\/|\/design\//.test(u)));
  console.log('PASS: ' + pages + ' desktop/mobile light/dark page checks; mobile menu; YouTube activation; 10 chapters and renamed note in search; 6 search result clicks; no private routes in search.');
} finally { await browser.close(); }
