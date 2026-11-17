import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "rootcraft.html"), "utf8");
const script = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Rootcraft must contain its inline module");
const imported = /^\s*import\s*\{\s*injectFragment\s*,\s*isWanderer\s*\}\s*from\s*["']\.\/breakfold\.js["'];?\s*$/m;
assert.match(script, imported);

function launch() {
  const nodes = { frag: { value: "new fragment" }, result: { innerText: "" } };
  let permitted = true;
  let failedCheck = false;
  let failSave = false;
  let saved = 0;
  const context = {
    window: {},
    document: { getElementById(id) { assert.ok(id in nodes); return nodes[id]; } },
    isWanderer() {
      if (failedCheck) throw new Error("Private storage detail");
      return permitted;
    },
    injectFragment(text) {
      saved++;
      assert.equal(text, nodes.frag.value);
      if (failSave) throw new Error("save denied");
      return "Root-script 1";
    }
  };
  runInNewContext(script.replace(imported, ""), context);
  return {
    nodes, cast: context.window.cast,
    denyRead() { failedCheck = true; },
    denyAccess() { permitted = false; },
    failWrite() { failSave = true; },
    saved() { return saved; }
  };
}

test("Rootcraft displays a fixed warning when its faction eligibility read throws", () => {
  const app = launch();
  app.denyRead();
  assert.doesNotThrow(() => app.cast());
  assert.match(app.nodes.result.innerText, /could not check.*saved faction/i);
  assert.match(app.nodes.result.innerText, /nothing was changed/i);
  assert.doesNotMatch(app.nodes.result.innerText, /Private storage detail/);
  assert.equal(app.saved(), 0);
});

test("Rootcraft replaces an earlier save success if a later eligibility read fails", () => {
  const app = launch();
  app.cast();
  assert.match(app.nodes.result.innerText, /saved in this browser/);
  assert.equal(app.saved(), 1);
  app.denyRead();
  assert.doesNotThrow(() => app.cast());
  assert.doesNotMatch(app.nodes.result.innerText, /saved in this browser/);
  assert.match(app.nodes.result.innerText, /could not check.*saved faction/i);
  assert.equal(app.saved(), 1, "No second fragment was written");
});

test("Rootcraft preserves ordinary denial, successful save and existing writer-error wording", () => {
  const app = launch();
  app.denyAccess();
  app.cast();
  assert.match(app.nodes.result.innerText, /Only Wanderers can rootwrite/);
  assert.equal(app.saved(), 0);
  const allowed = launch();
  allowed.cast();
  assert.equal(allowed.saved(), 1);
  allowed.failWrite();
  allowed.cast();
  assert.equal(allowed.nodes.result.innerText, "save denied");
});
