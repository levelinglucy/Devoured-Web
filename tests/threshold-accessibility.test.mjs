import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "threshold.html"), "utf8");
const form = html.match(/<form\b[^>]*>([\s\S]*?)<\/form>/i);
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/i)?.[1];

test("Threshold keeps three persistently named questions in one form", () => {
  assert.ok(form, "Question inputs need a real form");
  for (const [id, name] of [
    ["q1", "What do you seek?"],
    ["q2", "What have you lost?"],
    ["q3", "What would you sacrifice?"]
  ]) {
    assert.match(form[1], new RegExp('<label\\s+for="' + id + '">' + name.replace("?", "\\?") + '<\\/label>'));
    assert.match(form[1], new RegExp('<input\\s+id="' + id + '"'));
  }
  assert.match(form[1], /<button\s+type="submit">Enter<\/button>/);
  assert.doesNotMatch(form[1], /\bonclick\s*=/i);
});

test("form submit invokes existing routing once and cancels ordinary form navigation", () => {
  assert.ok(script, "Do not replace the existing routing implementation");
  const handler = form?.[0].match(/\bonsubmit="([^"]+)"/)?.[1];
  assert.equal(handler, "decideShard(); return false;");
  const nodes = Object.fromEntries(
    ["sigilDisplay", "result", "q1", "q2", "q3"].map(id => [id, { value: "", innerText: "" }])
  );
  const location = { href: "threshold.html" };
  let writes = 0;
  const context = {
    localStorage: {
      getItem() { return "ABCDEF-123"; },
      setItem() { writes++; }
    },
    document: { getElementById(id) { return nodes[id]; } },
    window: { location },
    setTimeout() { throw Error("No delayed route expected"); }
  };
  runInNewContext(script + "\nthis.submitForm = function() { " + handler + " };", context);
  nodes.q1.value = "truth";
  assert.equal(context.submitForm(), false);
  assert.equal(location.href, "sentinel.html");
  assert.equal(writes, 0);
});

test("invalid stored identity stays unchanged and cannot be submitted into a shard", () => {
  const handler = form?.[0].match(/\bonsubmit="([^"]+)"/)?.[1];
  assert.ok(handler);
  const nodes = Object.fromEntries(
    ["sigilDisplay", "result", "q1", "q2", "q3"].map(id => [id, { value: "", innerText: "" }])
  );
  const location = { href: "threshold.html" };
  let writes = 0;
  const context = {
    localStorage: {
      getItem() { return ""; },
      setItem() { writes++; }
    },
    document: { getElementById(id) { return nodes[id]; } },
    window: { location }
  };
  runInNewContext(script + "\nthis.submitForm = function() { " + handler + " };", context);
  nodes.q1.value = "truth";
  assert.equal(context.submitForm(), false);
  assert.equal(location.href, "threshold.html");
  assert.match(nodes.result.innerText, /cannot enter|unavailable/i);
  assert.equal(writes, 0);
});
