import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "fragments.js"), "utf8");

function fixture(raw = null, failWrite = false) {
  const entries = new Map();
  if (raw !== null) entries.set("aletheFragments", raw);
  let writes = 0;
  const storage = {
    getItem: key => entries.has(key) ? entries.get(key) : null,
    setItem(key, value) {
      writes += 1;
      if (failWrite) throw new Error("Storage rejected write");
      entries.set(key, String(value));
    },
    removeItem: key => entries.delete(key)
  };
  const navigator = { locks: { request: (name, options, callback) => {
    assert.equal(name, "aletheFragments:write:v1");
    assert.equal(options.mode, "exclusive");
    return Promise.resolve().then(callback);
  } } };
  const context = { localStorage: storage, navigator };
  runInNewContext(source.replace(/\bexport\s+(?=(?:async\s+)?function)/g, "") +
    "\nthis.api = { getFragments, addFragment };", context);
  return { entries, get writes() { return writes; }, ...context.api };
}

test("new fragment archives begin empty and round-trip ordinary entries", async () => {
  const state = fixture();
  assert.equal(state.getFragments().length, 0);
  assert.equal(state.entries.has("aletheFragments"), false);
  assert.equal(await state.addFragment("First", "The tide keeps its shells"), true);
  assert.deepEqual(JSON.parse(state.entries.get("aletheFragments")),
    [{ title: "First", text: "The tide keeps its shells" }]);
  assert.equal(await state.addFragment("First", "Do not overwrite an existing title"), false);
  assert.equal(state.writes, 1);
});

test("present but damaged archive roots are refused without replacing raw data", async () => {
  for (const raw of ["", "null", "{}", "0", '"broken"', "{broken"]) {
    const state = fixture(raw);
    assert.throws(() => state.getFragments(), /fragment|archive|unreadable|invalid/i, raw);
    await assert.rejects(state.addFragment("New", "safe"), /fragment|archive|unreadable|invalid/i, raw);
    assert.equal(state.entries.get("aletheFragments"), raw);
    assert.equal(state.writes, 0);
  }
});

test("malformed individual entries are not silently reserialized on append", async () => {
  for (const raw of [
    '[null]', '["free text"]', '[["array"]]',
    '[{"title":"old"}]', '[{"text":"orphan"}]',
    '[{"title":"old","text":null}]'
  ]) {
    const state = fixture(raw);
    await assert.rejects(state.addFragment("New", "safe"), /fragment|archive|invalid/i, raw);
    assert.equal(state.entries.get("aletheFragments"), raw);
    assert.equal(state.writes, 0);
  }
});

test("valid older entries and additional custom fields are preserved", async () => {
  const raw = '[{"title":"Old","text":"Lore","source":"manual"}]';
  const state = fixture(raw);
  await state.addFragment("New", "Hello");
  const entries = JSON.parse(state.entries.get("aletheFragments"));
  assert.deepEqual(entries, [
    { title: "Old", text: "Lore", source: "manual" },
    { title: "New", text: "Hello" }
  ]);
});

test("a rejected archive write does not claim persistence or erase original data", async () => {
  const raw = '[{"title":"Old","text":"Lore"}]';
  const state = fixture(raw, true);
  await assert.rejects(state.addFragment("New", "safe"), /Storage rejected write/);
  assert.equal(state.entries.get("aletheFragments"), raw);
  assert.equal(state.writes, 1);
});

test("a fragment writer refuses fields that would serialize as missing", async () => {
  const state = fixture();
  await assert.rejects(state.addFragment("Bad", undefined), /fragment|title|text|invalid/i);
  await assert.rejects(state.addFragment(null, "Text"), /fragment|title|text|invalid/i);
  assert.equal(state.writes, 0);
  assert.equal(state.entries.has("aletheFragments"), false);
});

test("appending preserves unusual valid historical JSON bytes verbatim", async () => {
  const raw = ' [ {"title":"Old","text":"Lore","big":1e999,"precise":9007199254740993,"k":1,"k":2,"spelling":"\\u0061"} ] \r\n';
  const state = fixture(raw);
  await state.addFragment("New", "Now");
  const closing = raw.lastIndexOf("]");
  assert.equal(state.entries.get("aletheFragments"),
    raw.slice(0, closing) + ',{"title":"New","text":"Now"}' + raw.slice(closing));
  assert.equal(state.writes, 1);
  assert.equal(state.getFragments().length, 2);
  assert.equal(state.getFragments()[0].title, "Old");
});

test("appending to a formatted empty array preserves its existing whitespace", async () => {
  const raw = '\n [ \t ]\n';
  const state = fixture(raw);
  await state.addFragment("First", "Hello");
  assert.equal(state.entries.get("aletheFragments"), '\n [ \t {"title":"First","text":"Hello"}]\n');
});

test("duplicate titles preserve raw legacy JSON without writes", async () => {
  const raw = '[{"title":"Old","text":"Lore","n":9007199254740993}]';
  const state = fixture(raw);
  await state.addFragment("Old", "Changed");
  assert.equal(state.writes, 0);
  assert.equal(state.entries.get("aletheFragments"), raw);
});
