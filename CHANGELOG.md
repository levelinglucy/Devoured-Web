# Change history

## Unreleased
- Render database echo fields with inert DOM text across Sentinel, Ember, Lucid and Mirror pages instead of parsing stored strings as HTML, preventing markup interpretation if untrusted data reaches those fields.
- Skip non-string echo messages so malformed entries do not crash the entire shard feed.
- Add dependency-free Node regression tests, a Node 20/22 GitHub Actions check, and concise setup/security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
