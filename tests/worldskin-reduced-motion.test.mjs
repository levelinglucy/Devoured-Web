import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'worldskin.css'), 'utf8');
const html = readFileSync(join(root, 'shard.html'), 'utf8');

test('Worldskin preserves its four authored themes and ordinary animations', () => {
  for (const cls of ['still', 'awake', 'fractured', 'ignited']) {
    assert.match(css, new RegExp('body\\.' + cls + '\\s*\\{'), cls);
  }
  for (const animation of ['pulseGlow', 'glitch', 'emberPulse']) {
    assert.match(css, new RegExp('@keyframes\\s+' + animation + '\\b'), animation);
  }
  assert.match(html, /<link rel="stylesheet" href="worldskin\.css">/);
  assert.match(html, /transition:\s*background 1s, color 1s;/);
  assert.match(html, /import\s*\{\s*applyWorldskin\s*\}\s*from\s*'\.\/worldskin\.js'/);
  assert.match(html, /id="desc" role="status" aria-atomic="true"/);
});

test('Worldskin respects reduced motion without disabling normal-theme animation', () => {
  const reduce = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(reduce, 'An explicit OS reduced-motion rule is required');
  const block = reduce[1];
  for (const cls of ['still', 'awake', 'fractured', 'ignited']) {
    assert.match(block, new RegExp('body\\.' + cls + '\\b'), cls);
  }
  assert.match(block, /animation:\s*none\s*;/);
  assert.match(block, /transition:\s*none\s*;/);
  assert.doesNotMatch(block, /!important/, 'The scoped selector should be specific enough');
});
