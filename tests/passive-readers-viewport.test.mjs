import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readers = [
  ["godpulse.html", "getGodState"],
  ["shardthrone.html", "getThroneRegistry"],
  ["councilfire.html", "summonCouncil"]
];

test("three passive reading pages use a zoom-permissive device-width viewport", () => {
  for (const [filename] of readers) {
    const html = readFileSync(join(root, filename), "utf8");
    const viewports = [...html.matchAll(/<meta\s+name="viewport"\s+content="([^"]+)"\s*\/?>/gi)];
    assert.equal(viewports.length, 1, filename + ": exactly one viewport declaration");
    assert.equal(viewports[0][1], "width=device-width, initial-scale=1.0", filename);
    assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=/i, filename);
  }
});

test("passive page modules and reading containers remain in place", () => {
  for (const [filename, imported] of readers) {
    const html = readFileSync(join(root, filename), "utf8");
    assert.match(html, /<script\s+type="module">/i, filename);
    assert.ok(html.includes("import { " + imported + " }"), filename);
    assert.match(html, /<h1>[^<]+<\/h1>/, filename);
  }
});
