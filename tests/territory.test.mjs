import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "territory.html"), "utf8");
const inline = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline, "Territory needs its inline module");
const pageImport = /^\s*import\s+\{\s*contributeToFaction,\s*getDominantFaction,\s*getAllFactionPower\s*\}\s+from\s+['"]\.\/warpath\.js['"];?\s*$/m;
const warpath = readFileSync(join(root, "warpath.js"), "utf8");
const warpathImport = /^\s*import\s+\{\s*getFaction\s*\}\s+from\s+['"]\.\/faction\.js['"];?\s*$/m;

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._text = "";
    this.innerText = "";
  }
  get textContent() {
    return this.children.length ? this.children.map(n => n.textContent).join("") : this._text;
  }
  set textContent(value) { this._text = value; this.children = []; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; this._text = ""; }
  set innerHTML(_) { throw new Error("Stored faction names must not be parsed as HTML"); }
}

function render(initialTally, faction, options = {}) {
  const starting = Object.hasOwn(options, "raw") ? options.raw : JSON.stringify(initialTally);
  const storage = new Map();
  if (starting !== null) storage.set("warpathTally", starting);
  const context = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    getFaction: () => faction
  };
  assert.match(warpath, warpathImport);
  runInNewContext(
    warpath.replace(warpathImport, "").replace(/\bexport\s+(?=function)/g, "") +
    "\nthis.services = { contributeToFaction, getDominantFaction, getAllFactionPower };",
    context
  );
  assert.match(inline, pageImport);
  const elements = { top: new Node("div"), table: new Node("div") };
  elements.table.textContent = "Loading data...";
  runInNewContext(inline.replace(pageImport, ""), {
    ...context.services,
    document: {
      getElementById(id) { assert.ok(id in elements); return elements[id]; },
      createElement(tag) { return new Node(tag); }
    }
  });
  const raw = storage.get("warpathTally") ?? null;
  let tally;
  try { tally = raw === null ? null : JSON.parse(raw); } catch { tally = null; }
  return { elements, tally, raw };
}

test("Territory inline module has valid JavaScript syntax", () => {
  const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: inline, encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
});

test("Territory renders local faction names inertly with real tally logic", () => {
  const hostile = '<img src=x onerror="alert(1)">';
  const { elements, tally } = render({ "The Reflected": 2, [hostile]: 4 }, hostile);
  assert.equal(tally[hostile], 5, "Page still records a faction visit");
  assert.equal(elements.top.innerText, "Dominant Faction: " + hostile);
  assert.deepEqual(elements.table.children.map(n => n.textContent), [
    "> " + hostile + " — Power: 5",
    "> The Reflected — Power: 2"
  ]);
  assert.deepEqual(elements.table.children.map(n => n.tagName), ["DIV", "DIV"]);
});

test("Territory replaces the loading placeholder and preserves ordinary tally labels", () => {
  const { elements, tally } = render({}, "The Flamebound");
  assert.equal(tally["The Flamebound"], 1);
  assert.equal(elements.top.innerText, "Dominant Faction: The Flamebound");
  assert.deepEqual(elements.table.children.map(n => n.textContent), [
    "> The Flamebound — Power: 1"
  ]);
  assert.doesNotMatch(elements.table.textContent, /Loading data/);
});

test("Territory refuses corrupt or wrongly shaped tallies without erasing local records", () => {
  const invalid = [
    "{", "null", "[]", '"invalid"',
    '{"The Flamebound":"12"}',
    '{"The Flamebound":-1}',
    '{"The Flamebound":1e309}',
    '{"The Flamebound":9007199254740991}'
  ];
  for (const raw of invalid) {
    const { elements, raw: after } = render(null, "The Flamebound", { raw });
    assert.equal(after, raw, "Damaged data must remain available for manual recovery");
    assert.equal(elements.top.innerText, "Dominant Faction: unavailable");
    assert.match(elements.table.textContent, /saved faction tally.*not cleared/i);
    assert.equal(elements.table.children.length, 0);
  }
});

test("Territory stores special property names as real faction keys", () => {
  for (const faction of ["__proto__", "constructor"]) {
    const { elements, tally } = render({ "The Reflected": 2 }, faction);
    assert.equal(Object.hasOwn(tally, faction), true, faction);
    assert.equal(tally[faction], 1);
    assert.equal(tally["The Reflected"], 2);
    assert.ok(elements.table.children.some(n => n.textContent.includes(faction)));
  }
});

test("Territory refuses count overflow and retains the exact previous tally", () => {
  const raw = '{"The Flamebound":9007199254740991}';
  const { elements, raw: after } = render(null, "The Flamebound", { raw });
  assert.equal(after, raw);
  assert.equal(elements.top.innerText, "Dominant Faction: unavailable");
});
