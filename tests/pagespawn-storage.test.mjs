import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(root, "..", "pagespawn.js"), "utf8");

function fixture(raw = null, failWrite = false) {
  const values = new Map();
  if (raw !== null) values.set("aletheSpawnTrail", raw);
  let writes = 0;
  const ctx = {
    localStorage: {
      getItem(key) { return values.has(key) ? values.get(key) : null; },
      setItem(key, value) {
        writes++;
        if (failWrite) throw new Error("Storage quota exceeded");
        values.set(key, String(value));
      }
    }
  };
  runInNewContext(source.replace(/\bexport\s+(?=function)/g, "") + "\nthis.api = { registerSpawn, getTrail };", ctx);
  return { ...ctx.api, values, get writes() { return writes; } };
}

test("absent ritual trail starts empty and receives an ordinary spawn", () => {
  const state = fixture();
  assert.equal(state.getTrail().length, 0);
  const made = state.registerSpawn("First", "first.txt", "Hello");
  assert.equal(made.title, "First");
  assert.equal(state.writes, 1);
  assert.deepEqual(JSON.parse(state.values.get("aletheSpawnTrail")), [
    { title: "First", filename: "first.txt", content: "Hello", created: made.created }
  ]);
});

test("present blank and invalid JSON are never replaced by an append", () => {
  for (const raw of ["", "not-json", "{broken"]) {
    const state = fixture(raw);
    assert.throws(() => state.getTrail(), /unreadable|invalid|unexpected/i);
    assert.throws(() => state.registerSpawn("New", "new.txt", "text"));
    assert.equal(state.writes, 0);
    assert.equal(state.values.get("aletheSpawnTrail"), raw);
  }
});

test("non-array and malformed historical entries are not silently rewritten", () => {
  const raws = ["null", "{}", '"text"', "[null]", '[{"title":"Legacy"}]', '[{"title":9,"filename":"f","content":"t","created":"date"}]'];
  for (const raw of raws) {
    const state = fixture(raw);
    assert.throws(() => state.registerSpawn("New", "new.txt", "text"));
    assert.equal(state.writes, 0, raw);
    assert.equal(state.values.get("aletheSpawnTrail"), raw);
  }
});

test("appending preserves earlier titles, fields, order and stored identity", () => {
  const original = [{ title: "Repeated", filename: "1.txt", content: "One", created: "2020-01-01T00:00:00.000Z", custom: { untouched: 1 } }];
  const state = fixture(JSON.stringify(original));
  state.registerSpawn("Repeated", "2.txt", "Two");
  const saved = JSON.parse(state.values.get("aletheSpawnTrail"));
  assert.equal(saved.length, 2);
  assert.deepEqual(saved[0], original[0]);
  assert.equal(saved[1].title, "Repeated");
  assert.equal(saved[1].content, "Two");
});

test("invalid new records are rejected before touching existing history", () => {
  for (const args of [[undefined, "f", "t"], ["a", null, "t"], ["a", "f", { text: "x" }]]) {
    const state = fixture("[]");
    assert.throws(() => state.registerSpawn(...args), /string/i);
    assert.equal(state.writes, 0);
    assert.equal(state.values.get("aletheSpawnTrail"), "[]");
  }
});

test("failed browser storage write is not misreported as a saved spawn", () => {
  const raw = "[]";
  const state = fixture(raw, true);
  assert.throws(() => state.registerSpawn("a", "f", "t"), /quota/i);
  assert.equal(state.values.get("aletheSpawnTrail"), raw);
});

test("appending leaves historical JSON bytes untouched, including unknown fields", () => {
  const raw = '[\n {"title":"Old","filename":"old","content":"x","created":"2020", "n":1e999,"k":1,"k":2}\n]  ';
  const state = fixture(raw);
  state.registerSpawn("New", "new", "fresh");
  const actual = state.values.get("aletheSpawnTrail");
  const at = raw.lastIndexOf("]");
  assert.ok(actual.startsWith(raw.slice(0, at) + ","));
  const newEntry = actual.slice(at + 1, -raw.slice(at).length);
  assert.deepEqual(JSON.parse(newEntry), {
    title: "New", filename: "new", content: "fresh", created: JSON.parse(actual)[1].created
  });
  assert.ok(actual.endsWith(raw.slice(at)));
  assert.match(actual, /1e999,"k":1,"k":2/);
});

test("reader still exposes legacy partial records for inert display", () => {
  const raw = '[null,{"title":"Legacy"}]';
  const state = fixture(raw);
  const records = state.getTrail();
  assert.equal(records.length, 2);
  assert.equal(records[0], null);
  assert.equal(records[1].title, "Legacy");
  assert.equal(state.writes, 0);
  assert.equal(state.values.get("aletheSpawnTrail"), raw);
});
