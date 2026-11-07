import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = {
  "pantheon.html": { id: "forms", imported: "echoforms", module: "pantheon.js" },
  "trail.html": { id: "trail", imported: "getTrail", module: "pagespawn.js" },
  "shardthrone.html": { id: "registry", imported: "getThroneRegistry", module: "shardthrone.js" }
};
function scriptFor(file) {
  const html = readFileSync(join(root, file), "utf8");
  const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script, "Missing inline module: " + file);
  return script;
}
function node(tag) {
  return {
    tagName: tag.toUpperCase(), className: "", textContent: "", children: [],
    appendChild(child) { this.children.push(child); },
    replaceChildren(...children) { this.children = children; },
    set innerHTML(_) { throw new Error("Stored and narrative values must not be parsed as HTML"); }
  };
}
function render(file, value) {
  const info = pages[file];
  const original = scriptFor(file);
  const importLine = /^\s*import\s+\{\s*([A-Za-z]+)\s*\}\s+from\s+['"]\.\/([^'"]+)['"];\s*$/m;
  const match = original.match(importLine);
  assert.ok(match, "Expected one named local import in " + file);
  assert.equal(match[1], info.imported);
  assert.equal(match[2], info.module);
  const container = node("div");
  const source = original.replace(importLine, "");
  const dependencies = {
    echoforms: value,
    getTrail: typeof value === "function" ? value : () => value,
    getThroneRegistry: typeof value === "function" ? value : () => value
  };
  runInNewContext(source, {
    ...dependencies,
    document: {
      getElementById(id) { assert.equal(id, info.id); return container; },
      createElement: (tag) => node(tag)
    }
  });
  return container;
}

test("Pantheon, Ritual Trail and Shard Thrones contain parseable inline modules", () => {
  for (const file of Object.keys(pages)) {
    const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
      input: scriptFor(file), encoding: "utf8"
    });
    assert.equal(result.status, 0, file + ": " + result.stderr);
  }
});

test("Pantheon retains all public description fields as inert text", () => {
  const hostile = '<img src=x onerror="alert(1)">';
  const item = { name: hostile, faction: "Mirror", origin: "Archive", quote: hostile, status: "Awake" };
  const script = scriptFor("pantheon.html");
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  const container = render("pantheon.html", [item]);
  assert.equal(container.children.length, 1);
  const card = container.children[0];
  assert.equal(card.className, "form");
  assert.deepEqual(card.children.map(n => n.className), ["name", "faction", "quote", "status"]);
  assert.equal(card.children[0].textContent, hostile);
  assert.equal(card.children[1].textContent, "Faction: Mirror — Origin: Archive");
  assert.equal(card.children[2].textContent, "“" + hostile + "”");
  assert.equal(card.children[3].textContent, "State: Awake");
});

test("Ritual Trail shows saved title, filename, time and bounded preview inertly", () => {
  const hostile = '<svg onload="alert(1)">';
  const script = scriptFor("trail.html");
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  const card = render("trail.html", [{
    title: hostile, filename: hostile, created: "2026-11-07", content: hostile.repeat(20)
  }]).children[0];
  assert.equal(card.className, "spawn");
  assert.deepEqual(card.children.map(n => n.tagName), ["DIV", "DIV", "PRE"]);
  assert.equal(card.children[0].textContent, hostile);
  assert.equal(card.children[1].textContent, "[" + hostile + "] - 2026-11-07");
  assert.equal(card.children[2].textContent, hostile.repeat(20).slice(0, 200) + "...");
});

test("Claimed Thrones shows stored sigils, titles and time inertly", () => {
  const hostile = '<img src=x onerror="alert(1)">';
  const script = scriptFor("shardthrone.html");
  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  const card = render("shardthrone.html", [{
    sigil: hostile, title: hostile, crowned: "2026-11-07T12:00:00Z"
  }]).children[0];
  assert.equal(card.className, "throne");
  assert.deepEqual(card.children.map(n => n.className), ["sigil", "title", "date"]);
  assert.equal(card.children[0].textContent, "[" + hostile + "]");
  assert.equal(card.children[1].textContent, hostile);
  assert.match(card.children[2].textContent, /^Crowned on /);
});

test("Empty narrative lists show a message without HTML interpolation", () => {
  for (const file of Object.keys(pages)) {
    const container = render(file, []);
    assert.equal(container.children.length, 1, file);
    assert.match(container.children[0].textContent, /no .*yet|no .*claimed|no .*recorded/i, file);
  }
});

test("Malformed local archive values cannot destroy their stored source", () => {
  for (const file of ["trail.html", "shardthrone.html"]) {
    const unreadable = render(file, () => { throw new SyntaxError("invalid JSON"); });
    assert.match(unreadable.textContent, /cannot|could not|unreadable|unable/i, file);
    const wrongShape = render(file, { invalid: true });
    assert.match(wrongShape.textContent, /cannot|could not|unreadable|unable/i, file);
  }
});
