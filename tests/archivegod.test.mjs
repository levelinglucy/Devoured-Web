import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "archivegod.js"), "utf8");

function fixture(raw = null, failWrites = false) {
  const storage = new Map();
  if (raw !== null) storage.set("archivegodState", raw);
  const context = {
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) {
        if (failWrites) throw new Error("storage quota exceeded");
        storage.set(key, String(value));
      }
    }
  };
  runInNewContext(source.replace(/\bexport\s+(?=function)/g, "") +
    "\nthis.api = { getGodState, shiftMood, setMask };", context);
  return { storage, ...context.api };
}

test("Archivegod module syntax remains valid", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: source, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
});

test("Missing state is freshly independent, including nested influence", () => {
  const state = fixture();
  const copy = state.getGodState();
  assert.equal(copy.mood, "Stable");
  copy.mood = "Never persisted";
  copy.influence.Wanderers = 999;
  assert.equal(state.getGodState().mood, "Stable");
  assert.equal(state.getGodState().influence.Wanderers, 2);
  assert.equal(state.storage.size, 0);
});

test("A rejected first write cannot mutate the future unsaved default", () => {
  const state = fixture(null, true);
  assert.throws(() => state.shiftMood("Fractured"), /quota/);
  assert.throws(() => state.setMask("Glitch"), /quota/);
  assert.equal(state.getGodState().mood, "Stable");
  assert.equal(state.getGodState().dominantMask, "Foldheart");
  assert.equal(state.storage.size, 0);
});

test("Malformed or wrong-shaped existing history is preserved, not reset", () => {
  for (const raw of ["{", "null", "[]", '"text"', "13", "true", "{}", '{"mood":"Happy"}']) {
    const state = fixture(raw);
    assert.throws(() => state.getGodState(), undefined, raw);
    assert.throws(() => state.shiftMood("Awake"), undefined, raw);
    assert.throws(() => state.setMask("Mirror"), undefined, raw);
    assert.equal(state.storage.get("archivegodState"), raw);
  }
});

test("Valid saved story fields and custom extensions survive targeted edits", () => {
  const raw = JSON.stringify({
    dominantMask: "The Reflected", mood: "Stable", prophecy: "Keep the key.",
    influence: { Wanderers: 9 }, custom: { note: "don't overwrite" }
  });
  const state = fixture(raw);
  state.shiftMood("Awake");
  state.setMask("Foldheart");
  const final = JSON.parse(state.storage.get("archivegodState"));
  assert.equal(final.mood, "Awake");
  assert.equal(final.dominantMask, "Foldheart");
  assert.equal(final.prophecy, "Keep the key.");
  assert.deepEqual(final.influence, { Wanderers: 9 });
  assert.deepEqual(final.custom, { note: "don't overwrite" });
});

const page = readFileSync(join(root, "godpulse.html"), "utf8");
const inline = page.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
const pageImport = /^\s*import\s+\{\s*getGodState\s*\}\s+from\s+['"]\.\/archivegod\.js['"];?\s*$/m;

function renderPulse(raw = null) {
  const state = fixture(raw);
  const elements = Object.fromEntries(["mask", "mood", "prophecy"].map(id => [id, { innerText: "" }]));
  assert.ok(inline);
  assert.match(inline, pageImport);
  runInNewContext(inline.replace(pageImport, ""), {
    getGodState: state.getGodState,
    document: { getElementById(id) { assert.ok(elements[id]); return elements[id]; } }
  });
  return { state, elements };
}

test("Archivegod Pulse renders valid state via inert text, not markup", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: inline, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
  const state = renderPulse();
  assert.equal(state.elements.mask.innerText, "Dominant Mask: Foldheart");
  assert.equal(state.elements.mood.innerText, "Mood: Stable");
  assert.match(state.elements.prophecy.innerText, /The root will crack/);
});

test("Archivegod Pulse warns on invalid saved state without clearing it", () => {
  for (const raw of ["{", "null", "[]", '{"mood":"Fractured"}']) {
    const state = renderPulse(raw);
    assert.match(state.elements.mask.innerText, /unreadable/i);
    assert.match(state.elements.mood.innerText, /not cleared/i);
    assert.match(state.elements.prophecy.innerText, /preserve/i);
    assert.equal(state.state.storage.get("archivegodState"), raw);
  }
});
