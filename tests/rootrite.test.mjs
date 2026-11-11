import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "rootrite.html"), "utf8");
const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Rootrite must have a module script");

function launch(initial, failure = false) {
  const values = new Map(Object.entries(initial));
  const output = { innerText: "" };
  let writes = 0;
  const localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem(key, value) { values.set(key, String(value)); writes += 1; },
    removeItem(key) { values.delete(key); writes += 1; }
  };
  const window = {};
  const source = script.replace(/^\s*import\s+.*?;\s*$/gm, "");
  runInNewContext(source, {
    window, localStorage,
    storeFaction: faction => {
      if (failure) throw new Error("Storage unavailable");
      localStorage.setItem("visitorFaction", faction);
    },
    document: { getElementById(id) {
      assert.equal(id, "result");
      return output;
    } }
  });
  return { values, output, window, get writes() { return writes; } };
}

test("Rootrite's module parses and clearly promises a faction change, not archive deletion", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: script, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
  assert.match(html, /Wanderer/i);
  assert.doesNotMatch(html, /Burn your sigil/i);
  assert.match(html, /throne|archive|history/i);
});

test("Becoming Wanderer keeps every existing throne and the original sigil", () => {
  const registry = JSON.stringify([
    { sigil: "ONE-001", title: "Archivist", crowned: "2026-01-01T00:00:00Z" },
    { sigil: "TWO-002", title: "Mirrorbound", crowned: "2026-01-02T00:00:00Z" }
  ]);
  const runtime = launch({
    aletheThroneRegistry: registry,
    aletheSigil: "ONE-001",
    visitorFaction: "The Bound Eye"
  });
  runtime.window.resetFaction();
  assert.equal(runtime.values.get("visitorFaction"), "Wanderer");
  assert.equal(runtime.values.get("aletheSigil"), "ONE-001");
  assert.equal(runtime.values.get("aletheThroneRegistry"), registry);
  assert.match(runtime.output.innerText, /Wanderer/);
});

test("Failed faction storage does not erase the throne archive or claim success", () => {
  const registry = '[{"sigil":"ONE-001"}]';
  const runtime = launch({
    aletheThroneRegistry: registry,
    visitorFaction: "The Bound Eye"
  }, true);
  assert.doesNotThrow(() => runtime.window.resetFaction());
  assert.equal(runtime.values.get("visitorFaction"), "The Bound Eye");
  assert.equal(runtime.values.get("aletheThroneRegistry"), registry);
  assert.doesNotMatch(runtime.output.innerText, /you are now a Wanderer/i);
  assert.match(runtime.output.innerText, /could not|failed|unavailable/i);
});
