# Developer notes

## Development — Shard first-theme contrast (Unreleased)

**Goal:** Keep the status text legible when the first Fold palette is applied, while retaining normal-motion thematic animations and the existing reduced-motion preference.

**Integration:** [Draft PR #48](https://github.com/levelinglucy/Devoured-Web/pull/48) is based on main `f7602f17`; not merged or deployed.

**Validation:** Test-first `e2a9b6cb` [served Chrome](https://github.com/levelinglucy/Devoured-Web/actions/runs/46048419253) failed the Still first-theme nominal contrast assertion (1.025:1); [Node 20/22](https://github.com/levelinglucy/Devoured-Web/actions/runs/46048419195) each failed the new transition assertion (160/161). In isolated Chromium 144, using hash-matched HTML/CSS with the Firebase module removed, all four normal-motion initial themes crossed below 4.5:1 before the fix. All eight candidate theme/preference cases passed 151 sampled frames per case, minimum 6.0189:1 across all candidate cases. Actual candidate hosted checks pending. Nominal computed fills on the default light canvas, not glyph halos, continuous-time guarantees, live Firebase, Safari/iPhone, or full accessibility conformance.

**Release:** Unreleased. **Next:** Verify exact candidate served-browser/Node jobs and current branch rules, then review for integration. Confirm exact merged-main validation/deployment separately.

**Decision:** Switch foreground/background together via `transition: none` on Shard; keep pulseGlow, glitch and emberPulse under ordinary motion, and the scoped reduced-motion rule. The original gradual theme fade is removed because it briefly made foreground/background nearly equal in luminance. A staged accessible fade could be designed later if needed, with equivalent contrast regression coverage. Reference: [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Earlier development record (historical snapshot)

## Development

**Goal:** Make tied faction strengths produce the same story-gate winner and Territory heading regardless of saved JSON insertion order. Preserve the existing single-leader gate; do not reinterpret story design as backend authorization.

**Integration:** [Draft PR #47](https://github.com/levelinglucy/Devoured-Web/pull/47), based on `main` at `4c20fefe`. Unmerged; no production behaviour changed yet. Separate Fragment storage [draft PR #46](https://github.com/levelinglucy/Devoured-Web/pull/46) and private IndexedDB study remain parked because old/noncooperating tabs can lose new localStorage writes and native v2 browser validation is blocked.

**Validation:** The independent helper's source-locked, disposable VM tie investigation found divergent Red/Blue gate outcomes from equal tallies in opposite JSON key orders (17 local assertions; not real player evidence). New gate regression tests were committed before source changes at `fba8e6af`. Territory's VM tests now compare both key orders; `warpath.js` exports a shared count-descending/name-ascending ranking. Exact updated candidate Node 20/22 CI still requires inspection before integration; no browser/iPhone or live-history certification.

**Release:** Unreleased, no tag or deployment. This is a local narrative-rule choice, not an authentication security fix.

**Next:** (1) Inspect exact PR #47 test results and correct any source/test failures. (2) Decide whether deterministic name priority is the intended fictional tie rule or whether a separately specified contested state would be preferable. (3) Keep PR draft until narrative choice and relevant checks are satisfactorily reviewed.

## Decision 2026-11-18: faction tie priority

**Observed:** Descending-count-only stable sorting inherits the order of valid saved faction object keys. Equal `Red=2, Blue=2` could therefore present either winner, and `warlock.js` would allow or redirect the same Red visitor based solely on historical serialization order.

**Choice for review:** Retain one leader, sort descending by count, then ascending by exact JavaScript string code units. Share the ranking function with Territory so its snapshot display and later gates cannot disagree because of different comparators. This deliberately selects Blue over Red in an exact tie; it does not claim alphabetic priority is fairer than shared control.

**Alternatives/revisit:** A `Contested` state could give tied leaders equal narrative treatment, but would need explicit gate and UI semantics to avoid accidentally barring every visitor. Revisit if game design calls for contested territories or visitors reasonably expect tied control. Neither policy establishes a server authorization boundary.

## Previous completed milestone: reduced-motion Worldskin CSS

**Integration:** PR #45 merged on main at `4c20fefe`; [merged-main Node checks](https://github.com/levelinglucy/Devoured-Web/actions/runs/44347756102) and [served Chrome checks](https://github.com/levelinglucy/Devoured-Web/actions/runs/44347756397) passed; [Pages deployment](https://github.com/levelinglucy/Devoured-Web/actions/runs/44347755168) succeeded. No tagged release, Safari or iPhone accessibility certification.

## Decision 2026-11-18: reduced-motion Worldskin CSS

**Observed:** `worldskin.css` defined `pulseGlow`, `glitch` and `emberPulse` as infinite animations for Awake, Fractured and Ignited; `shard.html` declared a later 1s body background/colour transition. Neither honored `prefers-reduced-motion`. With genuine CSS evaluation, ordinary theme transitions can also yield mid-transition sampled colours; a comparison must wait for them to settle.

**Choice:** Append a `@media (prefers-reduced-motion: reduce)` rule scoped to `body.still, body.awake, body.fractured, body.ignited` and declare `animation: none; transition: none;`. Class specificity beats the later plain `body` transition without `!important`. No script, story text, state mutation, stored history, timing or no-preference CSS changes were intended.

**Trade-offs:** Under reduced motion, Ignited shows its static authored `#200000` background rather than the current animated Ember frame. The stylesheet can be shared by other pages with these Fold classes, where suppression is also expected. The served browser test isolates presentation and does not prove full production Firebase flow, Safari/VoiceOver, accessibility conformity or a deployment.

## Previous completed milestone: passive reader mobile reflow

**Integration:** [PR #44](https://github.com/levelinglucy/Devoured-Web/pull/44) merged at exact main `5f227429`. **Validation:** Served Chrome final PR [run 44336280131](https://github.com/levelinglucy/Devoured-Web/actions/runs/44336280131) passed **6/6** width/text checks; exact-main Node 20 and 22 [run 44336619519](https://github.com/levelinglucy/Devoured-Web/actions/runs/44336619519) passed **155/155 each** and [Pages workflow 44336618273](https://github.com/levelinglucy/Devoured-Web/actions/runs/44336618273) built/deployed successfully. No tagged release or native iOS certification.

## Decision 2026-11-18: passive reading width on mobile

**Observed:** `godpulse.html`, `shardthrone.html` and `councilfire.html` had no viewport meta. Helper-controlled isolated Chromium mobile fixtures showed a virtual 980px layout and fractional initial visual scale at 320/390px widths. Inserting the zoom-permissive viewport into those fixtures restored actual device CSS widths. The fixture contained transcribed rather than served pages, so this is evidence of the browser viewport mechanism, not a Safari or production proof.

**Change:** Insert `<meta name="viewport" content="width=device-width, initial-scale=1.0">` after charset, without limiting zoom. The live browser's 200%-text failure motivated one narrow-only `@media (max-width: 600px)` rule on each page to reduce body padding from 3em to 1em and use `overflow-wrap: anywhere` for long headings/sigils. No JavaScript or storage paths changed. Static tests retain module imports and h1 elements; served Chrome test exercises real modules, not a DOM replacement.

**Limits:** Desktop body padding remains 3em; narrow screens now use 1em, with line wrapping that may change visual composition. Chrome's synthetic 200% root text stress is not native Safari Dynamic Type, VoiceOver, actual touch ergonomics or human readability validation. Do not claim WCAG certification or full mobile support.

## Previous completed milestone: saved story heading semantics


**Goal:** Make saved Fragment and Ritual Trail record titles navigable as native h2 headings without changing their visible card sizing, inert text, or browser-local history.

**Integration:** [PR #43](https://github.com/levelinglucy/Devoured-Web/pull/43) owns this accessibility change; inspect its live merge state rather than treating branch validation as deployment. Previous Echoquest isolation [PR #42](https://github.com/levelinglucy/Devoured-Web/pull/42) merged at main `109aff43`; this is a separate milestone.

**Validation:** Source-locked independent Chromium accessibility/layout fixtures (helper self-selected-142) motivated the change but were not real application pages. New Node VM assertions and the actual served-origin Chrome smoke test exercise real page modules with disposable synthetic localStorage, heading navigation, inert markup and card layout relative to the original div. Test-first head `1f5143e` failed 2/153 expected Node assertions ([run 44296687471](https://github.com/levelinglucy/Devoured-Web/actions/runs/44296687471)) and timed out seeking old-page h2 elements ([run 44296687518](https://github.com/levelinglucy/Devoured-Web/actions/runs/44296687518)). Source correction `89536329` passed 153/153 Node assertions on each of Node 20/22 ([run 44296751954](https://github.com/levelinglucy/Devoured-Web/actions/runs/44296751954)); its first browser attempt caught a wrong **test assumption** (Chrome's monospace font is 13px), not a detected production layout mismatch ([run 44296751993](https://github.com/levelinglucy/Devoured-Web/actions/runs/44296751993)). Revised browser test compares the real h2 to a disposable equivalent historical div at both widths. Source/test/browser code head `3ead2bbe` passed **153/153 per Node 20/22** ([run 44297022527](https://github.com/levelinglucy/Devoured-Web/actions/runs/44297022527)) plus both served-origin page checks ([run 44297022449](https://github.com/levelinglucy/Devoured-Web/actions/runs/44297022449)); all three logs inspected. Exact later source+docs head `7e2656d7` also passed **153/153 per Node 20/22** ([run 44297179751](https://github.com/levelinglucy/Devoured-Web/actions/runs/44297179751)) and the served-origin Chrome workflow ([run 44297179613](https://github.com/levelinglucy/Devoured-Web/actions/runs/44297179613)); logs inspected. After documentation-only changes, recheck the current PR head rather than treating an earlier green run as automatic proof.

**Release:** Unreleased. A GitHub Pages build or a merge is not a tagged release, VoiceOver test or iOS certification.

**Next:** (1) Independently verify exact PR and, if integrated, exact merged-main Node/Chrome checks before making an integration claim. (2) Seek Safari/iPhone VoiceOver and enlarged-text evidence when feasible; no device certification is implied by Chromium results. (3) Preserve unrelated storage, backups, and story state.

## Decision 2026-11-18: semantic story-record headings without layout drift

**Observed:** `fragments.html` and `trail.html` already have a page h1 and backup section h2, but each saved record title was a visual bold div. Native heading navigation consequently skipped the saved records in the helper's two-record Chromium accessibility fixture. Simply replacing div with h2 also introduced default heading font/margins, inflating card heights in those fixtures. This is not proof of actual Safari/VoiceOver behaviour.

**Choice:** Replace the record-title element only with h2 and explicitly set `font-size:1em` and original margins in the existing title CSS classes. Leave textContent rendering, fallback titles, saved shapes, storage readers, backup previews, page headings and all other card children unchanged. Keep h2 for the existing backup section; this naturally creates multiple peer-level headings under each page h1.

**Tests and limitations:** The two existing Node DOM-stub regressions now assert h2. Extend the already established served-origin browser workflow to load synthetic records into the actual imported page modules, check heading roles and inert markup, and compare computed font typography and card height against a temporary original-div clone at 390px/1280px. Browser tests cannot establish full WCAG conformance, native iOS VoiceOver, Safari, other fonts/zoom or reader preferences. No real archive is touched.

## Decision 2026-11-18: path-scoped Fragment archive reads in Echoquest

**Evidence:** A malformed, present `aletheFragments` archive was unconditionally loaded by `getEchoquest()` before path selection, causing Fire/Lost/Split/Undefined quests to show a generic recovery warning despite having no Fragment dependency. Test-first four unrelated path cases failed at exact original code, with three invalid archive shapes each; two Witness integrity/valid-completion controls passed.

**Choice:** Read fragments inside the Witness branch only. Other quest paths no longer touch the unrelated archive. Leave `getFragments()`'s refusal of bad records, existing progress checks, and Lost first-visit write semantics unchanged. The new production difference is only the placement of that existing read; no storage migration or error masking.

**Limitations:** `getSigilPath()` and `getSigilHistory()` remain cross-feature dependencies; one-line isolation does not make all saved data independent. Tests inject the chosen path in a Node VM with simulated localStorage, not full live browser routing. Revisit if real user flow shows stronger dependencies or if a different global-fail-closed policy is explicitly required.

## Decision 2026-11-17: append-only fragment history representation

**Evidence:** In exact baseline fragment writer blob `9c2e62a7`, appending a new title parses then reserializes every historical entry. A synthetic, structurally valid archive with additional fields containing numeric literal `1e999`, integer `9007199254740993`, duplicate JSON keys and escaped Unicode is normalized during the append. The independent Sandbox found this and supplied a source-locked counterexample. The predecessor failed the two new history/empty-array byte-preservation checks; duplicate-title no-write was already correct.

**Choice:** Use one validated raw archive snapshot; preserve the existing `getFragments()` returned array and strict title/text shape checks. Insert only the freshly serialized object before the final closing array bracket, preserving old raw bytes, whitespace and trailing line endings. Absent storage still creates a normal single-entry array. Existing malformed archive, input type and duplicate refusal behaviours remain unchanged. This follows the established Ritual Trail writer rather than introducing a new parser, migration or storage key.

**Limitations:** Browser localStorage offers no cross-tab transaction and may reject writes or lose stored history. Raw-preserving append is not encryption, data provenance, automatic backup, format repair, numeric precision recovery in in-memory parsed values, or proof that visitor archives actually contain exotic fields. Synthetic local VM tests only. Revisit for real supported historical formats and concurrency requirements.


## Decision 2026-11-17: grouped mobile access to Vault, Fragments and Trail

**Evidence:** The helper audited the exact 29-page tracked HTML tree at Devoured-Web main `82ac86fb`: 19 pages lacked viewport meta, but only three of those contained native controls. Its isolated source-locked Chromium Vault experiment at 320/390px measured a virtual 980px layout and 16.98/20.69px effective Unseal button; device-width meta alone restored 52px. This is emulation, not a production/mobile observation.

**Choice:** Add device-width, zoom-permissive viewport tags to these three action pages. Vault retains its existing UI/script unchanged. Fragments/Trail get a 44px wrapping backup button, 16px button/textarea type, and narrower mobile padding. Trail wraps the 200-character `pre` preview so one long filename/content line cannot force a sideways scroller. Do not modify either backup module or stored record logic. Keep old textarea content and accessibility names.

**Evidence/limits:** Source-level script blocks are byte-identical to predecessor for all three pages; previous pages had no viewport metadata. Dependency-free Node source assertions cover the intended invariants. Neither browser-origin storage, real historical backups, actual Safari/iPhone/VoiceOver, text zoom nor WCAG conformance is demonstrated by static tests. Revisit if real devices or zoom expose a layout regression.

## Decision 2026-11-17: Rootrite touch action and status feedback

**Observed:** At main `e49b2b07`, Rootrite lacked a mobile viewport, had a 21px-high desktop-style native button that the helper's *isolated headless Chromium emulation* measured as ~6.9/8.4 effective CSS px at 320/390 mobile widths due to virtual 980px scaling, and displayed faction-change results in an unmarked div. This was not a live iPhone or visitor observation.

**Choice:** Add a standard device-width viewport without disabling zoom, a 16px/44px native button with wrapping and constrained width, a narrower <=600px body padding and `role="status" aria-atomic="true"` on the existing result element. Preserve the entire inline module and its `storeFaction("Wanderer")` write, the two existing outcome messages, story, animation and reduced-motion override unchanged.

**Evidence and trade-offs:** The independent helper's source-locked Playwright Chromium comparison tested three widths, with module removed identically from both variants for isolated layout; it did not exercise the writer. Three new Node regression assertions cover viewport, action and status. Source-level predecessor checks failed 0/3 and the candidate's direct structure assertions passed 9/9 (not a Node harness run). Desktop button target becomes taller, intentionally. Live served-origin behavior, Safari/VoiceOver announcements, text zoom, cross-device storage and WCAG conformance remain unverified. Revisit if real device feedback calls for adjusted design.

## Decision 2026-11-17: Underfold passage mobile viewport

**Observed:** At baseline Devoured-Web main `b12b93d0`, `banned.html`, `underfold.html` and `whisper.html` lacked viewport metadata. The helper's isolated source-locked Chromium experiment measured a 980px mobile layout viewport scaled to ~0.327 at 320px and ~0.398 at 390px. This is an instrumented rendering observation, not a report from actual visitors.

**Choice:** Add only `<meta name="viewport" content="width=device-width, initial-scale=1.0">` immediately after charset in each of these three original narrative pages. Their CSS, text and four exits remain unchanged. Preserve zoom freedom; do not add `user-scalable=no` or a maximum scale restriction. Three dependency-free source tests lock those facts.

**Trade-offs:** Helper's nine headless `set_content` comparisons showed device-width mobile layout without document overflow, and unchanged desktop layout/links; actual navigation was not clicked. Natural text wrapping may differ. Neither real served-origin browser behavior, iPhone Safari, text zoom, VoiceOver, WCAG conformance nor live deployment is established. Revisit if real accessibility/layout feedback differs.

## Decision 2026-11-17: Rootcraft eligibility-read failure boundary

**Observed:** `window.cast` evaluated `isWanderer()` outside its save `try/catch`. A blocked browser-local faction read could throw without filling the existing live status region; after an earlier successful save, a later failure could leave stale success text. Reproduced with injected exceptions in the exact source module under synthetic Node VM fixtures, not with live visitors.

**Choice:** Catch only failures of `isWanderer()`, display a fixed and nonrevealing "Could not check the saved faction. Nothing was changed." warning, and return before reading input or calling `injectFragment`. Preserve the existing non-Wanderer decision, success wording, writer-error behaviour and storage logic. Existing records are not automatically changed or reset.

**Trade-off:** The fixed message speaks specifically about the failed eligibility-check path, not the entire session; an earlier successful save may already exist. This is not a browser policy workaround, global storage-error handler or guarantee against cross-tab changes. Revisit if genuine browser testing exposes different inaccessible-storage behaviour.

## Decision 2026-11-17: truthful Echoquest descriptions

**Observed:** Witness completes on three fragments without a Force visit. The Lost timer is created on first Echoquest inspection and never examines a Fragments visit. Fire and Split consume `echoCount`/`glitchTrigger` and `mirrorLoop` flags, but the current tracked runtime showed no corresponding progress writers; `glitch.html` is absent. The independent helper confirmed these against the exact source with synthetic progress fixtures. This is not proof that older external writers or archived builds never existed.

**Choice:** Change only the four visitor task sentences. Witness now names the fragment threshold; Lost accurately names the first quest inspection; Fire and Split disclose unfinished event generation and remove the dead redirect. Keep titles, predicates, existing stored flags, timer semantics and all actual storage reads/writes unchanged. No backfill, reset or invented progress.

**Trade-off:** Fire/Split status can still show complete for old, manually seeded or external milestones, while their text says this build does not generate them. That is intentional compatibility. A future fully playable design should specify the events, origin and migration strategy before adding writers. This bounded wording correction is not a live game/browser acceptance result.

## Decision 2026-11-17: keyboard-accessible Threshold entrance

**Observed:** The original three text questions had only placeholder text, no explicit label associations, and the Enter control used only `onclick`, so pressing Enter from an input did not submit. The independent helper reproduced this with instrumented Chromium DOM interactions against the exact source blob. Not a live visitor report.

**Choice:** Wrap the existing controls in a native form with `onsubmit="decideShard(); return false;"`, use a real submit button and explicit visible `label for` associations. Keep `decideShard()`, sigil initialization, saved identity protection and all story route conditions byte-for-byte unchanged. Keep the input labels/form centre aligned; give controls 16px fonts and the submit button a 44px minimum target. Add polite status semantics for the existing result text.

**Trade-offs:** Returning false prevents the browser's default form navigation while the existing function decides the route. The change adds no archive write and does not change input data handling, but may alter layout/focus/keyboard behaviour. Source tests and synthetic DOM prove only their exercised behaviours, not served-origin navigation, mobile Safari, screen reader announcements or full WCAG conformance. Review/revisit if real-browser focus or rendering differs.

## Decision 2026-11-17: successful but empty echo feeds

**Observed:** The shared renderer calls `grid.replaceChildren()` immediately and appends orbs only for records whose text `message` matches the selected domain. A fulfilled zero-record query or only unrelated/malformed messages therefore replaces "Loading..." with a blank area. This is a source-level outcome reproduced with a fake DOM, not an observed live incident.

**Choice:** After processing a fulfilled snapshot, show fixed inert text "No [Domain] echoes found yet." only when no matching records were rendered. Preserve matching records, original filtering, and existing page-level Firestore failure warnings. No data or network writes and no new dependencies.

**Trade-off:** "No echoes" means none matching in the successfully fetched snapshot, not proof a database has no historical records or that another user's view is identical. Fake DOM tests do not prove live Firebase, browser accessibility or mobile presentation.

## Decision 2026-11-17: Reflective Shard's read failure and snapshot

**Observed:** The baseline calls `hasTrait()` repeatedly (up to four browser-local reads); a corrupted present `sigilTraits`, bad `aletheSigil` or blocked read throws before the page replaces `Loading reflection...`. The helper reproduced this against source-equivalent Node DOM/storage fixtures, not actual user data.

**Choice:** Read the validated trait list once with `getTraits()`, preserve the same SEEKER/VAULTBOUND/REKINDLED/LIAR precedence, and put the page's text-only display behind a catch that clears partial narrative and shows a fixed recovery warning. No automatic reset, rewrite, upload or leaking raw exception strings.

**Trade-offs:** `getOrCreateSigil()` can initialize a previously absent identity before a later trait read fails; the warning deliberately does not promise zero writes. A single snapshot makes this rendering internally consistent, but does not prevent cross-tab lost updates or later changes. Static import errors, DOM failure modes, real browser/iPhone/Safari and actual screen-reader announcements remain outside synthetic validation.

## Decision 2026-11-17: Force and Sigilpath visible read failure

**Observed:** The exported `getTraits`, `getOrCreateSigil` and `getSigilHistory` deliberately throw for malformed *present* localStorage records. Force's inline script left `Calculating...` in place; Sigilpath left its fields blank. A simulated error after one successful DOM assignment could leave partially misleading text. The helper reproduced both against exact original page and module blobs without changing production source.

**Choice:** Catch only page-level calculation/render errors, clear partial narrative details and present fixed text-only recovery warnings with polite status semantics. Do not show raw exception strings, change the narrative functions or read/repair/write visitor storage in the catch. For valid records, keep the existing classifications and lore.

**Trade-offs:** A page can say it couldn't read saved records, but that is not a backup and does not diagnose the precise damaged key. Sigilpath calls the existing identity initializer *before* trait/history reads; an absent identity can be generated even when a later malformed record triggers the warning. The warning does not promise that zero storage writes occurred. Failure in static module loading, a missing DOM element, browser restrictions, true iPhone storage behaviour and real visitor histories are not validated. Revisit only with real evidence of a recovery UX need or a failing supported environment.

## Decision 2026-11-17: Territory committed-visit snapshot

**Observed:** After contributing one visit, the page independently read `warpathTally` twice more to compute the dominant faction and rows. A synthetic failure on the second read caused an unavailable message **after a successful saved increment**; an interleaved third read could show a Red heading over a Blue-first table. This is a reproducible source-level interleaving, not an observed browser race.

**Choice:** Return the just-written null-prototype tally from `contributeToFaction()` and derive heading and rows from that one snapshot. Preserve the existing public getters, count validation, exact stored bytes on refusal, inert faction labels and same-browser local scope. Do not introduce async writes or Web Locks without real cross-tab acceptance evidence.

**Trade-off:** The displayed snapshot may become stale when another tab writes later, but its heading and rows agree with the committed visit it depicts. This does not solve lost updates between concurrent read-modify-write operations; cross-tab atomicity and Safari behaviour remain separate review gates.

## Decision 2026-11-16: Councilfire failure boundary

**Observed:** `councilfire.html` awaited `summonCouncil()` at module top level without catching errors. The service may throw on malformed saved sigil/quest/throne records, deliberately preserving rather than rewriting them. Injecting a rejected Promise confirmed that the page left the gathering placeholder unchanged and its inline module rejected.

**Choice:** Keep `summonCouncil()` and its persistence rules untouched, wrap only the page's render path in a failure boundary, clear any partial output, and show fixed inert text without exposing exception diagnostics. Add a polite status role to the existing display. Successful dialogue is still assembled as individual text-only elements.

**Trade-off:** No retry button, diagnostics download or browser history alteration is introduced. A genuine storage fault may require manual recovery; this UI only makes the failure visible. Node VM tests cannot establish real-browser accessibility or behavior of live data.

## Decision 2026-11-16: show rejected Fold state reads

**Observed:** The baseline `fold.html` and `shard.html` module scripts each attached only a success handler to their asynchronous Fold request. A forced rejected Promise left `Scanning...` or `Let the Fold reveal its skin...` visible and propagated a rejection indefinitely. Both pages therefore need an explicit failure rendering boundary; this is source/synthetic evidence, not proof of production Firestore failures.

**Choice:** Add a static text-only catch to each page, exposing neither remote error details nor raw HTML. Preserve success classification and styling logic, add polite status semantics for changing text, and do not retry, write browser storage or change Firebase configuration.

**Limitations:** A Node VM with simulated remote dependencies checks the inline handlers; it does not demonstrate live Firebase, real-browser/assistive-technology rendering, deployment or iPhone compatibility. Revisit if an actual outage needs a retry interaction.

## Previous completed milestone: Rootcraft mobile/accessibility improvement

**Integration:** [PR #27](https://github.com/levelinglucy/Devoured-Web/pull/27) merged at `5e27da2f8d5a4959765a6113275b67253dcb2fc1`.

**Validation and deployment:** Exact-main Node 20 and Node 22 each passed 107/107 in [run 43929026363](https://github.com/levelinglucy/Devoured-Web/actions/runs/43929026363); [Pages run 43929023268](https://github.com/levelinglucy/Devoured-Web/actions/runs/43929023268) deployed the same revision. No tagged release or live phone/screen-reader test.

## Decision 2026-11-16: Rootcraft mobile and accessible feedback

**Observed:** Rootcraft had no viewport metadata, its textarea relied on placeholder text alone, and its result region lacked live-status semantics. A source-locked isolated Chromium comparison observed a 980px mobile layout viewport for the baseline at emulated 390px device width. Existing success, denial and storage-error text were already accurate.

**Choice:** Add `width=device-width, initial-scale=1`, a visible `<label for="frag">`, `role="status"` with `aria-atomic="true"` on the existing result, 16px textarea/button fonts, constrained textarea box sizing and a 44px minimum button height. Preserve the module import and `cast()` handler exactly. Status is advisory rather than urgent, consistent with the [WAI-ARIA status-role guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role); viewport sizing follows [HTML viewport guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport).

**Boundaries:** Markup checks and emulated Chromium are not assistive-technology audits or iPhone Safari certification. The prototype substituted storage-gate functions with synthetic handlers, so no real visitor archive was read or changed. Revisit if real screen-reader or zoom tests reveal a problem; do not claim WCAG conformance from this alone.

## Previous completed milestone: echo-feed failure messages

**Integration:** PR [#26](https://github.com/levelinglucy/Devoured-Web/pull/26) merged at `de678ead4f901372a19d4adbfec2f3bc185eeb13`.

**Validation:** Exact-main Node 20/22 each passed 106/106 in [run 43918423134](https://github.com/levelinglucy/Devoured-Web/actions/runs/43918423134); Pages workflow [43918421128](https://github.com/levelinglucy/Devoured-Web/actions/runs/43918421128) succeeded. No live outage or iPhone verification, no new tag.

## Decision 2026-11-16: make echo-feed loading failures visible

**Observed code-level issue:** `sentinel.html`, `ember.html`, `lucid.html` and `mirror.html` awaited Firestore `getDocs()` without a catch. If the promise rejects, the page keeps displaying "Loading..." indefinitely; its unhandled rejection does not give the visitor a useful explanation. This is inferred from the source and tested with synthetic rejection, not evidence of actual site outages.

**Choice:** Wrap each existing asynchronous fetch-and-render path in a catch which sets static `textContent`. Keep the existing shared inert-text renderer and unchanged normal success path. Do not expose raw Firebase error messages, rewrite data, or silently clear stored history. No retry loop or new network access added.

**Boundaries:** Mocked Firestore/DOM exercise the page's inline scripts, not an actual Firebase outage or browser/device deployment. A failure inside the renderer will also show a generic warning, not a stack trace. Revisit if user-facing retry becomes a demonstrable need.

## Decision 2026-11-16: tolerate malformed Fold snapshot fields

**Reproduced:** A null `doc.data()` caused `data.sigil` or `d.category` to throw. A numeric or map-valued anomaly category caused `category?.includes(...)` to try calling an absent method; optional chaining only skips nullish values. Either defect aborts the entire Fold classification even when other snapshot records are valid.

**Choice:** Read echo fields with optional access and apply anomaly substring/list membership checks only to strings or arrays. Keep invalid/missing categories inert, preserve original queried document counts for existing `Awake` thresholds, preserve the 3-distinct-sigil `Fractured` and 3-rekindled-sigil `Ignited` rules, and do not change storage or remote data.

**Boundaries:** Synthetic snapshots and Node tests only. We do not rewrite malformed cloud records or claim live Firestore, network, auth, browser, mobile or deployment validation. If a supported category schema other than text or arrays emerges, revisit explicitly with real data and tests.

## Decision 2026-11-16: reveal raw local history without rewriting it

**Need:** Existing fragment and trail readers intentionally refuse damaged browser-local JSON, but visitors then have no built-in way to copy that raw text before considering manual recovery. The README previously advised backing up data without offering a route inside these pages.

**Choice:** An explicit click reveals one selected localStorage value in a read-only `textarea` preview and a second JSON-escaped `textarea` for lossless manual recovery. The source archive is not parsed or rewritten, and neither view interpolates HTML, invokes network calls or writes browser storage. An absent key shows a separate message; a present empty string remains visible as a legitimate saved value. Blocked storage reads display an inert warning. Only the two named story keys are supported, and nothing is revealed on initial page load.

**Boundaries:** The HTML textarea API normalizes CR and CRLF, so its raw preview alone cannot promise an exact copied DOMString. The escaped field (`JSON.stringify(raw)`) round-trips the original text with `JSON.parse` and preserves exceptional line endings and lone surrogates. Copying is still a manual user action, not an actual completed backup, download, restoration, transaction or durable archive. This can only read records still held under the current browser origin; it cannot reconstruct previously deleted data. Served-origin keyboard reveal and clipboard copying have been demonstrated in hosted desktop Chrome with synthetic data; actual Pages behaviour, Safari/iPhone, touchscreen copying, cross-tab changes, device permissions and durability remain unverified. Do not add automatic repair or uploads without a separate reviewed design.

## Decision 2026-11-16: reject invalid Archivegod edits before storage

**Reproduced:** Existing Archivegod reads require text `dominantMask`, `mood`, `prophecy`, but the two exported writers accepted arbitrary arguments. `undefined` is omitted by JSON serialization, while number/null/object values replace expected text and leave `getGodState()` unable to read the saved story. This is a deterministic API defect, not evidence of actual user data loss; default-branch search located no application callers beyond tests.

**Choice:** Reject non-primitive strings with a `TypeError` before calling `getGodState()`, so rejected writes do not rewrite existing bytes or create default state. Preserve legitimate empty strings, all valid history fields and current storage-error propagation. No silent coercion to text, no automatic archive repair.

**Boundaries:** This guards this pair of exported writers only; direct/hostile storage changes, concurrent tabs, abrupt termination, device-specific behaviour and durability remain untested. If a verified historical caller needs numeric moods, revisit with explicit migration rather than silently weakening stored-text integrity.

## Previous completed milestone: Ritual Trail source preservation

Merged PR #22 into `main` at exact SHA `cdbdf5ed4baba86666829579f1c3e7124d278e90`; 93/93 Node tests on each 20/22 and Pages workflow succeeded on that SHA. No tag or live-browser certification. Full rationale below.

## Decision 2026-11-16: append to Ritual Trail without rewriting earlier bytes

**Failure reproduced:** Old `pagespawn.js` interpreted a saved empty string as absent (`getItem(...) || "[]"`) and would replace it with a new one-entry array. It also accepted partial/invalid new records and reserialized all old records, which could silently normalize duplicate keys, legacy formatting or out-of-range numeric fields. Earlier read-only `trail.html` display was already tolerant of partial records.

**Choice:** Distinguish absent storage from present corrupted data. The display reader still yields legacy partial records for safe inert rendering, but the writer checks that all existing records have text `title`, `filename`, `content`, `created`. Before writing, reject non-string new fields and damaged archive shapes. Insert one JSON-serialized new entry immediately before the validated array's final bracket, retaining original archival text verbatim. Storage-write errors continue to propagate; no catch silently claims success.

**Trade-offs:** Strict append refusal for historic incomplete entries is intentional: the user can still view readable records, but manual recovery is required before writing. This remains single-tab read-modify-write localStorage, not a transaction: concurrent tabs could overwrite one another, and there is no crash durability or automatic backup guarantee. No current caller of `registerSpawn` was found by default-branch code search, so this is protection of an exposed browser-local API, not a claim that production users already lost trail data.

## Decision 2026-11-16: opt-in static headings

Two independently animated `.glitch` headings use 0.1-second flicker or 0.15-second glitch loops with no motion preference override. A narrow CSS media query turns *off* only those animations when the visitor requests reduced motion, preserving their static title, page interactions and original default animation. This avoids removing an artistic effect for users who prefer it. The change does not touch browser-local archives, identity, Firebase or any script. The measured browser behaviour is for isolated CSS fixtures, not full site navigation or deployment.


## Decision 2026-11-14: preserve damaged fragment archives before append

**Reproduced predecessor:** `getFragments()` treated any present falsy string as absent via `getItem(...) || "[]"`. A saved empty string could therefore be overwritten when `addFragment()` appended a new story entry. Other malformed JSON shapes, including present `null`, objects, or entries lacking valid fields, were not checked before append; missing writer arguments could be serialized as partial records. Predecessor-test failures reproduced these behaviours against source blob `89f835bda4` locally.

**Choice:** Return a new empty array only for an actually absent key (null). Parse present JSON and require an array of non-array objects with string `title` and `text` before appending. Preserve all extra fields on valid entries. Refuse non-string writer input before saving. Preserve malformed raw browser storage unchanged and display the existing inert archive warning on `fragments.html` instead of silently replacing it. Rootcraft continues to report thrown errors; explicit `clearFragments()` remains unchanged.

**Compatibility and limitations:** The tracked writer (`addFragment`, called by `breakfold.js`) creates title/text strings, and Rootcraft validates its input, but independently edited or older deployed archives may have entries without them. Those entries now remain readable only as raw storage/manual recovery, not appendable; there is no automatic migration or byte-level archive export here. Browser localStorage is not transactional or a durable backup. Real browsers, deployment, iPhone, concurrent tabs and abrupt termination remain untested. Revisit the strict entry contract if a supported historical alternate format is demonstrated.

## Decision 2026-11-14: preserve malformed identities and base36 mutation format

**Reproduced predecessor:** Both `sigil.js` and the independent Threshold entrance used truthiness to decide a sigil was absent, so an existing empty string was overwritten with a newly generated identity. `mutateSigil()` accepted a malformed present string such as `Z` and could overwrite it with `A-undefined`. When mutating the seed digit 9, the letter-only shift calculation produced `:` rather than a valid digit. Exact-head tests reproduced five new failures against the predecessor on both hosted Node versions; no user data was inspected.

**Choice:** Permit generation only when `getItem()` returns null. Validate present identities against a deliberately broad structural contract: nonempty uppercase ASCII alphanumeric seed, hyphen and nonempty ASCII decimal shard; do not silently write or repair nonconforming values. Threshold displays an inert recovery warning and blocks navigation when identity is unreadable. Rotate letters A–Z as before and digits 0–9 separately, with 9 rolling to 0. Pad a zero-randomness seed to six characters so even the edge case stays within the same format. Keep history-first rejected-write compensation from PR #16 unchanged.

**Compatibility and limits:** The current and Threshold generators both use six-character uppercase base36 seeds and a three-digit shard; the accepted regex is intentionally more permissive of shorter historical IDs. Nevertheless, intentionally edited sigils containing lowercase, spaces, punctuation or other external formats now fail closed and remain unchanged until deliberate recovery. This is a client-side narrative ID, not authentication. Concurrent tabs, corrupted browser storage beyond this field, real browser/deployment behaviour and device support are unverified.

## Decision 2026-11-14: best-effort rollback for failed two-key sigil mutation

**Reproduced predecessor:** `mutateSigil()` updated `aletheSigil` before writing `sigilHistory`. A rejected history write (for example storage quota or policy) left the current sigil advanced without recording that change. The failure was reproduced against the exact pre-change source with deterministic browser-storage stubs. Existing checks addressed corrupt history *before* writes but not rejected writes *after* mutation.

**Choice:** Validate existing history before any mutation, snapshot the exact prior history text, and write the expanded history first. If this (potentially larger) write fails, the current sigil is unchanged. If the subsequent current-sigil write fails, restore the previous history's exact bytes, or remove the newly created history key if previously absent. If restoration also fails, throw a clear error that both operations failed and the records may be inconsistent; never report successful mutation.

**Boundaries:** This is compensating rollback for ordinary synchronous `localStorage` exceptions, **not a transaction**. Abrupt termination between writes, races across tabs, hostile browser modification, unavailable rollback storage, initial sigil generation, and power-loss durability remain unprotected. A failed rollback leaves evidence for manual recovery, not an automatic destructive reset. The current browser pages do not invoke this function directly; the correction is to the exported local story engine. Unrelated local records, Firebase and historical ZIP archives are untouched.

## Decision 2026-11-14: refuse malformed Echoquest progress without rewriting it

**Predecessor:** Fire quest used parseInt(echoCount), so a saved value such as "5junk" could falsely complete a quest with glitchTrigger=true. Lost quest used parseInt(lostVisit) and treated the *present* empty string as missing, silently starting a new timer; arbitrary text quietly yielded NaN and an indefinitely incomplete state. The Quest page did not catch thrown storage/dependency failures and could stay on "Checking...". All three defects reproduced with test-first isolated Node VM fixtures against source-matching predecessor.

**Choice:** Parse existing Fire counts and Lost timestamps only as canonical, nonnegative, safe decimal integers. Missing Fire count means zero; missing Lost timestamp starts the original timer once. Wrong-shaped, noncanonical or unsafe saved values are refused **without a write, reset or automatic migration**. A future but valid timestamp remains incomplete rather than being rewritten; normal 24-hour completion remains unchanged. The Quest page now displays inert warning text on failure. Historical ZIPs, other quests and Firestore data are untouched.

**Compatibility and limitations:** Values such as "05" and "1700000000000ms" that permissive prefix parsing previously consumed are now rejected, preserving their raw bytes for deliberate recovery. Tracked source search found no writer for echoCount and only Echoquest itself writes lostVisit; this is **not** evidence about old deployments, external scripts or manual editing. The existing Lost quest description mentions visiting fragments.html although its timer is initialized when the quest is evaluated; semantics were not redesigned here. Tests use Node VM stubs, not live browser storage, actual deployment, multi-tab races, iPhone or power-loss durability. Full suite and review remain required before merge.

## Decision 2026-11-14: preserve Archivegod default and unreadable records

**Predecessor:** When archivegodState was absent, getGodState() returned the shared defaultState object. Mutating its returned nested influence (or an unsuccessful shiftMood()/setMask() write) changed what future unsaved reads returned, despite nothing being committed to browser storage. Existing literal "null" was treated as a missing state; a parsed array or primitive could be mutated or displayed as meaningless story fields. Malformed JSON threw without a visible recovery message, leaving Archivegod Pulse on "Loading...".

**Choice:** Return an independent copy of the default with an independent influence map for a genuinely missing key. For a present key, require parseable non-array object data and the three existing story text fields; refuse invalid data without rewriting any original bytes. Preserve valid custom fields and influence values on mood/mask updates. Archivegod Pulse displays inert text explaining that the stored history was not cleared and should be preserved for manual recovery. No automatic reset, backup rewrite or schema migration is attempted.

**Compatibility decision (reviewed 2026-11-14):** Current tracked `archivegod.js` is the only indexed source writer for `archivegodState` found in this repository; its first write copies all three display fields from the complete default and edits only mood or mask. The Pulse page reads those three fields. A focused review therefore found no **tracked producer** of incomplete mood/mask/prophecy records, and the candidate tests exercise complete archives, custom extra fields, and unchanged invalid records. This is not proof that no older deployment or manually edited record exists. The compatibility choice is deliberate fail-closed behaviour: incomplete records now show a recovery warning and retain their exact bytes, rather than being silently rewritten with invented fields. Avoid automatic partial-record migration until there is a documented version/schema to migrate from.

**Compatibility/risk limits:** Unknown fields and the influence structure are left intact, deliberately avoiding invented reconstruction. This is browser-local fictional state, not an authentication boundary. Concurrent tabs, write failures between other keys, browser deployment, iPhone and power-loss durability are unverified. The separate PR is the place for exact-revision test evidence and review.

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
