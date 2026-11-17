import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = (name) => readFileSync(join(root, name + ".html"), "utf8");

test("Vault, Fragments and Trail use device-width viewports and preserve zoom freedom", () => {
  for (const name of ["vault", "fragments", "trail"]) {
    const html = page(name);
    assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1(?:\.0)?"\s*\/?>/i, name);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=/i, name);
  }
});

test("Vault retains its existing native Unseal action and reveal", () => {
  const html = page("vault");
  assert.match(html, /<button onclick="reveal\(\)">Unseal<\/button>/);
  assert.match(html, /document\.getElementById\("echo"\)\.innerText = "It was always you\. You were the one who wrote it\.";/);
});

test("Fragments and Trail keep explicit backup actions and readable narrow controls", () => {
  for (const name of ["fragments", "trail"]) {
    const html = page(name);
    assert.match(html, /#backup button\s*\{[^}]*min-height:\s*44px;[^}]*font-size:\s*16px;[^}]*max-width:\s*100%;/i, name);
    assert.match(html, /#backup textarea\s*\{[^}]*font-size:\s*16px;/i, name);
    assert.match(html, /@media\s*\(max-width:\s*600px\)\s*\{\s*body\s*\{\s*padding:\s*1em;/i, name);
    assert.match(html, /<button id="show-backup" type="button">Reveal raw text for backup<\/button>/);
    assert.match(html, /<textarea id="backup-raw" readonly hidden/);
    assert.match(html, /<textarea id="backup-encoded" readonly hidden/);
    assert.match(html, /revealRawArchive\("(?:fragments|trail)"/);
    assert.doesNotMatch(html, /onclick="(?:localStorage|clear|removeItem)/);
  }
});

test("Trail wraps very long saved spawn previews without truncating the saved data", () => {
  const html = page("trail");
  assert.match(html, /\.spawn pre\s*\{\s*white-space:\s*pre-wrap;\s*overflow-wrap:\s*anywhere;/);
  assert.match(html, /preview\.textContent = content\.substring\(0, 200\) \+ "\.\.\.";/);
  assert.match(html, /getTrail\(\)/);
});
