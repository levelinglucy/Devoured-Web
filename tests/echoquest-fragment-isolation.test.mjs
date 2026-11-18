// Regression: unrelated quest paths must not depend on saved Fragment archives.
// Exercise the production module bodies with simulated browser localStorage;
// never rewrite or clear malformed historical bytes as a side effect.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const echoSource = readFileSync(join(root, "echoquest.js"), "utf8");
const fragmentsSource = readFileSync(join(root, "fragments.js"), "utf8");
const stripModule = source => source
  .replace(/^\s*import\s+.*?;\s*$/gm, "")
  .replace(/\bexport\s+(?=(?:function|const|class))/g, "");

function fixture(path, initial = {}) {
  const values = new Map(Object.entries(initial));
  const reads = [];
  const writes = [];
  const context = {
    Date: { now: () => 1_800_000_000_000 },
    getSigilPath: () => ({ id: path }),
    getSigilHistory: () => [],
    localStorage: {
      getItem(key) {
        reads.push(key);
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        writes.push(key);
        values.set(key, String(value));
      },
      removeItem(key) {
        writes.push(key);
        values.delete(key);
      }
    }
  };
  runInNewContext(stripModule(fragmentsSource) + "\n" +
    stripModule(echoSource) + "\nthis.getEchoquest = getEchoquest;", context);
  return { getEchoquest: context.getEchoquest, values, reads, writes };
}

const broken = ["{", '{"entries":[]}', '[{"title":true,"text":"ok"}]'];
const ordinary = {
  fire: { echoCount: "5", glitchTrigger: "true" },
  lost: {},
  split: { mirrorLoop: "true" },
  none: {}
};
for (const [path, data] of Object.entries(ordinary)) {
  test(path + " renders without loading unrelated malformed Fragment archives", () => {
    const normal = fixture(path, data);
    const expected = normal.getEchoquest();
    for (const archive of broken) {
      const state = fixture(path, { ...data, aletheFragments: archive });
      const quest = state.getEchoquest();
      assert.equal(quest.id, expected.id);
      assert.equal(quest.title, expected.title);
      assert.equal(quest.task, expected.task);
      assert.equal(quest.complete, expected.complete);
      assert.ok(!state.reads.includes("aletheFragments"),
        "non-Witness paths must not inspect unrelated history");
      assert.equal(state.values.get("aletheFragments"), archive,
        "original malformed bytes must survive unchanged");
      if (path === "lost") {
        assert.deepEqual(state.writes, ["lostVisit"],
          "first Lost visit should start its timer");
      } else {
        assert.deepEqual(state.writes, []);
      }
    }
  });
}

test("Witness still refuses unreadable Fragment archives without changing them", () => {
  for (const archive of broken) {
    const state = fixture("witness", { aletheFragments: archive });
    assert.throws(() => state.getEchoquest(), /Saved fragment archive/);
    assert.equal(state.values.get("aletheFragments"), archive);
    assert.deepEqual(state.writes, []);
    assert.ok(state.reads.includes("aletheFragments"));
  }
});

test("Witness still completes with three valid saved fragments", () => {
  const archive = JSON.stringify([1, 2, 3].map(i => ({
    title: "fragment-" + i, text: "text-" + i
  })));
  const state = fixture("witness", { aletheFragments: archive });
  assert.equal(state.getEchoquest().complete, true);
  assert.equal(state.values.get("aletheFragments"), archive);
  assert.deepEqual(state.writes, []);
});
