import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const echoformSource = readFileSync(join(root, "echoform.js"), "utf8");
const html = readFileSync(join(root, "echoform-glyph.html"), "utf8");
const inline = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline, "Glyph needs its inline module");
const pageImport = /^\s*import\s+\{\s*trackVisit\s*\}\s+from\s+['"]\.\/echoform\.js['"];?\s*$/m;

function fixture(raw = null) {
  const storage = new Map();
  if (raw !== null) storage.set("echoformVisits", raw);
  const context = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value))
    }
  };
  runInNewContext(echoformSource.replace(/\bexport\s+(?=function)/g, "") +
    "\nthis.api = { trackVisit };", context);
  const renderGlyph = () => {
    const message = { innerText: "Loading Glyph’s voice..." };
    assert.match(inline, pageImport);
    runInNewContext(inline.replace(pageImport, ""), {
      trackVisit: context.api.trackVisit,
      document: {
        getElementById(id) {
          assert.equal(id, "message");
          return message;
        }
      }
    });
    return message.innerText;
  };
  return { storage, trackVisit: context.api.trackVisit, renderGlyph };
}

test("Glyph's full visit cycle retains the original four narrative responses", () => {
  const state = fixture();
  assert.equal(state.renderGlyph(), "…A mirror speaks once. You heard it.");
  assert.equal(state.renderGlyph(), "Twice? That means it’s true. Or it’s a loop.");
  assert.equal(state.renderGlyph(), "You keep coming back. You know what you are.");
  assert.equal(state.renderGlyph(), "Glyph is no longer just an echo. It has become something else.");
  assert.equal(JSON.parse(state.storage.get("echoformVisits")).Glyph, 4);
});

test("Glyph module syntax remains valid", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: inline, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
});

test("damaged Echoform visits show a warning without replacing the original storage", () => {
  for (const raw of [
    "{", "null", "[]", '"wrong type"', '{"Glyph":"2"}',
    '{"Glyph":-1}', '{"Glyph":2.5}', '{"Glyph":1e309}',
    '{"Glyph":9007199254740991}'
  ]) {
    const state = fixture(raw);
    assert.match(state.renderGlyph(), /visit history.*(unreadable|invalid|not cleared|untouched)/i, raw);
    assert.equal(state.storage.get("echoformVisits"), raw);
  }
});

test("Echoform treats special names as literal own counters", () => {
  const state = fixture('{"Glyph":3}');
  for (const name of ["__proto__", "constructor"]) {
    assert.equal(state.trackVisit(name), 1);
  }
  const data = JSON.parse(state.storage.get("echoformVisits"));
  assert.equal(data.Glyph, 3);
  for (const name of ["__proto__", "constructor"]) {
    assert.equal(Object.hasOwn(data, name), true, name);
    assert.equal(data[name], 1, name);
  }
  assert.equal(({}).polluted, undefined);
});

test("Echoform refuses an unsafe increment but accepts the final safe integer", () => {
  const before = '{"Glyph":9007199254740990}';
  const state = fixture(before);
  assert.equal(state.trackVisit("Glyph"), Number.MAX_SAFE_INTEGER);
  const final = state.storage.get("echoformVisits");
  assert.equal(JSON.parse(final).Glyph, Number.MAX_SAFE_INTEGER);
  assert.throws(() => state.trackVisit("Glyph"), /safe|count|invalid/i);
  assert.equal(state.storage.get("echoformVisits"), final);
});
