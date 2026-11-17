import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "rootrite.html"), "utf8");

test("Rootrite uses a device-width viewport with unrestricted user zoom", () => {
  assert.match(html, /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1(?:\.0)?"\s*\/?>/i);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=/i);
});

test("Rootrite has a comfortable, wrapping mobile action without horizontal clipping", () => {
  assert.match(html, /button\s*\{[^}]*font-size:\s*16px;[^}]*min-height:\s*44px;[^}]*max-width:\s*100%;/i);
  assert.match(html, /@media\s*\(max-width:\s*600px\)\s*\{\s*body\s*\{\s*padding:\s*1\.5em;/i);
  assert.match(html, /<button\s+onclick="resetFaction\(\)"/i);
});

test("Rootrite announces text results without changing its faction action", () => {
  assert.match(html, /<div\s+id="result"\s+role="status"\s+aria-atomic="true"/i);
  assert.match(html, /storeFaction\("Wanderer"\)/);
  assert.match(html, /Could not change faction\. Your local archive was not cleared\./);
});
