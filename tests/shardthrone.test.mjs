import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "shardthrone.js"), "utf8");

function launch(initial = {}, complete = true) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  let questCalls = 0;
  const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes.push(key); values.set(key, String(value)); }
  };
  const context = {
    localStorage,
    getOrCreateSigil: () => "SEED-001",
    getEchoquest: () => { questCalls++; return { id: "fire", complete }; },
    Date
  };
  runInNewContext(
    source.replace(/^\s*import\s+.*?;\s*$/gm, "")
      .replace(/\bexport\s+(?=function)/g, "") +
      "\nthis.api = { claimThrone, getThroneRegistry };",
    context
  );
  return { values, writes, get questCalls() { return questCalls; }, ...context.api };
}

test("A previously claimed throne is stable even if its quest later becomes incomplete", () => {
  const old = { sigil: "SEED-001", title: "Archivist", crowned: "2025-01-01T00:00:00.000Z" };
  const raw = JSON.stringify([old]);
  const state = launch({ aletheThroneRegistry: raw }, false);
  const returned = state.claimThrone();
  assert.deepEqual(JSON.parse(JSON.stringify(returned)), old);
  assert.equal(state.values.get("aletheThroneRegistry"), raw);
  assert.deepEqual(state.writes, []);
  assert.equal(state.questCalls, 0, "An existing crown must not require replaying a quest");
});

test("A newly earned crown is saved once and returned on later visits", () => {
  const state = launch();
  const first = state.claimThrone();
  assert.equal(first.sigil, "SEED-001");
  assert.equal(first.title, "Emberkin");
  assert.equal(typeof first.crowned, "string");
  const raw = state.values.get("aletheThroneRegistry");
  assert.equal(JSON.parse(raw).length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(state.claimThrone())), JSON.parse(JSON.stringify(first)));
  assert.equal(state.values.get("aletheThroneRegistry"), raw);
  assert.deepEqual(state.writes, ["aletheThroneRegistry"]);
  assert.equal(state.questCalls, 1);
});

test("Unfinished quests do not invent crowns or write an empty archive", () => {
  const state = launch({}, false);
  assert.equal(state.claimThrone(), null);
  assert.equal(state.values.has("aletheThroneRegistry"), false);
  assert.deepEqual(state.writes, []);
});

test("Malformed throne history is preserved and refused before any new claim", () => {
  for (const raw of [
    "{", "null", "{}", "[null]", '[{"title":"Lost"}]',
    '["not a crown"]'
  ]) {
    const state = launch({ aletheThroneRegistry: raw });
    assert.throws(() => state.getThroneRegistry(), /throne|registry|invalid|unreadable|record/i, raw);
    assert.throws(() => state.claimThrone(), /throne|registry|invalid|unreadable|record/i, raw);
    assert.equal(state.values.get("aletheThroneRegistry"), raw);
    assert.deepEqual(state.writes, []);
  }
});
