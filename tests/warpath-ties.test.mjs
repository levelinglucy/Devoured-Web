import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const warpath = readFileSync(join(root, 'warpath.js'), 'utf8');
const warlock = readFileSync(join(root, 'warlock.js'), 'utf8');

assert.match(warpath, /import\s+\{\s*getFaction\s*\}\s+from\s+['"]\.\/faction\.js['"]/);
assert.match(warlock, /import\s+\{\s*getDominantFaction\s*\}\s+from\s+['"]\.\/warpath\.js['"]/);

function makeVisit(raw, { contribute = true } = {}) {
  const records = new Map([['warpathTally', raw]]);
  let visitor = 'Red';
  const env = {
    getFaction: () => visitor,
    localStorage: {
      getItem: name => records.get(name) ?? null,
      setItem: (name, value) => records.set(name, String(value))
    }
  };
  const warpathSource = warpath
    .replace(/^import\s+\{\s*getFaction\s*\}\s+from\s+['"]\.\/faction\.js['"];?\s*$/m, '')
    .replace(/\bexport\s+(?=function)/g, '');
  runInNewContext(warpathSource +
    '\nthis.api = { contributeToFaction, getDominantFaction };', env);
  if (contribute) env.api.contributeToFaction();
  const location = { href: 'open.html' };
  const gate = { getFaction: () => visitor, getDominantFaction: env.api.getDominantFaction,
    window: { location } };
  const warlockSource = warlock
    .replace(/^import\s+\{[^}]+\}\s+from\s+['"]\.\/(?:faction|warpath)\.js['"];?\s*$/gm, '')
    .replace(/\bexport\s+(?=async function|function)/g, '');
  runInNewContext(warlockSource + '\nthis.lockIfRival = lockIfRival;', gate);
  return {
    snapshot: () => JSON.parse(records.get('warpathTally')),
    dominant: () => env.api.getDominantFaction(),
    async accessAs(faction) {
      visitor = faction;
      location.href = 'open.html';
      await gate.lockIfRival();
      return location.href;
    }
  };
}

test('equal numeric tallies select one explicit stable name-order winner', async () => {
  for (const raw of ['{"Red":1,"Blue":2}', '{"Blue":2,"Red":1}']) {
    const run = makeVisit(raw);
    assert.equal(run.snapshot().Red, 2);
    assert.equal(run.snapshot().Blue, 2);
    assert.equal(run.dominant(), 'Blue', 'insertion order must not decide a story gate');
    assert.equal(await run.accessAs('Blue'), 'open.html');
    assert.equal(await run.accessAs('Red'), 'banned.html');
  }
});

test('unique majority still wins; an empty tally still reports None', async () => {
  const run = makeVisit('{"Blue":1,"Red":1,"Green":1}');
  assert.equal(run.dominant(), 'Red');
  assert.equal(await run.accessAs('Red'), 'open.html');
  assert.equal(await run.accessAs('Blue'), 'banned.html');
  const empty = makeVisit('{}', { contribute: false });
  assert.equal(empty.dominant(), 'None');
});

test('ties between more than two factions use the same deterministic ranking', async () => {
  for (const raw of [
    '{"Red":1,"Green":2,"Blue":2}',
    '{"Blue":2,"Green":2,"Red":1}'
  ]) {
    const run = makeVisit(raw);
    assert.equal(run.snapshot().Red, 2);
    assert.equal(run.dominant(), 'Blue');
    assert.equal(await run.accessAs('Blue'), 'open.html');
    assert.equal(await run.accessAs('Green'), 'banned.html');
  }
});
