import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "rootcraft.html"), "utf8");
const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Rootcraft must have its module script");

// Node's navigator has a getter; use a deterministic mock of the Web Locks
// callback contract for these tests, not a claim about real browser locking.
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { locks: { request: (_name, _options, callback) => Promise.resolve().then(callback) } }
});

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("Rootcraft's imported local-only module is available and Wanderer-gated", async () => {
  const { isWanderer, injectFragment } = await import("../breakfold.js");
  globalThis.localStorage = storage();
  assert.equal(isWanderer(), false);
  await assert.rejects(injectFragment("Denied"), /Wanderer/);
  assert.equal(localStorage.getItem("aletheFragments"), null);

  localStorage.setItem("visitorFaction", "Wanderer");
  assert.equal(isWanderer(), true);
  await assert.rejects(injectFragment(" \n "), /empty|Write|fragment/i);
  await assert.rejects(injectFragment("a".repeat(2001)), /long|2000/i);
  assert.equal(localStorage.getItem("aletheFragments"), null);

  const first = await injectFragment("<img src=x onerror=alert(1)>");
  const second = await injectFragment("Another root");
  assert.notEqual(first, second);
  assert.deepEqual(JSON.parse(localStorage.getItem("aletheFragments")), [
    { title: first, text: "<img src=x onerror=alert(1)>" },
    { title: second, text: "Another root" }
  ]);
});

test("Malformed existing archive is not silently replaced", async () => {
  const { injectFragment } = await import("../breakfold.js");
  globalThis.localStorage = storage({
    visitorFaction: "Wanderer",
    aletheFragments: "{damaged"
  });
  await assert.rejects(injectFragment("New root"));
  assert.equal(localStorage.getItem("aletheFragments"), "{damaged");
});

test("Rootcraft UI reports denial, success, and storage errors accurately", async () => {
  assert.match(script, /import\s*\{\s*injectFragment,\s*isWanderer\s*\}\s*from\s*["']\.\/breakfold\.js["']/);
  const stripped = script.replace(/^\s*import\s*\{\s*injectFragment,\s*isWanderer\s*\}\s*from\s*["']\.\/breakfold\.js["'];?\s*$/m, "");
  assert.notEqual(stripped, script);
  const nodes = { frag: { value: "hello" }, result: { innerText: "" } };
  let permitted = false;
  let shouldThrow = false;
  let called = 0;
  const context = {
    window: {},
    document: { getElementById(id) { assert.ok(id in nodes); return nodes[id]; } },
    isWanderer: () => permitted,
    injectFragment: () => {
      called += 1;
      if (shouldThrow) throw new Error("Storage unavailable");
      return "Root-script 1";
    }
  };
  runInNewContext(stripped, context);
  await context.window.cast();
  assert.equal(called, 0);
  assert.match(nodes.result.innerText, /Only Wanderers/);
  permitted = true;
  await context.window.cast();
  assert.equal(called, 1);
  assert.match(nodes.result.innerText, /saved|injected/i);
  shouldThrow = true;
  await context.window.cast();
  assert.equal(called, 2);
  assert.doesNotMatch(nodes.result.innerText, /injected|saved/i);
});
