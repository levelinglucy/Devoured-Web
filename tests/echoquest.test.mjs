import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "echoquest.js"), "utf8");
const now = 1_800_000_000_000;

function fixture(path, initial = {}, failWrites = false) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  const context = {
    getSigilPath: () => ({ id: path }),
    getFragments: () => [],
    getSigilHistory: () => [],
    Date: { now: () => now },
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) {
        if (failWrites) throw new Error("storage write refused");
        writes.push(key);
        values.set(key, String(value));
      }
    }
  };
  runInNewContext(source.replace(/^\s*import\s+.*?;\s*$/gm, "")
    .replace(/\bexport\s+(?=function)/g, "") +
    "\nthis.getEchoquest = getEchoquest;", context);
  return { ...context, values, writes };
}

test("Echoquest module has valid JavaScript syntax", () => {
  const check = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: source, encoding: "utf8"
  });
  assert.equal(check.status, 0, check.stderr);
});

test("Fire progress counts exact safe integers, not parseInt prefixes", () => {
  for (const raw of ["5junk", "5.5", "-1", "9007199254740992", "Infinity", ""]) {
    const state = fixture("fire", { echoCount: raw, glitchTrigger: "true" });
    assert.throws(() => state.getEchoquest(), /echoCount|progress|count|invalid/i, raw);
    assert.equal(state.values.get("echoCount"), raw);
    assert.deepEqual(state.writes, []);
  }
  assert.equal(fixture("fire", { echoCount: "5", glitchTrigger: "true" }).getEchoquest().complete, true);
  assert.equal(fixture("fire", { echoCount: "4", glitchTrigger: "true" }).getEchoquest().complete, false);
  assert.equal(fixture("fire", { echoCount: "5" }).getEchoquest().complete, false);
  assert.equal(fixture("fire").getEchoquest().complete, false);
});

test("Lost quest refuses malformed timestamps without resetting the saved evidence", () => {
  for (const raw of ["not-a-date", "1700000000000ms", "1700000000000.5", "-1", "9007199254740992", "", "NaN"]) {
    const state = fixture("lost", { lostVisit: raw });
    assert.throws(() => state.getEchoquest(), /lostVisit|timestamp|invalid/i, raw);
    assert.equal(state.values.get("lostVisit"), raw);
    assert.deepEqual(state.writes, [], raw);
  }
});

test("Lost quest handles an existing completed, recent or clock-future timestamp without rewriting it", () => {
  for (const [timestamp, done] of [
    [now - 86_400_000, true], [now - 86_399_999, false], [now + 1000, false], [0, true]
  ]) {
    const raw = String(timestamp);
    const state = fixture("lost", { lostVisit: raw });
    assert.equal(state.getEchoquest().complete, done, raw);
    assert.equal(state.values.get("lostVisit"), raw);
    assert.deepEqual(state.writes, []);
  }
});

test("Lost first visit initializes the timer once, and refused writes do not pretend it started", () => {
  const state = fixture("lost");
  assert.equal(state.getEchoquest().complete, false);
  assert.equal(state.values.get("lostVisit"), String(now));
  assert.equal(state.getEchoquest().complete, false);
  assert.deepEqual(state.writes, ["lostVisit"]);
  const blocked = fixture("lost", {}, true);
  assert.throws(() => blocked.getEchoquest(), /write refused/);
  assert.equal(blocked.values.has("lostVisit"), false);
});

const page = readFileSync(join(root, "quest.html"), "utf8");
const inline = page.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
const importLine = /^\s*import\s+\{\s*getEchoquest\s*\}\s+from\s+['"]\.\/echoquest\.js['"];?\s*$/m;
function render(error = null) {
  const elements = Object.fromEntries(["title", "task", "status"].map(id => [id, {
    innerText: "", classList: { added: [], add(cls) { this.added.push(cls); } }
  }]));
  assert.ok(inline);
  assert.match(inline, importLine);
  runInNewContext(inline.replace(importLine, ""), {
    getEchoquest() {
      if (error) throw error;
      return { title: "A Test Quest", task: "Find the key.", complete: false };
    },
    document: { getElementById(id) { assert.ok(elements[id]); return elements[id]; } }
  });
  return elements;
}

test("Quest page renders normal status and a non-destructive recovery warning on failure", () => {
  assert.equal(render().status.innerText, "Incomplete");
  const elements = render(new Error("bad historical progress"));
  assert.match(elements.status.innerText, /unreadable|recover|unavailable|cannot/i);
  assert.match(elements.task.innerText, /preserve|unchanged|not cleared|saved/i);
});
