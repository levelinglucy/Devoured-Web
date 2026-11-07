import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { renderShardEchoes } from "../echo-renderer.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
class FakeElement {
  constructor(tag) { this.tag = tag; this.children = []; this.textContent = ""; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  set innerHTML(_) { throw Error("HTML parsing of untrusted data"); }
}
const doc = { createElement: (tag) => new FakeElement(tag) };
const snap = (...records) => ({ forEach(fn) { records.forEach((r) => fn({ data: () => r })); } });

test("stored markup in message, sigil and time stays inert text", () => {
  const grid = new FakeElement("div");
  const payload = '<img src=x onerror="alert(1)">';
  renderShardEchoes(grid, snap({
    sigil: payload, time: payload, message: "mirror " + payload
  }), "mirror", doc);
  assert.equal(grid.children.length, 1);
  const orb = grid.children[0];
  assert.equal(orb.className, "orb");
  assert.deepEqual(orb.children.map((n) => n.className), ["sigil", "timestamp", "message"]);
  assert.deepEqual(orb.children.map((n) => n.textContent), [payload, payload, "mirror " + payload]);
  assert.ok(orb.children.every((n) => n.children.length === 0));
});

test("filters each domain and ignores malformed messages without crashing", () => {
  const grid = new FakeElement("div");
  for (const shard of ["sentinel", "ember", "lucid", "mirror"]) {
    renderShardEchoes(grid, snap(
      { message: shard.toUpperCase() + " returns", shard: "backup", time: 0 },
      { message: "elsewhere" },
      { message: null },
      {},
    ), shard, doc);
    assert.equal(grid.children.length, 1);
    assert.equal(grid.children[0].children[0].textContent, "backup");
    assert.equal(grid.children[0].children[1].textContent, "0");
    assert.equal(grid.children[0].children[2].textContent, shard.toUpperCase() + " returns");
  }
});

test("four domain pages use shared inert-text renderer, never template HTML", () => {
  for (const shard of ["sentinel", "ember", "lucid", "mirror"]) {
    const html = readFileSync(join(root, shard + ".html"), "utf8");
    assert.match(html, /import \{ renderShardEchoes \} from '\.\/echo-renderer\.js';/);
    assert.match(html, /renderShardEchoes\(grid, snapshot, shard\);/);
    assert.doesNotMatch(html, /orb\.innerHTML|d\.message\.toLowerCase\(\)/);
  }
});
