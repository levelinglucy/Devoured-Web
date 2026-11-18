// Served-origin CSS regression for Shard's real HTML and Worldskin stylesheet.
// The Firebase-dependent module is intentionally not exercised: this tests CSS only.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const server = createServer(async (req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (!['shard.html', 'worldskin.css'].includes(name)) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(join(root, name));
    res.writeHead(200, {
      'Content-Type': name.endsWith('.css') ? 'text/css; charset=utf-8' :
        'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }).end(body);
  } catch {
    res.writeHead(500).end();
  }
});

const expected = {
  still: 'none',
  awake: 'pulseGlow',
  fractured: 'glitch',
  ignited: 'emberPulse'
};

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  // Never contact Firebase/Google or any other external network service.
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  await page.goto(origin + '/shard.html', { waitUntil: 'load' });
  assert.equal(await page.locator('h1').textContent(), 'Shard Interface');
  assert.equal(await page.locator('#desc').textContent(), 'Let the Fold reveal its skin...');

  const sample = async (state, reducedMotion) => {
    await page.emulateMedia({ reducedMotion });
    await page.evaluate(s => {
      document.body.className = s;
      document.body.dataset.fold = s;
    }, state);
    // Shard transitions text colour for 1 second in ordinary mode.
    // Compare settled colours, not a mid-transition sampled frame.
    if (reducedMotion === 'no-preference') await page.waitForTimeout(1200);
    return page.evaluate(() => {
      const css = getComputedStyle(document.body);
      return {
        animation: css.animationName,
        transition: css.transitionProperty,
        color: css.color,
        title: document.querySelector('h1').textContent,
        desc: document.querySelector('#desc').textContent
      };
    });
  };

  for (const [state, animation] of Object.entries(expected)) {
    const normal = await sample(state, 'no-preference');
    assert.equal(normal.animation, animation, state + ': default animation');
    assert.equal(normal.transition, 'background, color', state + ': default transition');
    const reduced = await sample(state, 'reduce');
    assert.equal(reduced.animation, 'none', state + ': OS reduced motion animation');
    assert.equal(reduced.transition, 'none', state + ': OS reduced motion transition');
    for (const key of ['color', 'title', 'desc']) {
      assert.equal(reduced[key], normal[key], state + ': preserved ' + key);
    }
    console.log(state + ': default animation preserved; reduced motion still (2 checks)');
  }
  assert.equal((await sample('fractured', 'no-preference')).animation, 'glitch');
  assert.equal((await sample('fractured', 'reduce')).animation, 'none');
  assert.equal((await sample('fractured', 'no-preference')).animation, 'glitch');
  console.log('Runtime prefers-reduced-motion toggle: glitch -> none -> glitch passed');
  await context.close();
} catch (error) {
  process.exitCode = 1;
  console.error('Served Shard/Worldskin reduced-motion test failed:', error);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
