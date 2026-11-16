import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { revealRawArchive } from "../local-archive-backup.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fixture(raw, failRead = false) {
  const values = new Map();
  if (raw !== null) values.set("aletheFragments", raw);
  let writes = 0;
  const storage = {
    getItem(key) {
      if (failRead) throw new Error("Storage is blocked");
      return values.has(key) ? values.get(key) : null;
    },
    setItem() { writes++; throw new Error("Must not write"); },
    removeItem() { writes++; throw new Error("Must not remove"); }
  };
  const output = { value: "previous", hidden: true };
  const status = { textContent: "" };
  return { values, storage, output, status, get writes() { return writes; } };
}

test("manual backup exposes exact existing raw text without parsing, rewriting or upload", () => {
  for (const raw of ["", "{broken", ' [ {"x":1,"x":2,"content":"<svg/onload=alert(1)>"} ] ', "null"]) {
    const f = fixture(raw);
    assert.equal(revealRawArchive("fragments", f.output, f.status, f.storage), true);
    assert.equal(f.output.value, raw);
    assert.equal(f.output.hidden, false);
    assert.match(f.status.textContent, /copy|private/i);
    assert.equal(f.values.get("aletheFragments"), raw);
    assert.equal(f.writes, 0);
  }
});

test("trail backup selects only the ritual trail key, never adjacent browser records", () => {
  const f = fixture(null);
  f.values.set("aletheSpawnTrail", '[ {"title":"old"} ]');
  f.values.set("secretOtherKey", "must not appear");
  assert.equal(revealRawArchive("trail", f.output, f.status, f.storage), true);
  assert.equal(f.output.value, '[ {"title":"old"} ]');
  assert.equal(f.writes, 0);
});

test("missing archive remains distinct from present empty string", () => {
  const f = fixture(null);
  assert.equal(revealRawArchive("fragments", f.output, f.status, f.storage), false);
  assert.equal(f.output.hidden, true);
  assert.equal(f.output.value, "");
  assert.match(f.status.textContent, /no saved/i);
  assert.equal(f.writes, 0);
});

test("blocked browser reads reveal nothing and cannot alter archive", () => {
  const f = fixture("private data", true);
  assert.equal(revealRawArchive("fragments", f.output, f.status, f.storage), false);
  assert.equal(f.output.value, "");
  assert.equal(f.output.hidden, true);
  assert.match(f.status.textContent, /did not allow/i);
  assert.equal(f.values.get("aletheFragments"), "private data");
  assert.equal(f.writes, 0);
});

test("unknown archive kind is refused rather than reading arbitrary keys", () => {
  const f = fixture("private data");
  assert.throws(() => revealRawArchive("secretOtherKey", f.output, f.status, f.storage), TypeError);
  assert.equal(f.writes, 0);
});

test("both story pages expose opt-in read-only backup controls with parseable modules", () => {
  for (const [page, kind] of [["fragments.html", "fragments"], ["trail.html", "trail"]]) {
    const html = readFileSync(join(root, page), "utf8");
    assert.match(html, /id="backup-raw"[^>]*readonly/);
    assert.match(html, /id="show-backup"/);
    assert.match(html, /id="backup-status"[^>]*role="status"/);
    const moduleScripts = [...html.matchAll(/<script\s+type="module">([\s\S]*?)<\/script>/g)].map(x => x[1]);
    assert.equal(moduleScripts.length, 2, page);
    const backupScript = moduleScripts[1];
    assert.match(backupScript, /import\s+\{\s*revealRawArchive\s*\}\s+from\s+['"]\.\/local-archive-backup\.js['"]/);
    assert.ok(backupScript.includes(`revealRawArchive("${kind}"`), page);
    assert.match(backupScript, /addEventListener\("click"/);
    const parsed = spawnSync(process.execPath, ["--check", "--input-type=module"], {
      input: backupScript, encoding: "utf8"
    });
    assert.equal(parsed.status, 0, `${page}: ${parsed.stderr}`);
  }
});
