# Change history

## Unreleased
- Make Rootrite's faction switch nondestructive: preserve all earned throne records and the sigil, label the action accurately, and show storage failure instead of falsely reporting success.
- Restore Councilfire, Reflective Shard, Living Sigil, Pantheon, Ritual Trail and Shard Thrones; render saved text inertly, preserve malformed sigil lists, and preflight history before mutation.
- Restore Rootcraft’s missing local fragment bridge and explicit failure reporting; render browser-saved fragments as inert text instead of interpreting authored markup as HTML.
- Render Firestore echoes and Territory names as inert text; reject damaged Territory/Echoform counts without overwriting stored records, and count reserved names literally.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
