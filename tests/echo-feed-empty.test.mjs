import test from "node:test";
import assert from "node:assert/strict";
import { renderShardEchoes } from "../echo-renderer.js";

class FakeElement {
  constructor() {
    this.children = [];
    this.className = "";
    this.value = "";
  }
  replaceChildren(...nodes) { this.children = nodes; this.value = ""; }
  appendChild(node) { this.children.push(node); return node; }
  get textContent() { return this.value; }
  set textContent(value) { this.value = String(value); this.children = []; }
  set innerHTML(_) { throw new Error("Echo fields must never be HTML"); }
}
const doc = { createElement: () => new FakeElement() };
const snap = (...records) => ({
  forEach(callback) { records.forEach(record => callback({ data: () => record })); }
});

test("successful empty query replaces Loading with an explicit empty state", () => {
  const grid = new FakeElement();
  grid.textContent = "Loading...";
  renderShardEchoes(grid, snap(), "sentinel", doc);
  assert.equal(grid.textContent, "No Sentinel echoes found yet.");
  assert.equal(grid.children.length, 0);
});

test("unrelated and invalid message records do not leave an empty grid", () => {
  const grid = new FakeElement();
  renderShardEchoes(
    grid,
    snap({ message: "ember only" }, { message: null }, {}, { message: 42 }),
    "sentinel",
    doc
  );
  assert.equal(grid.textContent, "No Sentinel echoes found yet.");
});

test("matching records keep inert text and do not show a false empty state", () => {
  const grid = new FakeElement();
  renderShardEchoes(grid, snap({
    message: "sentinel <img src=x>", sigil: "<a>", time: 0
  }), "sentinel", doc);
  assert.equal(grid.textContent, "");
  assert.equal(grid.children.length, 1);
  assert.deepEqual(
    grid.children[0].children.map(node => node.textContent),
    ["<a>", "0", "sentinel <img src=x>"]
  );
});
