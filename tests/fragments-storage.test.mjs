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
  const context = { localStorage: storage };
  runInNewContext(source.replace(/\bexport\s+(?=function)/g, "") +
    "\nthis.api = { getFragments, addFragment };", context);
  return { entries, get writes() { return writes; }, ...context.api };
}

test("new fragment archives begin empty and round-trip ordinary entries", () => {
  const state = fixture();
  assert.equal(state.getFragments().length, 0);
  assert.equal(state.entries.has("aletheFragments"), false);
  state.addFragment("First", "The tide keeps its shells");
  assert.deepEqual(JSON.parse(state.entries.get("aletheFragments")),
    [{ title: "First", text: "The tide keeps its shells" }]);
  state.addFragment("First", "Do not overwrite an existing title");
  assert.equal(state.writes, 1);
});

test("present but damaged archive roots are refused without replacing raw data", () => {
  for (const raw of ["", "null", "{}", "0", '"broken"', "{broken"]) {
    const state = fixture(raw);
    assert.throws(() => state.getFragments(), /fragment|archive|unreadable|invalid/i, raw);
    assert.throws(() => state.addFragment("New", "safe"), /fragment|archive|unreadable|invalid/i, raw);
    assert.equal(state.entries.get("aletheFragments"), raw);
    assert.equal(state.writes, 0);
  }
});

test("malformed individual entries are not silently reserialized on append", () => {
  for (const raw of [
    '[null]', '["free text"]', '[["array"]]',
    '[{"title":"old"}]', '[{"text":"orphan"}]',
    '[{"title":"old","text":null}]'
  ]) {
    const state = fixture(raw);
    assert.throws(() => state.addFragment("New", "safe"), /fragment|archive|invalid/i, raw);
    assert.equal(state.entries.get("aletheFragments"), raw);
    assert.equal(state.writes, 0);
  }
});

test("valid older entries and additional custom fields are preserved", () => {
  const raw = '[{"title":"Old","text":"Lore","source":"manual"}]';
  const state = fixture(raw);
  state.addFragment("New", "Hello");
  const entries = JSON.parse(state.entries.get("aletheFragments"));
  assert.deepEqual(entries, [
    { title: "Old", text: "Lore", source: "manual" },
    { title: "New", text: "Hello" }
  ]);
});

test("a rejected archive write does not claim persistence or erase original data", () => {
  const raw = '[{"title":"Old","text":"Lore"}]';
  const state = fixture(raw, true);
  assert.throws(() => state.addFragment("New", "safe"), /Storage rejected write/);
  assert.equal(state.entries.get("aletheFragments"), raw);
  assert.equal(state.writes, 1);
});

test("a fragment writer refuses fields that would serialize as missing", () => {
  const state = fixture();
  assert.throws(() => state.addFragment("Bad", undefined), /fragment|title|text|invalid/i);
  assert.throws(() => state.addFragment(null, "Text"), /fragment|title|text|invalid/i);
  assert.equal(state.writes, 0);
  assert.equal(state.entries.has("aletheFragments"), false);
});
