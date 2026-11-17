import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pathLinks = [
  ["banned.html", ["underfold.html"]],
  ["underfold.html", ["whisper.html"]],
  ["whisper.html", ["rootrite.html", "rootcraft.html"]],
];

for (const [filename, expectedLinks] of pathLinks) {
  test(`${filename} uses device-width layout without changing the passage exits`, () => {
    const html = readFileSync(join(root, filename), "utf8");
    assert.match(
      html,
      /<meta\s+name="viewport"\s+content="width=device-width, initial-scale=1(?:\.0)?"\s*\/?>/i
    );
    assert.doesNotMatch(html, /(?:user-scalable\s*=\s*no|maximum-scale\s*=)/i);
    const exits = [...html.matchAll(/<a\s+href="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(exits, expectedLinks);
  });
}
