# Developer notes

## Development

**Goal:** Keep the interactive shard mythology usable and preserve its original voice while rendering browser-saved and fetched narrative data as inert text. Address proven functional/security regressions in small, testable changes.

**Integration:** Shard feed, Councilfire, Reflective Shard, Rootcraft, Living Sigil and archive-view repairs are integrated through [PRs #1–6](https://github.com/levelinglucy/Devoured-Web/pulls?q=is%3Apr+is%3Amerged). The territory tally's stored-faction rendering correction is tracked in [PR #7](https://github.com/levelinglucy/Devoured-Web/pull/7); the PR owns its exact integration status and validation evidence.

**Validation:** Dependency-free `npm test` exercises Node 20/22. [PR #6](https://github.com/levelinglucy/Devoured-Web/pull/6) preserves the archive-view test history; [PR #7](https://github.com/levelinglucy/Devoured-Web/pull/7) preserves the territory test-first failure and its candidate validation. Syntax and fake-DOM tests do not prove real browser, deployed Firebase or complete site security.

**Publication:** These changes are development source, **not a verified tagged or published stable release**.

**Next useful steps:** Validate and integrate the territory change only after exact-head checks; follow confirmed regressions elsewhere if found, or choose another worthwhile portfolio project. No site-wide cosmetic or speculative security audit is planned.

## Decision 2026-11-11: territory faction labels are text, not markup

**Predecessor:** `warpath.js` records the browser-local `visitorFaction` as a key in `warpathTally`. The territory page interpolated those stored keys directly into `innerHTML`. Because browser-local faction values are editable, HTML-looking names became interpreted markup. A test-first fake DOM rejects HTML parsing on that route, while retaining actual tally/contribution logic.

**Choice:** Replace the single HTML string with one plain `div` per sorted faction, populated with `textContent`, and replace the loading placeholder with `replaceChildren`. Keep descending power order, the dominant-faction label, existing visit contribution, and stored record format unchanged.

**Limits:** This is one display-path repair, not proof of site-wide XSS resistance, authentication or deployment security. Deliberately malformed `warpathTally` JSON can still interrupt the page, and local browser storage is neither trustworthy nor durable. [PR #7](https://github.com/levelinglucy/Devoured-Web/pull/7) is the canonical revision-specific test and integration record.

### Current scope and limitations

Sentinel, Ember, Lucid and Mirror use `echo-renderer.js`. Firestore-sourced values are assigned with `textContent`; missing/non-string messages are skipped and shard filtering is retained. Councilfire preserves its original five speakers and condition-specific lines; quotations in `councilfire.js` are valid JavaScript strings, and `councilfire.html` creates `.line` elements with `textContent`. Reflective Shard keeps its five two-line response texts and SEEKER-first precedence, spelling the line breaks as `\n` inside valid double-quoted JavaScript literals and assigning the result via `innerText`. No Firebase rules, stored records or historical ZIPs were changed.

Rootcraft previously imported missing `breakfold.js`, so `window.cast` did not register. [PR #4](https://github.com/levelinglucy/Devoured-Web/pull/4) supplies the exported `isWanderer()` and `injectFragment()` backed by existing `faction.js` (`visitorFaction`) and `fragments.js` (`aletheFragments`), and changes `fragments.html` to build inert text nodes rather than parse local saved values as HTML. A root-script receives a distinct Root-script number and a 2,000-character limit; invalid/oversize text and unreadable archive data fail without resetting stored records. This is **browser-local**, does not communicate with Firebase, and uses an editable browser-side fictional role, not security authorization. Historical ZIP files are preserved and their binary contents were not readable through the connected text-only GitHub tool; no recovered original `breakfold.js` behaviour is claimed.

Living Sigil previously used a double-brace import that cannot parse as a JavaScript module and inserted user-editable localStorage sigil, trait and mutation strings into `innerHTML`. `mysig.html` now uses a valid named import and creates headings, spans and fallback text with `textContent`/`createTextNode`, preserving visible labels and the underlying stored records. The sigil module's JSON decoding and storage semantics are unchanged; corrupt JSON can still interrupt page setup and is not silently repaired. No live browser or deployment has been tested.

Node's tests use a tiny mock DOM and a disposable localStorage stub. They prove the tested code paths and page-source contract, not comprehensive browser compatibility, actual deployment authorization, power-loss durability or site-wide XSS resistance. Other pages may still use unsafe HTML sinks; no full security audit has been performed.

## Engineering decisions

**Living Sigil — preserve browser-local data, remove HTML interpretation:** The page's `import {{...}}` was an invalid module declaration, so none of its content initialized. Fixing the syntax alone would still interpolate editable localStorage values into HTML. Rendering explicit nodes with `textContent` preserves arbitrary text, existing section names and fallback labels without introducing a sanitizer or changing `sigil.js`'s storage format. The alternative of escaping each interpolation duplicates rules and is easier to regress. This protects this one rendering path; it neither validates historical storage nor proves the rest of the site free of injection paths.

**Rootcraft — conservative local fragment bridge rather than speculative server features:** The only tracked consumer of missing `breakfold.js` requests `injectFragment` and `isWanderer`; existing `rootrite.html` grants the editable `Wanderer` faction via `faction.js`, and `fragments.js` already stores fragment title/text records locally. Reusing those components avoids inventing remote authentication, Firestore collections or external publication rights. The original `breakfold.js` implementation and ZIP archive internals were not verified. The rootcast route checks the story faction again within the write function, rejects empty/oversize input and fails closed on damaged existing JSON. Saved values become visible to the owner through `fragments.html`, whose former `innerHTML` interpolation would have interpreted user-written markup. Rendering with DOM `textContent` removes that particular injection path without changing the storage format. The trade-off is intentionally limited behaviour: local-only writes, no cross-device sync, no trusted identity or power-loss durability. Revisit when trustworthy original source or new requirements appear.

**Councilfire — preserve dialogue, change representation:** The original embedded quotation marks were literal text but were written unescaped inside double-quoted JavaScript literals, preventing the entire module from parsing. Correcting them with single-quoted JavaScript strings retains the exact story wording and branch behaviour with a small diff. Instead of interpolating dialogue into `innerHTML`, the page creates one styled `div` per line and sets `textContent`, following the existing shard-feed safety pattern. An alternative was to escape every HTML interpolation; direct text assignment is simpler and has fewer failure paths. Revisit only if a future requirement actually needs trusted rich markup.

**Reflective Shard — preserve line breaks without changing its voice:** Literal newlines inside double-quoted JavaScript strings made the inline module fail to parse before sigil display. Using `\n` escapes inside the same strings retains the two displayed lines and original trait priority, with a minimal change and no new runtime dependency. An alternative was template literals; escapes are less disruptive to the existing source format. Tests parse the original inline module under Node and exercise the five responses with a disposable DOM stub; that does not test a real browser or persistent storage.

**Shard feed — inert DOM construction:** An alternative was to HTML-escape each interpolated field before template insertion. The shared renderer assigns `textContent` to explicit nodes, avoiding duplicated escaping rules. The cost is an extra module import and some DOM creation. If real browser performance with large collections becomes material, consider pagination/batching without weakening inert-text semantics.

## Project continuity

The historical static pages and ZIP uploads are retained. Explain verified earlier behaviour and new behaviour, preserve the original fictional setting, and prefer focused defects over speculative or administrative sweeps. The README remains the usage entry point, this file the development home, and the changelog the history of meaningful changes.

### Archive-view repair (PR #6)

Pantheon, Ritual Trail and Shard Thrones previously contained literal escape characters before JavaScript template-literal delimiters and interpolation expressions; the inline modules therefore could not parse. Ritual Trail and Shard Thrones additionally interpolated locally editable registry records into HTML. PR #6 replaces the three page renderers with explicit DOM elements and textContent, preserving the original labels, field ordering, 200-character preview length, CSS class names and localStorage formats.

Empty lists show plain-text messages; unreadable or wrong-shaped local registries show an error without clearing the underlying storage. The tests check native parsing, hostile-looking saved text, field rendering and malformed registries. No claim is made about archived ZIP content, real-browser deployment, or cross-origin storage attackers.
