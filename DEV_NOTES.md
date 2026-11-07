# Developer notes

## Development

**Purpose:** Preserve the interactive shard mythology while making Firestore-sourced echo displays inert and resilient to missing/non-string message fields.

**Integration / validation:** Source changes are proposed and reviewed through GitHub pull requests; refer to the associated PR checks for the exact tested revision, environment and integration status. The repository does not acquire a published stable release from documentation or successful tests alone. The security change is listed under Unreleased in the changelog.

**Next useful checks:** (1) inspect other localStorage/Firestore-to-HTML rendering surfaces before enabling untrusted contributions; (2) review Firestore access rules in the actual deployment, if access becomes available; (3) add browser-level testing if this work becomes a published interactive product.

**Current scope:** Four existing domain pages (Sentinel, Ember, Lucid, Mirror) share `echo-renderer.js`. Fields from Firestore are assigned through `textContent`, never interpolated into `innerHTML`; missing or non-string messages are skipped. Only the same records that mention the current shard are displayed. No Firestore schema, rules, stored records or historical zip archives were modified.

**Validation / limits:** `npm test` uses Node's built-in test runner and a minimal DOM double, exercising inert markup, shard filtering, malformed message resilience and the four page imports. It is not a real browser/Firebase test; other pages (including local saved fragment/trail displays) may still interpret unsanitized HTML. Networked authorization, browser compatibility and security of deployed Firestore rules are unverified. No formal security audit.

## Decision: inert DOM construction

Alternative: HTML-escape each interpolated field before using templates. Chosen: a small shared renderer that creates DOM elements and assigns `textContent`, avoiding repeated escaping rules and keeping domain page changes small. Cost: one extra module import and some element creation. Revisit if actual browser performance with very large collections demands pagination or batching; preserve inert text semantics.

## Project continuity

The historical static pages and ZIP uploads are retained. Improve one independently demonstrated defect at a time; do not rewrite the fictional setting or imply a live service based only on static code. Keep the README focused on usage and this file as the detailed development home.
