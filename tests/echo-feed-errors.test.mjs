import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shards = ["sentinel", "ember", "lucid", "mirror"];
const unavailable = "Echoes could not be loaded. Try again later.";

// Execute each page's actual inline script with Firestore/DOM dependencies replaced.
// This tests the page-level failure boundary, not just a helper in isolation.
function runPage(shard, getDocs) {
  const html = readFileSync(join(root, shard + ".html"), "utf8");
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, shard + " must contain its module script");
  const source = match[1].replace(/^\s*import\b[^\n]*;\s*$/gm, "")
    .replace(/\bloadEchoes\(\);\s*$/, "globalThis.__request = loadEchoes();");
  assert.match(source, /globalThis\.__request = loadEchoes\(\);/,
    shard + " must still invoke its loader");

  const grid = { textContent: "Loading..." };
  const renderCalls = [];
  const scope = {
    document: { getElementById: id => id === "grid" ? grid : null },
    initializeApp: config => ({ config }),
    getFirestore: app => ({ app }),
    collection: (_db, name) => name,
    getDocs,
    renderShardEchoes: (...args) => renderCalls.push(args)
  };
  runInNewContext(source, scope, { timeout: 1000 });
  return { grid, renderCalls, request: scope.__request };
}

test("all four echo feeds replace indefinite Loading with inert network-error text", async () => {
  for (const shard of shards) {
    const { grid, renderCalls, request } = runPage(shard, async () => {
      throw new Error("<img src=x onerror=alert(1)> connection offline");
    });
    await assert.doesNotReject(request, shard + " should handle Firestore failures");
    assert.equal(grid.textContent, unavailable, shard);
    assert.equal(renderCalls.length, 0, shard + " must not render stale echoes");
  }
});

test("all four echo feeds still render successful Firestore snapshots", async () => {
  const snapshot = { forEach() {} };
  for (const shard of shards) {
    const { grid, renderCalls, request } = runPage(shard, async () => snapshot);
    await assert.doesNotReject(request);
    assert.equal(renderCalls.length, 1, shard);
    assert.equal(renderCalls[0][0], grid, shard);
    assert.equal(renderCalls[0][1], snapshot, shard);
    assert.equal(renderCalls[0][2], shard, shard);
    assert.equal(grid.textContent, "Loading...",
      "stub renderer is responsible for successful grid population");
  }
});
