# Developer notes

## Development

**Goal:** Keep the interactive shard mythology usable and protect user-editable browser-local history while preserving its original voice. Fix confirmed security, data-integrity and entry-point failures in bounded changes.

**Integration:** Rootrite PR #11 and throne-history PR #12 are integrated on main `69e70157`. Fold-state reserved-sigil repair is a separate review-branch candidate, not merged.

**Validation:** Existing throne-history regression suite passed 51/51 per Node 20/22 on exact main `69e70157` ([CI](https://github.com/levelinglucy/Devoured-Web/actions/runs/43087630053)). For the Fold candidate, three new synthetic tests passed under local Node 22 after one reserved-key test first failed on predecessor. The exact candidate head `85a556f4` passed 54/54 hosted tests in each Node 20/22 ([CI run 43546517091](https://github.com/levelinglucy/Devoured-Web/actions/runs/43546517091)); this evidence applies to that revision and byte-identical source/test files. No live Firebase/browser, iPhone or storage durability proof is claimed.

**Publication:** No new tagged or published stable release is verified.

**Selected next steps:** Review Fold candidate's exact-head CI and code diff; keep it unmerged if any relevant check is unverified or failing. Preserve separate Worldheart and Beacon parked candidates.

## Decision 2026-11-11: previously earned crowns are not recalculated

**Verified predecessor:** `claimThrone()` recomputed a fresh title/date on every completed quest and returned it even when a crown already existed in `aletheThroneRegistry`. If the quest later became incomplete, it returned `null` despite the stored crown. Wrong-shaped registry data could also throw an unhelpful error. These are behavioural/history consistency defects in the source, not evidence of erased real-world user records.

**Choice:** Check and validate the saved registry first. Return an existing crown unchanged, regardless of today's quest state, without writing again or re-running the quest. Only a previously unclaimed sigil with a currently complete quest receives a new record. Refuse unreadable JSON and entries without a usable sigil rather than silently clearing or replacing any record. Preserve legacy extra fields and optional display-field omissions. The existing throne screen's recovery warning applies to invalid archives.

**Trade-offs:** Records written by an old version remain authoritative, even if quest rules or story titles later change. Incomplete quests cannot create new crowns. A damaged archive blocks new claims until manually recovered; this avoids concealed history loss. Concurrent browser tabs, transactions, browser deployment, hostile local edits and power-loss durability are not guaranteed. [PR #12](https://github.com/levelinglucy/Devoured-Web/pull/12) holds revision-specific validation.

## Decision 2026-11-11: Rootrite faction change must not erase earned thrones

**Predecessor:** The Rootrite button said "Burn your sigil" but did not change `aletheSigil`. It instead removed the entire `aletheThroneRegistry` (including potentially unrelated sigils) before writing `visitorFaction = Wanderer`. If the subsequent faction storage write failed, the history had already been erased. This is confirmed from the tracked inline module and covered by regression cases.

**Choice:** Rename the button to describe becoming a Wanderer while keeping history. Remove the registry deletion; change only `visitorFaction`. Show a success message after the store succeeds, and a clear failure message on a rejected write. The story role remains browser-editable and is not authentication. We do not silently regenerate sigils or erase old claims.

**Trade-offs:** A user who expected Rootrite to wipe all throne records will now retain them. A destructive reset, if intentionally wanted later, should have separate, explicit scope, export guidance and confirmation. Existing archive corruption, browser-storage loss and power-loss durability are outside this patch. [PR #11](https://github.com/levelinglucy/Devoured-Web/pull/11) owns the exact-revision evidence.

## Decision 2026-11-11: territory faction labels are text, not markup

**Predecessor:** `warpath.js` records the browser-local `visitorFaction` as a key in `warpathTally`. The territory page interpolated those stored keys directly into `innerHTML`. Because browser-local faction values are editable, HTML-looking names became interpreted markup. A test-first fake DOM rejects HTML parsing on that route, while retaining actual tally/contribution logic.

**Choice:** Replace the single HTML string with one plain `div` per sorted faction, populated with `textContent`, and replace the loading placeholder with `replaceChildren`. Keep descending power order, the dominant-faction label, existing visit contribution, and stored record format unchanged.

**Limits:** This is one display-path repair, not proof of site-wide XSS resistance, authentication or deployment security. [PR #8](https://github.com/levelinglucy/Devoured-Web/pull/8) proposes a non-destructive error state for damaged `warpathTally`; local browser storage remains neither trustworthy nor durable. [PR #7](https://github.com/levelinglucy/Devoured-Web/pull/7) is the canonical revision-specific test and integration record.

### Current scope and limitations

Sentinel, Ember, Lucid and Mirror use `echo-renderer.js`. Firestore-sourced values are assigned with `textContent`; missing/non-string messages are skipped and shard filtering is retained. Councilfire preserves its original five speakers and condition-specific lines; quotations in `councilfire.js` are valid JavaScript strings, and `councilfire.html` creates `.line` elements with `textContent`. Reflective Shard keeps its five two-line response texts and SEEKER-first precedence, spelling the line breaks as `\n` inside valid double-quoted JavaScript literals and assigning the result via `innerText`. No Firebase rules, stored records or historical ZIPs were changed.

Rootcraft previously imported missing `breakfold.js`, so `window.cast` did not register. [PR #4](https://github.com/levelinglucy/Devoured-Web/pull/4) supplies the exported `isWanderer()` and `injectFragment()` backed by existing `faction.js` (`visitorFaction`) and `fragments.js` (`aletheFragments`), and changes `fragments.html` to build inert text nodes rather than parse local saved values as HTML. A root-script receives a distinct Root-script number and a 2,000-character limit; invalid/oversize text and unreadable archive data fail without resetting stored records. This is **browser-local**, does not communicate with Firebase, and uses an editable browser-side fictional role, not security authorization. Historical ZIP files are preserved and their binary contents were not readable through the connected text-only GitHub tool; no recovered original `breakfold.js` behaviour is claimed.

Living Sigil previously used a double-brace import that cannot parse as a JavaScript module and inserted user-editable localStorage sigil, trait and mutation strings into `innerHTML`. `mysig.html` now uses a valid named import and creates headings, spans and fallback text with `textContent`/`createTextNode`, preserving visible labels and the underlying stored records. The sigil module's JSON decoding and storage semantics are unchanged; corrupt JSON can still interrupt page setup and is not silently repaired. No live browser or deployment has been tested.

Node's tests use a tiny mock DOM and a disposable localStorage stub. They prove the tested code paths and page-source contract, not comprehensive browser compatibility, actual deployment authorization, power-loss durability or site-wide XSS resistance. Other pages may still use unsafe HTML sinks; no full security audit has been performed.

## Decision 2026-11-11: a damaged tally is not an empty tally

**Verified predecessor:** The Territory page parsed `warpathTally` three times without handling bad JSON, stopping rendering for malformed records. A wrong-shaped or overflowing count could also be silently coerced by `+ 1`; faction keys such as `__proto__` did not behave as ordinary own properties on a plain object.

**Choice:** Load a missing key as an empty tally, but reject unreadable, non-object, negative, non-integer, non-finite or unsafe-integer counts before any write. Copy valid keys to a null-prototype map and refuse an increment that would exceed the safe-integer range. On failure, show a plain-text error and keep the original localStorage record for manual recovery. This is intentionally not auto-repair, auto-reset, or a migration of existing values.

**Trade-offs and revisit:** Existing locally edited fractional or enormous counts are now rejected rather than coerced, prioritising evidence preservation over permissive display. No automatic recovery is possible without deciding how to interpret damaged counts. Real-browser behaviour, storage corruption outside this route and power-loss durability remain untested. [PR #8](https://github.com/levelinglucy/Devoured-Web/pull/8) holds the revision-specific evidence.

## Decision 2026-11-11: damaged Living Sigil lists remain recoverable

**Verified predecessor:** The page read `sigilHistory` and `sigilTraits` with unchecked `JSON.parse`. A malformed history interrupted display; `mutateSigil()` wrote the new current form before reading that history, so a damaged list left the form changed with no corresponding history entry. Wrong-shaped lists could also throw non-actionable method errors.

**Choice:** Require stored history/traits to be arrays of text entries; missing keys still mean empty lists. Reject malformed or wrongly typed values without rewriting them, preflight mutation history before updating the current form, and report a damaged section as inert text while other healthy page sections remain visible. Existing valid lists and visible labels keep their format and order.

**Boundaries:** This prevents the *known invalid-history preflight* partial update, not every two-key transaction failure: a browser quota error, crash or power loss between writes can still split current form and history. Browser storage remains user-editable. No silent repair or reset occurs; bad lists require manual recovery. [PR #9](https://github.com/levelinglucy/Devoured-Web/pull/9) owns exact-revision validation.

## Decision 2026-11-11: an unreadable Echoform count is not a fresh first visit

**Predecessor:** `echoform.js` parsed browser-local `echoformVisits` without guarding malformed JSON, then incremented arbitrary properties of a normal object. Wrong-shaped or unsafe counts could silently coerce, and the inherited names `__proto__` and `constructor` did not work as literal visit keys. The Glyph page called this code without an error display, so damaged local data broke its voice entirely.

**Choice:** Treat a missing store as empty, but require an existing store to be a plain JSON object of nonnegative safe-integer counts. Reject any malformed record or unsafe next increment *before* writing, preserve its original bytes for manual recovery, and use a null-prototype map for special names. The Glyph page catches failure and shows an inert warning while keeping the original four narrative messages for ordinary valid visits.

**Trade-offs:** Invalid or legacy fractional counts that previously coerced are now rejected. This is one browser-local counter, not trusted identity or a multi-key transaction. The tests use a Node VM stub and do not prove live browser, iPhone, interprocess or power-loss durability. [PR #10](https://github.com/levelinglucy/Devoured-Web/pull/10) owns exact-revision validation.

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

## Decision 2026-11-14: Firestore sigil IDs are data, not object prototypes

**Observed predecessor:** `fold.js` used `traitMap = {}` to group Firestore-sourced echo sigils. Reserved strings `__proto__`, `constructor` and `toString` instead resolved inherited properties. Three independent sigils with three rebellion echoes each produced `Awake`, not the intended `Ignited`. In particular, incrementing `__proto__` could assign `rekindled = NaN` to `Object.prototype` within the page realm. A Node VM regression using synthetic Firestore snapshots first failed on this exact old source (2 pass / 1 fail).

**Choice:** Use `Map` with `has/get/set` for per-sigil rebellion counters, leaving the existing `Fractured > Ignited > Awake > Still` thresholds and queries unchanged. Reserved strings are now ordinary distinct identities; the counting path no longer accesses inherited object properties. No data migration or Firebase rules change is involved.

**Validation and limits:** Local Node 22 tests on the candidate passed 3/3 including module syntax, the ordinary thresholds and reserved-name isolation; exact candidate `fold.js` and new test Git blobs were independently read back against locally tested files. This is a small in-memory counting correction, **not** a Firestore schema validation or site-wide prototype-pollution audit. Non-string missing/ambiguous IDs and malformed anomaly categories deserve separate schema decisions rather than implicit coercion here. No live Firebase/browser or release claim. The exact candidate head `85a556f4` passed 54/54 hosted tests on each Node 20 and 22; check current branch revisions separately. Revisit if Firestore schemas become defined, especially how to treat absent IDs.
