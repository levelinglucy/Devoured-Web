# The Devoured Web

An experimental, mythic browser world made of linked shard pages, local sigils and echo records.

Open `index.html` for the original shard navigation or `threshold.html` for the sigil-based entrance. For the JavaScript-module pages, serve this directory over a local HTTP server rather than opening `file://` URLs (for example, `python -m http.server 8000` and visit `http://localhost:8000`). Online shard feeds need the configured Firebase project, network access and appropriate Firestore permissions.

Stored echo text is displayed as **text**, not trusted HTML, in the Sentinel, Ember, Lucid and Mirror domain feeds. Other historical screens have not received a complete security review. Do not treat embedded Firebase client configuration as authorization or evidence of safe Firestore rules. Avoid entering sensitive information unless you trust the site's deployment and data policies.

For offline checks, use Node 20 or 22: `npm test` (no dependencies to install). See [developer notes](./DEV_NOTES.md) and [changes](./CHANGELOG.md).
