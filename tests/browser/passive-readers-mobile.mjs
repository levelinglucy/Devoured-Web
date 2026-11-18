// Browser-level mobile layout check for the three actual passive reader pages.
// Serves files from this checkout; all storage is disposable per browser context.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const resources = new Set([
  'godpulse.html', 'shardthrone.html', 'councilfire.html',
  'archivegod.js', 'shardthrone.js', 'councilfire.js',
  'sigilpath.js', 'sigil.js', 'echoquest.js', 'fragments.js'
]);
const server = createServer(async (request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname.slice(1);
  if (!resources.has(name)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(join(root, name));
    response.writeHead(200, {
      'Content-Type': name.endsWith('.js') ? 'text/javascript; charset=utf-8' :
        'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }).end(data);
  } catch {
    response.writeHead(500).end();
  }
});

const pages = [
  ['godpulse.html', '#mask', 'Dominant Mask:'],
  ['shardthrone.html', '.throne .title', 'Archivist'],
  ['councilfire.html', '.line', 'Glyph:']
];

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  let verified = 0;

  for (const [name, selector, text] of pages) {
    for (const width of [320, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        deviceScaleFactor: 2, isMobile: true, hasTouch: true
      });
      try {
        // The production imports execute on the actual served HTML, not a
        // fixture with its module removed or replaced.
        await context.addInitScript(() => {
          localStorage.setItem('aletheSigil', 'ABCDEF-123');
          localStorage.setItem('sigilTraits', '[]');
          localStorage.setItem('sigilHistory', '[]');
          localStorage.setItem('aletheThroneRegistry', JSON.stringify([{
            sigil: 'ABCDEF-123',
            title: 'Archivist',
            crowned: '2026-01-01T00:00:00Z'
          }]));
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin + '/' + name);
        await page.waitForFunction(({ selector, text }) => {
          const el = document.querySelector(selector);
          return el && el.textContent.includes(text);
        }, { selector, text });

        async function measure() {
          return page.evaluate(() => ({
            viewportWidth: window.innerWidth,
            docWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            h1Visible: (() => {
              const box = document.querySelector('h1').getBoundingClientRect();
              return box.width > 0 && box.height > 0 && box.left >= 0 &&
                box.right <= window.innerWidth + 1;
            })()
          }));
        }

        const normal = await measure();
        assert.equal(normal.viewportWidth, width, name + ': device-width viewport');
        assert.ok(normal.docWidth <= width + 1 && normal.bodyWidth <= width + 1,
          name + ': no horizontal overflow at ' + width + 'px: ' + JSON.stringify(normal));
        assert.ok(normal.h1Visible, name + ': heading fits viewport');
        assert.deepEqual(errors, [], name + ': modules executed without uncaught errors');

        // Enlarged base text is a deliberate stress test, not a claim that
        // Chromium emulates Safari Dynamic Type or iPhone accessibility settings.
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        const enlarged = await measure();
        assert.ok(enlarged.docWidth <= width + 1 && enlarged.bodyWidth <= width + 1,
          name + ': no horizontal overflow with 200% base font: ' + JSON.stringify(enlarged));
        assert.ok(enlarged.h1Visible, name + ': enlarged heading fits viewport');
        verified++;
        console.log(name + ' ' + width + 'px: actual served modules, device width and 200% font passed');
      } finally {
        await context.close();
      }
    }
  }
  assert.equal(verified, 6);
} catch (error) {
  process.exitCode = 1;
  console.error('Passive mobile reader browser check failed:', error);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
