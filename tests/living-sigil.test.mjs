import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "mysig.html"), "utf8");
const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Living Sigil must have its inline module");

const importLine = /^\s*import\s+\{\s*getOrCreateSigil,\s*getSigilHistory,\s*getTraits\s*\}\s+from\s+["']\.\/sigil\.js["'];?\s*$/m;

test("Living Sigil inline module parses as JavaScript", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: script, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
});

function render(sigil, traits, history) {
  class Node {
    constructor(tagName) { this.tagName = tagName; this.textContent = ""; this.children = []; }
    replaceChildren(...children) { this.children = children; }
    appendChild(node) { this.children.push(node); }
    append(...nodes) { this.children.push(...nodes); }
    set innerHTML(_) { throw new Error("Untrusted sigil content must not be parsed as HTML"); }
  }
  const elements = {
    sigil: new Node("DIV"),
    traits: new Node("DIV"),
    history: new Node("DIV")
  };
  const withoutImport = script.replace(importLine, "");
  assert.notEqual(withoutImport, script, "Expected a normal sigil.js import");
  runInNewContext(withoutImport, {
    getOrCreateSigil: () => sigil,
    getTraits: () => traits,
    getSigilHistory: () => history,
    document: {
      getElementById(id) { assert.ok(id in elements, "Unknown element " + id); return elements[id]; },
      createElement(tagName) { return new Node(tagName.toUpperCase()); },
      createTextNode(text) { const n = new Node("#text"); n.textContent = text; return n; }
    }
  });
  return elements;
}

test("Living Sigil displays current form, traits and mutation history as text", () => {
  const hostile = '<img src=x onerror="alert(1)">';
  const elements = render(hostile, [hostile, "SEEKER"], [hostile, "ORIG-012"]);
  for (const [section, heading, values] of [
    ["sigil", "Current Form", [hostile]],
    ["traits", "Traits", [hostile, "SEEKER"]],
    ["history", "Mutation History", [hostile, "ORIG-012"]]
  ]) {
    const children = elements[section].children;
    assert.equal(children[0].tagName, "H2");
    assert.equal(children[0].textContent, heading);
    assert.deepEqual(children.slice(1).map(n => n.tagName), values.map(() => "SPAN"));
    assert.deepEqual(children.slice(1).map(n => n.textContent), values);
  }
});

test("Living Sigil keeps original empty-list messages", () => {
  const elements = render("SEED-001", [], []);
  assert.equal(elements.sigil.children[1].textContent, "SEED-001");
  assert.equal(elements.traits.children[1].textContent, "None");
  assert.equal(elements.history.children[1].textContent, "First form only.");
});
