// Served-origin smoke for the opt-in, browser-local archive recovery controls.
// Uses disposable synthetic localStorage only, never a visitor's actual data.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const resources = new Set([
  'fragments.html', 'trail.html', 'fragments.js', 'pagespawn.js',
  'local-archive-backup.js'
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

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  // GitHub's Ubuntu runner image includes Google Chrome; no bundled browser
  // download is required. This is a real served HTTP origin, not a DOM stub.
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  let verified = 0;
  for (const [pageName, key] of [
    ['fragments.html', 'aletheFragments'],
    ['trail.html', 'aletheSpawnTrail']
  ]) {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write']
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${origin}/${pageName}`);
      const reveal = page.getByRole('button', { name: 'Reveal raw text for backup' });
      const preview = page.locator('#backup-raw');
      const encoded = page.locator('#backup-encoded');
      assert.equal(await preview.isVisible(), false, 'Raw preview initially private');
      assert.equal(await encoded.isVisible(), false, 'Encoded copy initially private');
      // Deliberately malformed source containing CRLF, CR, NUL and a lone
      // surrogate tests preservation rather than successful JSON parsing.
      const raw = 'old\r\nnew\rthird\n\u0000' + String.fromCharCode(0xd800) + '{broken';
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
      await page.reload();
      assert.equal(await encoded.isVisible(), false);
      await reveal.focus();
      await page.keyboard.press('Enter'); // keyboard access, not mouse-only
      assert.equal(await preview.isVisible(), true);
      assert.equal(await encoded.isVisible(), true);
      const escaped = await encoded.inputValue();
      assert.equal(JSON.parse(escaped), raw, 'Escaped UI value round-trips exact DOMString');
      assert.equal(await page.evaluate(k => localStorage.getItem(k), key), raw);
      await encoded.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), escaped,
        'Real browser clipboard retains the lossless encoded form');
      // Simulate a subsequent denied read: the previously exposed contents
      // must be cleared instead of showing a misleading stale backup.
      await page.evaluate(() => {
        Storage.prototype.getItem = function () { throw new Error('Denied'); };
      });
      await reveal.click();
      assert.equal(await preview.isVisible(), false);
      assert.equal(await encoded.isVisible(), false);
      assert.equal(await preview.inputValue(), '');
      assert.equal(await encoded.inputValue(), '');
      assert.match(await page.locator('#backup-status').innerText(), /did not allow/i);
      assert.deepEqual(errors, []);
      verified++;
      console.log(`${pageName}: served-origin keyboard reveal, preservation, clipboard and denied-read reset passed`);
    } finally {
      await context.close();
    }
  }
  // On the actual page, absent and present-empty keys must differ.
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${origin}/fragments.html`);
    const reveal = page.locator('#show-backup');
    await reveal.click();
    assert.match(await page.locator('#backup-status').innerText(), /no saved/i);
    assert.equal(await page.locator('#backup-encoded').isVisible(), false);
    await page.evaluate(() => localStorage.setItem('aletheFragments', ''));
    await reveal.click();
    assert.equal(await page.locator('#backup-encoded').inputValue(), '""');
    assert.equal(await page.locator('#backup-encoded').isVisible(), true);
    verified++;
    console.log('fragments.html: absent vs present-empty archive passed');
  } finally {
    await context.close();
  }
  // Real served-page smoke for native record headings at mobile and desktop widths.
  // Synthetic records exercise the actual imported display modules, not a copied DOM fixture.
  for (const [pageName, key, cardSelector, titleClass, records, bottomMargin] of [
    ['fragments.html', 'aletheFragments', '.fragment', 'title', [
      { title: '<img src=x onerror=alert(1)>', text: 'Inert story text' },
      { title: 'A deliberately long saved fragment title that wraps naturally', text: 'Second record' }
    ], '8px'],
    ['trail.html', 'aletheSpawnTrail', '.spawn', 'spawn-title', [
      { title: '<img src=x onerror=alert(1)>', filename: 'first.txt', created: '2026-01-01', content: 'Inert story text' },
      { title: 'A deliberately long saved ritual title that wraps naturally', filename: 'second.txt', created: '2026-01-02', content: 'Second record' }
    ], '0px']
  ]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${origin}/${pageName}`);
      const raw = JSON.stringify(records);
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
      await page.reload();
      const headings = page.locator(`${cardSelector} > h2.${titleClass}`);
      await headings.first().waitFor();
      assert.equal(await headings.count(), records.length, pageName + ': one h2 per record');
      assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
      assert.equal(await page.getByRole('heading', { level: 2, name: records[0].title }).count(), 1);
      assert.equal(await page.locator(`${cardSelector} img`).count(), 0, 'Stored text is inert');
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const actual = await headings.first().evaluate(el => {
          const style = getComputedStyle(el);
          return { size: style.fontSize, top: style.marginTop, bottom: style.marginBottom };
        });
        assert.deepEqual(actual, { size: '16px', top: '0px', bottom: bottomMargin },
          pageName + ': preserve typography at width ' + width);
      }
      assert.equal(await page.evaluate(k => localStorage.getItem(k), key), raw);
      assert.deepEqual(errors, []);
      verified++;
      console.log(`${pageName}: served-origin story heading semantics and inert content passed`);
    } finally {
      await context.close();
    }
  }
  assert.equal(verified, 5);
} catch (error) {
  process.exitCode = 1;
  console.error('Browser smoke did not pass:', error);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
