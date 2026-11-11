# Change history

## Unreleased
- Restore Councilfire, Reflective Shard, Living Sigil, Pantheon, Ritual Trail and Shard Thrones; render saved text inertly, preserve malformed sigil lists, and preflight history before mutation.
- Restore Rootcraft’s missing local fragment bridge and explicit failure reporting; render browser-saved fragments as inert text instead of interpreting authored markup as HTML.
- Render Firestore echoes and browser-local Territory names as inert DOM text; reject damaged tally counts without overwriting storage, and count reserved faction keys as literal names.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
