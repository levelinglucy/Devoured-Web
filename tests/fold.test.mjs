import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fold = readFileSync(join(root, "fold.js"), "utf8");
const firebaseImport = /^import \{ getFirestore, collection, getDocs \} from "https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.0\/firebase-firestore\.js";\s*$/m;

function evaluate(echoes = [], anomalies = []) {
  assert.match(fold, firebaseImport, "Expected real Firestore import");
  const snap = records => ({
    size: records.length,
    forEach(fn) { for (const record of records) fn({ data: () => record }); }
  });
  const context = {
    getFirestore: () => ({}),
    collection: (_, name) => name,
    getDocs: async name => snap(name === "echoes" ? echoes : anomalies)
  };
  runInNewContext(
    fold.replace(firebaseImport, "").replace("export async function", "async function") +
      "\nthis.fold = getFoldState; this.prototypeHasCount = () => Object.hasOwn(Object.prototype, 'rekindled');",
    context
  );
  return context;
}
const triple = sigil => Array.from({ length: 3 }, () => ({ sigil, tone: "rebellion" }));

test("Fold engine remains valid ECMAScript module", () => {
  const result = spawnSync(process.execPath, ["--check", "--input-type=module"], {
    input: fold, encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
});

test("three ordinary rebellious sigils ignite; sparse/mixed echoes retain existing thresholds", async () => {
  const normal = evaluate([...triple("alpha"), ...triple("beta"), ...triple("gamma")]);
  assert.equal(await normal.fold(), "Ignited");
  assert.equal(await evaluate([{}, {}, {}, {}, {}]).fold(), "Awake");
  assert.equal(await evaluate([]).fold(), "Still");
  assert.equal(await evaluate([], [
    { sigil: "one", category: "loop" },
    { sigil: "two", category: "self" },
    { sigil: "three", category: "self-loop" }
  ]).fold(), "Fractured");
});

test("Firestore sigil names matching inherited Object properties count as ordinary identities", async () => {
  const ctx = evaluate([
    ...triple("__proto__"),
    ...triple("constructor"),
    ...triple("toString")
  ]);
  assert.equal(ctx.prototypeHasCount(), false, "No preexisting prototype mutation");
  assert.equal(await ctx.fold(), "Ignited", "Three reserved sigil names count as three independent bursts");
  assert.equal(ctx.prototypeHasCount(), false, "Firestore-sourced names must not modify Object.prototype");
});
