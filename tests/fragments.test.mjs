import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "fragments.html"), "utf8");
const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);

function element(tag) {
  return {
    tag, className: "", textContent: "", children: [],
    appendChild(node) { this.children.push(node); },
    replaceChildren(...nodes) { this.children = nodes; }
  };
}

function render(entries) {
  const container = element("div");
  const stripped = script.replace(/^\s*import\s*\{\s*getFragments\s*\}\s*from\s*["']\.\/fragments\.js["'];?\s*$/m, "");
  assert.notEqual(stripped, script, "Expected historical fragment module import");
  runInNewContext(stripped, {
    getFragments: () => entries,
    document: {
      createElement: (tag) => element(tag),
      getElementById: (id) => {
        assert.equal(id, "fragments");
        return container;
      }
    }
  });
  return container;
}

test("Archive display never interpolates fragment values into HTML", () => {
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  const container = render([{ title: "<img src=x>", text: "<svg onload=alert(1)>" }]);
  assert.equal(container.children.length, 1);
  const card = container.children[0];
  assert.equal(card.children[0].textContent, "<img src=x>");
  assert.equal(card.children[1].textContent, "<svg onload=alert(1)>");
});

test("Empty archive shows helpful inert text without HTML", () => {
  const container = render([]);
  assert.equal(container.children.length, 1);
  assert.match(container.children[0].textContent, /No fragments/);
});
