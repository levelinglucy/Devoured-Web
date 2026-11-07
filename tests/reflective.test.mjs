import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "reflective.html"), "utf8");
const match = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i);
assert.ok(match, "Reflective Shard must have a module script");
const moduleSource = match[1];

test("Reflective Shard inline module has valid native JavaScript syntax", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: moduleSource,
    encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
});

function render(traits) {
  const nodes = { sigil: { innerText: "" }, echo: { innerText: "" } };
  const withoutImport = moduleSource.replace(
    /^\s*import\s+\{\s*getOrCreateSigil,\s*hasTrait\s*\}\s+from\s+['"]\.\/sigil\.js['"];\s*$/m,
    ""
  );
  assert.notEqual(withoutImport, moduleSource, "Expected the real sigil module import");
  runInNewContext(withoutImport, {
    getOrCreateSigil: () => "TEST-001",
    hasTrait: (name) => traits.has(name),
    document: {
      getElementById: (id) => {
        assert.ok(id in nodes, "unexpected element " + id);
        return nodes[id];
      }
    }
  });
  assert.equal(nodes.sigil.innerText, "Your sigil: TEST-001");
  return nodes.echo.innerText;
}

const scenarios = [
  ["SEEKER", ["SEEKER"], "You’ve sought the vault more than once.\nSentinel grants you second sight."],
  ["VAULTBOUND", ["VAULTBOUND"], "The vault remembers who opened it.\nLucid will not lie to you."],
  ["REKINDLED", ["REKINDLED"], "You walked through fire and didn’t burn.\nEmber softens her voice."],
  ["LIAR", ["LIAR"], "Mirror turns away from you.\nYou may ask—but not be answered."],
  ["unmarked", [], "You are not yet marked.\nThe Fold watches in silence."],
  ["priority", ["SEEKER", "LIAR"], "You’ve sought the vault more than once.\nSentinel grants you second sight."]
];

for (const [name, traits, expected] of scenarios) {
  test("Reflective Shard " + name + " branch preserves its exact two-line response", () => {
    assert.equal(render(new Set(traits)), expected);
  });
}

test("Reflective Shard uses inert text assignment, not HTML parsing", () => {
  assert.match(moduleSource, /getElementById\(["']echo["']\)\.innerText\s*=\s*response/);
  assert.doesNotMatch(moduleSource, /innerHTML\s*=/);
});
