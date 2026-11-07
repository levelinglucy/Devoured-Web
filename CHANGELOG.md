# Change history

## Unreleased
- Restore Councilfire dialogue syntax and Reflective Shard's two-line responses, preserving their original voices and branch tests.
- Restore Rootcraft’s missing local fragment bridge and explicit failure reporting; render browser-saved fragments as inert text instead of interpreting authored markup as HTML.
- Render stored Firestore echo fields with inert DOM text across Sentinel, Ember, Lucid and Mirror rather than interpreting stored strings as HTML.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
