import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "reflective.html"), "utf8");
const source = html.match(/<script\s+type=["']module["']\s*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(source, "Reflective Shard must retain its module script");
const withoutImport = source.replace(
  /^\s*import\s*\{\s*getOrCreateSigil,\s*getTraits\s*\}\s*from\s*['"]\.\/sigil\.js['"];?\s*$/m, ""
);
assert.notEqual(withoutImport, source, "Use the actual sigil module's trait snapshot API");

function runPage({ traits = [], getTraitsError, getSigilError, getTraitsImpl } = {}) {
  const nodes = {
    sigil: { innerText: "original sigil" },
    echo: { innerText: "Loading reflection..." }
  };
  const calls = { traits: 0, sigil: 0 };
  let thrown;
  try {
    runInNewContext(withoutImport, {
      getOrCreateSigil: () => {
        calls.sigil += 1;
        if (getSigilError) throw getSigilError;
        return "ABC123-007";
      },
      getTraits: () => {
        calls.traits += 1;
        if (getTraitsError) throw getTraitsError;
        return getTraitsImpl ? getTraitsImpl(calls.traits) : traits;
      },
      document: { getElementById: id => {
        assert.ok(Object.hasOwn(nodes, id), "No unexpected DOM nodes");
        return nodes[id];
      } }
    }, { timeout: 1000 });
  } catch (error) { thrown = error; }
  return { nodes, calls, thrown };
}

test("Reflective Shard displays a fixed inert recovery warning after denied trait reads", () => {
  const result = runPage({ getTraitsError: new Error("private <img onerror=alert(1)>") });
  assert.equal(result.thrown, undefined);
  assert.equal(result.nodes.sigil.innerText, "");
  assert.equal(result.nodes.echo.innerText,
    "Could not read your reflection. Preserve existing records for recovery.");
  assert.doesNotMatch(result.nodes.echo.innerText, /private|img|alert/);
  assert.equal(result.calls.traits, 1);
  assert.match(html, /id="echo"[^>]*role="status"[^>]*aria-atomic="true"/);
  assert.doesNotMatch(source, /innerHTML\s*=/);
});

test("Reflective Shard handles invalid stored sigil without leaving Loading behind", () => {
  const result = runPage({ getSigilError: new Error("Saved sigil is invalid") });
  assert.equal(result.thrown, undefined);
  assert.equal(result.calls.traits, 0);
  assert.equal(result.nodes.sigil.innerText, "");
  assert.match(result.nodes.echo.innerText, /Preserve existing records/);
});

test("Reflective Shard selects one stable trait snapshot rather than rereading storage", () => {
  const result = runPage({ getTraitsImpl: call =>
    call === 1 ? [] : ["LIAR"] });
  assert.equal(result.thrown, undefined);
  assert.equal(result.calls.traits, 1);
  assert.equal(result.nodes.sigil.innerText, "Your sigil: ABC123-007");
  assert.equal(result.nodes.echo.innerText,
    "You are not yet marked.\nThe Fold watches in silence.");
});

test("Reflective Shard retains SEEKER precedence over simultaneous LIAR", () => {
  const result = runPage({ traits: ["SEEKER", "LIAR"] });
  assert.equal(result.thrown, undefined);
  assert.equal(result.calls.traits, 1);
  assert.equal(result.nodes.echo.innerText,
    "You’ve sought the vault more than once.\nSentinel grants you second sight.");
});
