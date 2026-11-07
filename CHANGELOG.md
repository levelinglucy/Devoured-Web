# Change history

## Unreleased
- Restore Councilfire dialogue, Reflective Shard responses, and Living Sigil's module parsing; preserve original texts while rendering editable sigil and trait values as inert DOM text.
- Restore Rootcraft’s missing local fragment bridge and explicit failure reporting; render browser-saved fragments as inert text instead of interpreting authored markup as HTML.
- Render stored Firestore echo fields with inert DOM text across Sentinel, Ember, Lucid and Mirror rather than interpreting stored strings as HTML.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
