# Change history

## Unreleased
- Restore Councilfire's five voiced dialogue lines by fixing unescaped JavaScript quotation marks while retaining the original story and conditional branches.
- Render Councilfire lines as inert DOM text rather than interpolated HTML, with regression checks for normal, Split and completed Firebound paths.
- Render stored Firestore echo fields with inert DOM text across Sentinel, Ember, Lucid and Mirror rather than interpreting stored strings as HTML.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
