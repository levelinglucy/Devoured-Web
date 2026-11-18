// Native same-origin Chrome test for the draft Fragment Web Locks writer.
// All browser state is synthetic and isolated. This is not a proof of
// durability, mixed-version safety, or native Safari behaviour.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const resources = new Set(['fragments.html', 'fragments.js', 'local-archive-backup.js']);
const server = createServer(async (request, response) => {
  const name = new URL(request.url, 'http://localhost').pathname.slice(1);
  if (!resources.has(name)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const content = await readFile(join(root, name));
    response.writeHead(200, {
      'Content-Type': name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }).end(content);
  } catch {
    response.writeHead(500).end();
  }
});

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  try {
    const [holder, writerA, writerB, legacy] = await Promise.all(
      Array.from({ length: 4 }, () => context.newPage())
    );
    await Promise.all([holder, writerA, writerB, legacy].map(page =>
      page.goto(origin + '/fragments.html')
    ));
    assert.equal(await holder.evaluate(() =>
      isSecureContext && typeof navigator.locks?.request === 'function' &&
      typeof navigator.locks?.query === 'function'
    ), true, 'Real Chrome Web Locks are available on the served secure loopback origin');

    const raw = ' \n[{"title":"Old","text":"Lore","big":1e999,"precise":9007199254740993,"k":1,"k":2,"spelling":"\\u0061"}] \n';
    await holder.evaluate(value => localStorage.setItem('aletheFragments', value), raw);

    // Hold the *native* Web Lock across tabs, ensuring both modern writers
    // genuinely queue instead of passing by lucky event-loop ordering.
    await holder.evaluate(() => {
      navigator.locks.request('aletheFragments:write:v1', { mode: 'exclusive' }, async () => {
        window.holdingNativeLock = true;
        await new Promise(resolve => { window.releaseNativeLock = resolve; });
      });
    });
    await holder.waitForFunction(() => window.holdingNativeLock === true);

    const first = writerA.evaluate(async () =>
      (await import('/fragments.js')).addNumberedFragment('Root-script ', 'From tab A')
    );
    const second = writerB.evaluate(async () =>
      (await import('/fragments.js')).addNumberedFragment('Root-script ', 'From tab B')
    );
    await holder.waitForFunction(async () => {
      const snapshot = await navigator.locks.query();
      return snapshot.pending.filter(lock => lock.name === 'aletheFragments:write:v1').length >= 2;
    }, null, { timeout: 10000 });
    assert.equal(await holder.evaluate(() => localStorage.getItem('aletheFragments')), raw,
      'No cooperating writer modified storage while another tab held the exclusive lock');

    await holder.evaluate(() => window.releaseNativeLock());
    const titles = await Promise.all([first, second]);
    assert.deepEqual([...titles].sort(), ['Root-script 1', 'Root-script 2']);
    const saved = await holder.evaluate(() => localStorage.getItem('aletheFragments'));
    const close = raw.lastIndexOf(']');
    assert.ok(saved.startsWith(raw.slice(0, close) + ','), 'Original JSON bytes retained');
    const parsed = JSON.parse(saved);
    assert.equal(parsed.length, 3);
    assert.deepEqual(new Set(parsed.slice(1).map(x => x.title)),
      new Set(['Root-script 1', 'Root-script 2']));
    assert.deepEqual(new Set(parsed.slice(1).map(x => x.text)),
      new Set(['From tab A', 'From tab B']));
    console.log('Native Chrome: two tabs queued under held lock, used distinct titles, preserved opaque history');

    // A noncooperating tab, modelling an older loaded version, can still
    // overwrite storage from a stale snapshot. A green cooperative-lock test
    // must not be mistaken for cross-version safety.
    const stale = await legacy.evaluate(() => localStorage.getItem('aletheFragments'));
    assert.equal(await writerA.evaluate(async () =>
      (await import('/fragments.js')).addFragment('Fresh modern record', 'New')
    ), true);
    assert.equal(JSON.parse(await holder.evaluate(() =>
      localStorage.getItem('aletheFragments'))).length, 4);
    await legacy.evaluate(value => localStorage.setItem('aletheFragments', value), stale);
    assert.equal(await holder.evaluate(() => localStorage.getItem('aletheFragments')), stale,
      'An unlocked stale writer can erase a modern append even after native Web Locks were used');
    assert.equal(JSON.parse(stale).some(x => x.title === 'Fresh modern record'), false);
    console.log('Mixed-version limitation reproduced: simulated old unlocked tab overwrote a newer append');
  } finally {
    await context.close();
  }
} catch (error) {
  process.exitCode = 1;
  console.error('Native Fragment Web Locks browser check failed:', error);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
