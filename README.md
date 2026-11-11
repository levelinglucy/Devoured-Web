# The Devoured Web

An experimental, mythic browser world made of linked shard pages, local sigils and echo records.

Open `index.html` for the original shard navigation or `threshold.html` for the sigil-based entrance. For the JavaScript-module pages, serve this directory over a local HTTP server rather than opening `file://` URLs (for example, `python -m http.server 8000` and visit `http://localhost:8000`). Online shard feeds need the configured Firebase project, network access and appropriate Firestore permissions.

Stored echo text is displayed as **text**, not trusted HTML, in the Sentinel, Ember, Lucid and Mirror domain feeds. Other historical screens have not received a complete security review. Do not treat embedded Firebase client configuration as authorization or evidence of safe Firestore rules. Avoid entering sensitive information unless you trust the site's deployment and data policies.

**Rootcraft (local-only):** Use `rootrite.html` to adopt the Wanderer story faction, then `rootcraft.html` to save up to 2,000 characters per root-script into the existing `aletheFragments` collection in *this browser only*. View them in `fragments.html`. These scripts are not published to Firebase or visible to other visitors. Browser storage can be cleared or manually edited; the Wanderer check is a narrative gate, **not real authentication**. Back up anything you want to keep. Invalid existing archive data is not automatically overwritten. The original `breakfold.js` implementation was absent; this is a limited reconstruction, not a recovered original.

**Rootrite (browser-local):** `rootrite.html` changes the current story faction to Wanderer without deleting the existing sigil or any entries in the throne registry. If browser storage refuses the faction change, the page reports failure. This is not a new identity or a reset of the full local archive.

**Territory (browser-local):** Opening `territory.html` adds one visit to your current faction's local power tally and lists faction strengths in descending order. Browser-saved faction names are displayed as literal text, not HTML. This is fictional local state rather than authentication or a public leaderboard. Damaged `warpathTally` JSON shows a warning while preserving the original record for manual recovery; browser storage is not a backup.

**Echoform: Glyph (browser-local):** The story changes over the first three visits, then repeats its later response. Invalid `echoformVisits` records show a warning rather than being reset; repair or export them manually. This counter does not sync between devices, and storage can be cleared by the browser.

For offline checks, use Node 20 or 22: `npm test` (no dependencies to install). See [developer notes](./DEV_NOTES.md) and [changes](./CHANGELOG.md).
