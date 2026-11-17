import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import { getForceFromTraits, getForceLore } from "../mythos.js";
import { getSigilPath } from "../sigilpath.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cases = {
  force: {
    file: "force.html", ids: ["force", "lore"],
    initial: ["Calculating...", ""],
    warning: "Could not read your Force. Saved records were not changed.",
    api: { getForceFromTraits, getForceLore }
  },
  sigilpath: {
    file: "sigilpath.html", ids: ["path", "desc", "quest"],
    initial: ["", "", ""],
    warning: "Could not read your Sigilpath. Saved records were not changed.",
    api: { getSigilPath }
  }
};

const healthy = {
  aletheSigil: "ABC123-007",
  sigilTraits: '["REKINDLED"]',
  sigilHistory: "[]"
};

function runPage(which, savedFields, overrides = {}) {
  const page = cases[which];
  const html = readFileSync(join(root, page.file), "utf8");
  const match = html.match(/<script\s+type="module"\s*>([\s\S]*?)<\/script>/);
  assert.ok(match, which + " must preserve its module script");
  const body = match[1].replace(/^\s*import\s*\{[^\n]+\}\s*from\s*['"][^'"]+['"];?\s*$/m, "");
  assert.notEqual(body, match[1], "Only the import is substituted");

  const stored = new Map(Object.entries(savedFields));
  const before = [...stored];
  let writes = 0;
  const storage = {
    getItem: key => stored.has(key) ? stored.get(key) : null,
    setItem: (key, value) => { writes++; stored.set(key, String(value)); },
    removeItem: key => { writes++; stored.delete(key); }
  };
  const nodes = Object.fromEntries(page.ids.map((id, i) => {
    const element = { value: page.initial[i] };
    Object.defineProperties(element, {
      innerText: { get() { return this.value; }, set(v) { this.value = String(v); } },
      textContent: { get() { return this.value; }, set(v) { this.value = String(v); } },
      innerHTML: { set() { throw new Error("Never parse stored history as HTML"); } }
    });
    return [id, element];
  }));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true, value: storage, writable: true
  });
  let thrown;
  try {
    runInNewContext(body, {
      ...page.api, ...overrides,
      document: {
        getElementById: id => {
          assert.ok(Object.hasOwn(nodes, id), "Unexpected element: " + id);
          return nodes[id];
        }
      }
    }, { timeout: 1000 });
  } catch (error) {
    thrown = error;
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
  }
  return {
    html, thrown, values: page.ids.map(id => nodes[id].value),
    before, after: [...stored], writes
  };
}

test("Force and Sigilpath preserve healthy Living Sigil render output", () => {
  const force = runPage("force", healthy);
  const path = runPage("sigilpath", healthy);
  assert.equal(force.thrown, undefined);
  assert.equal(path.thrown, undefined);
  assert.equal(force.values[0], "Kindled");
  assert.match(force.values[1], /fire in their voice/i);
  assert.equal(path.values[0], "The Firebound");
  assert.match(path.values[1], /You burn/);
  assert.match(path.values[2], /Trigger a memory/);
  for (const result of [force, path]) {
    assert.equal(result.writes, 0);
    assert.deepEqual(result.after, result.before);
  }
});

test("Malformed stored traits/history show inert warnings without erasing originals", () => {
  const scenarios = [
    ["force", { ...healthy, sigilTraits: "{broken" }],
    ["sigilpath", { ...healthy, sigilHistory: "{broken" }],
    ["sigilpath", { ...healthy, aletheSigil: "<img onerror=alert(1)>" }]
  ];
  for (const [which, fields] of scenarios) {
    const result = runPage(which, fields);
    assert.equal(result.thrown, undefined, which + " error must be handled");
    assert.equal(result.values[0], cases[which].warning);
    assert.ok(result.values.slice(1).every(v => v === ""), "No stale details");
    assert.equal(result.writes, 0, "Recovery must not rewrite storage");
    assert.deepEqual(result.after, result.before, "Original raw bytes remain");
    assert.doesNotMatch(result.values.join("|"), /<img|broken|onerror|alert/);
    assert.match(result.html, new RegExp('id="' + cases[which].ids[0] + '"[^>]*role="status"'));
  }
});

test("A rendering failure after partial assignment clears all page fields", () => {
  const force = runPage("force", healthy, {
    getForceLore: () => { throw new Error("private lore diagnostic"); }
  });
  const path = runPage("sigilpath", healthy, {
    getSigilPath: () => ({
      name: "Partly drawn",
      get desc() { throw new Error("private path diagnostic"); },
      quest: "No"
    })
  });
  for (const [which, result] of [["force", force], ["sigilpath", path]]) {
    assert.equal(result.thrown, undefined);
    assert.equal(result.values[0], cases[which].warning);
    assert.ok(result.values.slice(1).every(v => v === ""));
    assert.deepEqual(result.after, result.before);
    assert.equal(result.writes, 0);
    assert.doesNotMatch(result.values.join("|"), /private|Partly drawn/);
  }
});
