import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "councilfire.html"), "utf8");
const moduleScript = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(moduleScript, "Councilfire page must retain an inline module");
const importLine = /^\s*import\s+\{\s*summonCouncil\s*\}\s+from\s+['"]\.\/councilfire\.js['"];?\s*$/m;
assert.match(moduleScript, importLine);

function makeNode(tag = "div") {
  return {
    tagName: tag.toUpperCase(), className: "", textContent: "", children: [],
    replaceChildren(...nodes) { this.children = nodes; this.textContent = ""; },
    appendChild(node) { this.children.push(node); },
    set innerHTML(_) { throw new Error("Untrusted dialogue must not become HTML"); }
  };
}

function launch(summonCouncil) {
  const dialogue = makeNode();
  dialogue.textContent = "Gathering Echoforms...";
  const document = {
    getElementById(id) { assert.equal(id, "dialogue"); return dialogue; },
    createElement: (tag) => makeNode(tag)
  };
  // Run the actual inline body with imported work injected as a dependency.
  // Wrapping top-level await exposes its outcome to Node's VM test harness.
  const source = moduleScript.replace(importLine, "");
  const context = { summonCouncil, document };
  runInNewContext("globalThis.__request = (async () => {\n" + source + "\n})();", context);
  return { dialogue, request: context.__request };
}

test("Councilfire shows inert failure text instead of endless Gathering", async () => {
  const { dialogue, request } = launch(async () => {
    throw new Error('<img src=x onerror="alert(1)"> corrupt saved throne registry');
  });
  await assert.doesNotReject(request);
  assert.match(dialogue.textContent, /council|unavailable|could not|unable/i);
  assert.doesNotMatch(dialogue.textContent, /Gathering|<img|corrupt saved|alert/);
  assert.deepEqual(dialogue.children, []);
  assert.match(html, /id="dialogue"[^>]*role="status"/i);
});

test("Councilfire still renders dialogue as inert text on success", async () => {
  const unsafe = '<img src=x onerror="alert(1)">';
  const lines = [unsafe, "Ash speaks", "Lucid speaks", "Sentinel speaks", "Null speaks"];
  const { dialogue, request } = launch(async () => lines);
  await assert.doesNotReject(request);
  assert.equal(dialogue.textContent, "");
  assert.deepEqual(dialogue.children.map(n => n.textContent), lines);
  assert.ok(dialogue.children.every(n => n.tagName === "DIV" && n.className === "line"));
});
