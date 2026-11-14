import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sigilSource = readFileSync(join(root, "sigil.js"), "utf8");
const thresholdSource = readFileSync(join(root, "threshold.html"), "utf8");
const thresholdInline = thresholdSource.match(/<script>\s*([\s\S]*?)<\/script>/i)?.[1];
assert.ok(thresholdInline, "Threshold must retain a classic inline script");

function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  return {
    data, writes,
    api: {
      getItem(key) { return data.has(key) ? data.get(key) : null; },
      setItem(key, value) { writes.push([key, String(value)]); data.set(key, String(value)); }
    }
  };
}

function engine(initial, random = 0) {
  const state = storage(initial);
  const math = Object.create(Math);
  math.random = () => random;
  const context = { localStorage: state.api, Math: math };
  runInNewContext(
    sigilSource.replace(/\bexport\s+(?=function)/g, "") +
      "\nthis.api = { getOrCreateSigil, mutateSigil };",
    context
  );
  return { ...state, ...context.api };
}

function threshold(initial) {
  const state = storage(initial);
  const elements = Object.fromEntries(
    ["sigilDisplay", "result", "q1", "q2", "q3"].map(id => [id, { innerText: "", value: "" }])
  );
  const location = { href: "threshold.html" };
  const math = Object.create(Math);
  math.random = () => 0;
  const context = {
    localStorage: state.api, Math: math,
    document: { getElementById(id) { assert.ok(elements[id]); return elements[id]; } },
    window: { location },
    setTimeout() { throw new Error("Navigation must not be scheduled for damaged identity"); }
  };
  runInNewContext(thresholdInline + "\nthis.decide = decideShard;", context);
  return { ...state, elements, location, decide: context.decide };
}

test("an existing empty sigil is damaged data, never permission to overwrite it", () => {
  const s = engine({ aletheSigil: "" });
  assert.throws(() => s.getOrCreateSigil(), /saved sigil|invalid/i);
  assert.equal(s.data.get("aletheSigil"), "");
  assert.equal(s.writes.length, 0);
});

test("mutation refuses malformed stored identity without losing it or history", () => {
  const raw = "Z";
  const history = '["OLD-001"]';
  const s = engine({ aletheSigil: raw, sigilHistory: history });
  assert.throws(() => s.mutateSigil(), /saved sigil|invalid/i);
  assert.equal(s.data.get("aletheSigil"), raw);
  assert.equal(s.data.get("sigilHistory"), history);
  assert.equal(s.writes.length, 0);
});

test("mutation of a base36 digit nine wraps inside the allowed alphabet", () => {
  const s = engine({ aletheSigil: "9BCDEF-123" });
  assert.equal(s.mutateSigil(), "0BCDEF-123");
  assert.equal(s.data.get("aletheSigil"), "0BCDEF-123");
  assert.deepEqual(JSON.parse(s.data.get("sigilHistory")), ["0BCDEF-123"]);
});

test("valid existing sigils remain unchanged until the user mutates them", () => {
  const s = engine({ aletheSigil: "SEED-001" });
  assert.equal(s.getOrCreateSigil(), "SEED-001");
  assert.equal(s.writes.length, 0);
});

test("Threshold warns instead of silently overwriting an empty stored sigil", () => {
  const s = threshold({ aletheSigil: "" });
  assert.match(s.elements.sigilDisplay.innerText, /saved sigil|invalid|unreadable|not cleared/i);
  assert.equal(s.data.get("aletheSigil"), "");
  assert.equal(s.writes.length, 0);
  s.decide();
  assert.equal(s.location.href, "threshold.html");
});

test("Threshold refuses malformed present identities before navigation", () => {
  const s = threshold({ aletheSigil: "broken" });
  assert.match(s.elements.sigilDisplay.innerText, /saved sigil|invalid|unreadable|not cleared/i);
  assert.equal(s.data.get("aletheSigil"), "broken");
  assert.equal(s.writes.length, 0);
  s.decide();
  assert.equal(s.location.href, "threshold.html");
});

test("Threshold still recognises an ordinary existing sigil", () => {
  const s = threshold({ aletheSigil: "ABCDEF-123" });
  assert.equal(s.elements.sigilDisplay.innerText, "Your sigil: ABCDEF-123");
  assert.equal(s.writes.length, 0);
});

test("a missing sigil gets a structurally valid seed even when randomness is zero", () => {
  const s = engine({});
  assert.equal(s.getOrCreateSigil(), "000000-000");
  assert.equal(s.data.get("aletheSigil"), "000000-000");
  const entrance = threshold({});
  assert.equal(entrance.elements.sigilDisplay.innerText, "Your sigil: 000000-000");
  assert.equal(entrance.data.get("aletheSigil"), "000000-000");
});
