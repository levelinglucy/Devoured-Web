import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../fragments.js', import.meta.url), 'utf8');
function store(raw = null, failWrite = false) {
  const map = new Map();
  if (raw !== null) map.set('aletheFragments', raw);
  let writes = 0;
  return {
    map, get writes() { return writes; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { writes += 1; if (failWrite) throw new Error('Write rejected'); map.set(k, String(v)); },
    removeItem(k) { map.delete(k); }
  };
}
function locks() {
  // Deterministic mock of the Web Locks callback contract. This checks
  // cooperation among callers, NOT native browser implementation semantics.
  let tail = Promise.resolve();
  let entries = 0;
  return {
    get entries() { return entries; },
    request(name, opts, fn) {
      assert.equal(name, 'aletheFragments:write:v1');
      assert.equal(opts.mode, 'exclusive');
      const mine = tail.then(async () => { entries++; return fn(); });
      tail = mine.catch(() => {});
      return mine;
    }
  };
}
function client(storage, lockManager) {
  const context = {localStorage:storage};
  if (lockManager !== undefined) context.navigator = {locks:lockManager};
  runInNewContext(source.replace(/\bexport\s+(?=(?:async\s+)?function)/g,'') +
    '\nthis.api = { getFragments, addFragment, addNumberedFragment, clearFragments };', context);
  return context.api;
}
function archive(s) {return JSON.parse(s.getItem('aletheFragments'));}

test('two independently loaded clients use one lock for title allocation and append', async () => {
  const s = store('[{"title":"Old","text":"story","legacy":{"a":3}}]');
  const l = locks();
  const a = client(s,l), b = client(s,l);
  const titles = await Promise.all([a.addNumberedFragment('Root-script ','A'), b.addNumberedFragment('Root-script ','B')]);
  assert.deepEqual(titles, ['Root-script 1','Root-script 2']);
  assert.equal(l.entries, 2);
  assert.equal(s.writes, 2);
  assert.deepEqual(archive(s), [
    {title:'Old',text:'story',legacy:{a:3}},
    {title:'Root-script 1',text:'A'},
    {title:'Root-script 2',text:'B'}
  ]);
});

test('explicit duplicate title remains untouched but reports not inserted', async () => {
  const s = store(); const f = client(s,locks());
  assert.equal(await f.addFragment('A','first'),true);
  assert.equal(await f.addFragment('A','second'),false);
  assert.equal(s.writes,1);
  assert.equal(archive(s)[0].text,'first');
});

test('missing Web Locks fails closed without storage access or write', async () => {
  const s=store('[{"title":"Old","text":"legacy"}]');
  const f=client(s);
  await assert.rejects(f.addNumberedFragment('Root-script ','new'), /Web Locks|secure/i);
  await assert.rejects(f.addFragment('New','new'), /Web Locks|secure/i);
  await assert.rejects(f.clearFragments(), /Web Locks|secure/i);
  assert.equal(s.writes,0);
  assert.equal(s.getItem('aletheFragments'),'[{"title":"Old","text":"legacy"}]');
});

test('malformed bytes are preserved exactly on attempted append and numbered allocation', async () => {
  for (const raw of ['', '{oops', '[null]', '[{"title":"no-text"}]']) {
    const s=store(raw); const f=client(s,locks());
    await assert.rejects(f.addNumberedFragment('Root-script ','new'),/archive|invalid|unreadable/i);
    await assert.rejects(f.addFragment('B','new'),/archive|invalid|unreadable/i);
    assert.equal(s.getItem('aletheFragments'),raw);
    assert.equal(s.writes,0);
  }
});

test('write rejection propagates and preserves previous archive', async () => {
  const original='[{"title":"Old","text":"legacy"}]';
  const s=store(original,true);const f=client(s,locks());
  await assert.rejects(f.addNumberedFragment('Root-script ','A'),/Write rejected/);
  assert.equal(s.getItem('aletheFragments'),original);
  assert.equal(s.writes,1);
});

test('clear is serialized behind a pending append and requires the same lock', async () => {
  const s=store(); const l=locks();const a=client(s,l), b=client(s,l);
  await Promise.all([a.addFragment('A','one'),b.clearFragments()]);
  assert.equal(s.getItem('aletheFragments'),null);
  assert.equal(l.entries,2);
});

test('invalid arguments fail before any attempted storage write', async () => {
  const s=store(), f=client(s,locks());
  await assert.rejects(f.addFragment('A',undefined),/strings/i);
  await assert.rejects(f.addNumberedFragment('', 'X'),/strings/i);
  assert.equal(s.writes,0);
});
