# Developer notes

## Development

**Goal:** Keep the interactive shard mythology usable, preserve its original voice, and prevent stored or generated dialogue from being treated as HTML. Work is divided into small, independently tested repairs rather than a wholesale rewrite.

**Integration:** The four main shard feeds use the merged inert-text renderer from [PR #1](https://github.com/levelinglucy/Devoured-Web/pull/1). The Councilfire dialogue parsing/display repair is tracked in [PR #2](https://github.com/levelinglucy/Devoured-Web/pull/2); consult that PR for its current proposed/merged state.

**Validation:** The dependency-free `npm test` suite runs under Node 20 and 22 CI. Councilfire's original string quoting failed in the test-first [run 42359642007](https://github.com/levelinglucy/Devoured-Web/actions/runs/42359642007) on both versions. The new tests cover default dialogue, Split and completed Firebound branches, and a source contract requiring inert DOM rendering. The original shard-renderer tests continue to exercise Firestore field rendering and malformed messages. Consult the final PR checks for the exact validated revision. A real browser, deployed Firebase and iPhone have not been tested.

**Publication:** Changes described in this document and the changelog are development source, **not a tagged or published stable release**. A successful PR or CI check is not a release.

**Next useful steps:** Reproduce and repair the separate Reflective Shard multiline-string syntax failure; then investigate Rootcraft's missing `breakfold.js` import with its intended semantics before writing a replacement. Review other localStorage/Firestore-to-HTML data flows only when specific evidence warrants it; inspect live Firestore rules if legitimate deployment access becomes available.

### Current scope and limitations

Sentinel, Ember, Lucid and Mirror use `echo-renderer.js`. Firestore-sourced values are assigned with `textContent`; missing/non-string messages are skipped and shard filtering is retained. Councilfire preserves its original five speakers and condition-specific lines; quotations in `councilfire.js` are valid JavaScript strings, and `councilfire.html` creates `.line` elements with `textContent`. No Firebase rules, stored records or historical ZIPs were changed.

Node's tests use a tiny mock DOM and a disposable localStorage stub. They prove the tested code paths and page-source contract, not comprehensive browser compatibility, actual deployment authorization, power-loss durability or site-wide XSS resistance. Other pages may still use unsafe HTML sinks; no full security audit has been performed.

## Engineering decisions

**Councilfire — preserve dialogue, change representation:** The original embedded quotation marks were literal text but were written unescaped inside double-quoted JavaScript literals, preventing the entire module from parsing. Correcting them with single-quoted JavaScript strings retains the exact story wording and branch behaviour with a small diff. Instead of interpolating dialogue into `innerHTML`, the page creates one styled `div` per line and sets `textContent`, following the existing shard-feed safety pattern. An alternative was to escape every HTML interpolation; direct text assignment is simpler and has fewer failure paths. Revisit only if a future requirement actually needs trusted rich markup.

**Shard feed — inert DOM construction:** An alternative was to HTML-escape each interpolated field before template insertion. The shared renderer assigns `textContent` to explicit nodes, avoiding duplicated escaping rules. The cost is an extra module import and some DOM creation. If real browser performance with large collections becomes material, consider pagination/batching without weakening inert-text semantics.

## Project continuity

The historical static pages and ZIP uploads are retained. Explain verified earlier behaviour and new behaviour, preserve the original fictional setting, and prefer focused defects over speculative or administrative sweeps. The README remains the usage entry point, this file the development home, and the changelog the history of meaningful changes.
