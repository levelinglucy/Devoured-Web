import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { summonCouncil } from "../councilfire.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entries = new Map();
globalThis.localStorage = {
  getItem: (key) => entries.has(key) ? entries.get(key) : null,
  setItem: (key, value) => entries.set(key, String(value)),
  removeItem: (key) => entries.delete(key)
};
function seed(values = {}) {
  entries.clear();
  entries.set("aletheSigil", "TEST-001");
  for (const [key, value] of Object.entries(values)) {
    entries.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }
}

test("Councilfire returns five quoted lines for an uncrowned visitor", async () => {
  seed();
  const lines = await summonCouncil();
  assert.deepEqual(lines, [
    'Glyph: "Truth is what repeats. Reality is recursion."',
    'Ash: "Loop-born? Hmph. I’ve smelled worse flame."',
    'Lucid: "Let them speak. We cannot unhear memory once whispered."',
    'Sentinel: "Do not let emotion steer the Archive."',
    'Null: "What if they are wrong? All of them. Even me."'
  ]);
  assert.equal(entries.has("aletheThroneRegistry"), false);
});

test("Split path receives Ash's warning without a crown", async () => {
  seed({ sigilTraits: ["LIAR"] });
  const lines = await summonCouncil();
  assert.equal(lines.length, 5);
  assert.equal(lines[1], 'Ash: "This one brings Mirror-sickness. Burn them before they multiply."');
  assert.equal(lines[3], 'Sentinel: "Do not let emotion steer the Archive."');
});

test("Completed Firebound quest receives the Emberkin warning", async () => {
  seed({ sigilTraits: ["FURY"], echoCount: "5", glitchTrigger: "true" });
  const lines = await summonCouncil();
  assert.equal(lines.length, 5);
  assert.equal(lines[3], 'Sentinel: "This one has already breached order. Watch them closely."');
  const registry = JSON.parse(entries.get("aletheThroneRegistry"));
  assert.equal(registry.length, 1);
  assert.equal(registry[0].title, "Emberkin");
});

test("Council page renders dialogue as text nodes, not parsed HTML", () => {
  const html = readFileSync(join(root, "councilfire.html"), "utf8");
  assert.match(html, /import \{ summonCouncil \} from ['"]\.\/councilfire\.js['"]/);
  assert.match(html, /document\.createElement\(['"]div['"]\)/);
  assert.match(html, /\.textContent\s*=/);
  assert.doesNotMatch(html, /innerHTML\s*=/);
});
