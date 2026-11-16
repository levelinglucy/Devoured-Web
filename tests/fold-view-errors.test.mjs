import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const warning = "Fold state unavailable. Try again later.";

// Exercise the pages' original module scripts with only imports and remote
// dependencies replaced. This is a simulated rejection, not a Firebase outage.
function loadPage(page, getState) {
  const html = readFileSync(join(root, page + ".html"), "utf8");
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(script, page + " has an inline module");
  let source = script[1].replace(/^\s*import\b[^\n]*;\s*$/gm, "");
  source = source.replace(/\b(getFoldState|applyWorldskin)\(\)\.then\(/,
    "globalThis.__request = $&");
  assert.match(source, /globalThis\.__request = (getFoldState|applyWorldskin)\(\)\.then\(/);

  const nodes = {
    state: { innerText: "Scanning...", textContent: "Scanning..." },
    desc: { innerText: page === "fold" ? "..." : "Let the Fold reveal its skin...",
      textContent: page === "fold" ? "..." : "Let the Fold reveal its skin..." },
    title: { innerText: "Shard Interface" }
  };
  const document = {
    body: { dataset: {}, classList: { add() {} } },
    getElementById(id) {
      assert.ok(Object.hasOwn(nodes, id), id);
      return nodes[id];
    }
  };
  const scope = {
    initializeApp: () => ({}),
    document,
    getFoldState: getState,
    applyWorldskin: async () => {
      const state = await getState();
      document.body.dataset.fold = state;
    }
  };
  runInNewContext(source, scope, { timeout: 1000 });
  return { request: scope.__request, nodes, document, html };
}

test("Fold page rejects a failed Firestore read without an endless scanning state", async () => {
  const { request, nodes, html } = loadPage("fold", async () => {
    throw new Error("private Firebase diagnostics <img onerror=alert(1)>");
  });
  await assert.doesNotReject(request);
  assert.equal(nodes.state.textContent, warning);
  assert.equal(nodes.desc.textContent, "The Archive could not be reached.");
  assert.doesNotMatch(nodes.state.textContent + nodes.desc.textContent, /private|<img/);
  assert.match(html, /id="state"[^>]*role="status"/);
});

test("Shard page rejects a failed Fold query without leaving pending text", async () => {
  const { request, nodes, html } = loadPage("shard", async () => {
    throw new Error("private Firebase diagnostics <img onerror=alert(1)>");
  });
  await assert.doesNotReject(request);
  assert.equal(nodes.desc.textContent, warning);
  assert.doesNotMatch(nodes.desc.textContent, /private|<img/);
  assert.match(html, /id="desc"[^>]*role="status"/);
});

test("Both pages retain their established successful Fold state descriptions", async () => {
  for (const page of ["fold", "shard"]) {
    const { request, nodes, document } = loadPage(page, async () => "Ignited");
    await assert.doesNotReject(request);
    if (page === "fold") {
      assert.equal(nodes.state.innerText, "Current State: Ignited");
      assert.match(nodes.desc.innerText, /Fold burns/);
    } else {
      assert.equal(document.body.dataset.fold, "Ignited");
      assert.match(nodes.desc.innerText, /Ember/);
    }
  }
});
