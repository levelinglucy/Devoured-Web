import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'sigil.js'), 'utf8');

function fixture(initial = {}, fail = () => false) {
  const records = new Map(Object.entries(initial));
  const operations = [];
  const localStorage = {
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) {
      operations.push(['set', key]);
      if (fail('set', key, operations.length)) throw new Error("Blocked write: " + key);
      records.set(key, String(value));
    },
    removeItem(key) {
      operations.push(['remove', key]);
      if (fail('remove', key, operations.length)) throw new Error("Blocked removal: " + key);
      records.delete(key);
    }
  };
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;
  const context = { localStorage, Math: deterministicMath };
  runInNewContext(
    source.replace(/\bexport\s+(?=function)/g, '') + '\nthis.mutate = mutateSigil;',
    context
  );
  return { mutate: context.mutate, records, operations };
}

test('failed mutation-history write must not advance current sigil', () => {
  const history = '["PAST-111"]';
  const s = fixture({ aletheSigil: 'ABCDEF-123', sigilHistory: history }, (op, key) => op === 'set' && key === 'sigilHistory');
  assert.throws(() => s.mutate(), /Blocked write: sigilHistory/);
  assert.equal(s.records.get('aletheSigil'), 'ABCDEF-123');
  assert.equal(s.records.get('sigilHistory'), history);
});

test('failed current-sigil write restores exact historical bytes', () => {
  const history = '[ "PAST-111" ]';
  const s = fixture({ aletheSigil: 'ABCDEF-123', sigilHistory: history }, (op, key) => op === 'set' && key === 'aletheSigil');
  assert.throws(() => s.mutate(), /Blocked write: aletheSigil/);
  assert.equal(s.records.get('aletheSigil'), 'ABCDEF-123');
  assert.equal(s.records.get('sigilHistory'), history);
  assert.deepEqual(s.operations.map(x => x.join(':')), [
    'set:sigilHistory', 'set:aletheSigil', 'set:sigilHistory'
  ]);
});

test('failed current-sigil write removes a newly created history key', () => {
  const s = fixture({ aletheSigil: 'ABCDEF-123' }, (op, key) => op === 'set' && key === 'aletheSigil');
  assert.throws(() => s.mutate(), /Blocked write: aletheSigil/);
  assert.equal(s.records.get('aletheSigil'), 'ABCDEF-123');
  assert.equal(s.records.has('sigilHistory'), false);
  assert.deepEqual(s.operations.map(x => x.join(':')), [
    'set:sigilHistory', 'set:aletheSigil', 'remove:sigilHistory'
  ]);
});

test('failed rollback reports possible inconsistency rather than claiming success', () => {
  const history = '["PAST-111"]';
  let historyWrites = 0;
  const s = fixture({ aletheSigil: 'ABCDEF-123', sigilHistory: history }, (op, key) => {
    if (op === 'set' && key === 'sigilHistory') return ++historyWrites === 2;
    return op === 'set' && key === 'aletheSigil';
  });
  assert.throws(() => s.mutate(), /inconsistent|manual recovery/i);
  assert.equal(s.records.get('aletheSigil'), 'ABCDEF-123');
  assert.notEqual(s.records.get('sigilHistory'), history);
});
