# Change history

## Unreleased
- Preserve damaged existing fragment archives without silent reset or partial-entry rewrites; validate new entries before local append.
- Preserve malformed present Living Sigils on both the engine and Threshold entrance; keep mutation rotations within base36 and generate a nonempty seed at a zero-randomness boundary.
- Keep the current Living Sigil unchanged if history storage fails, and best-effort restore exact history when a later sigil write is rejected; report failed rollback explicitly.
- Refuse malformed Fire/Lost Echoquest progress without resetting saved records, and show a recovery warning instead of a stalled quest screen.
- Keep Archivegod's unsaved defaults independent; refuse malformed browser-local god state without clearing it and show recoverable errors on the Pulse page.
- Count Firestore-sourced Fold rebellion sigils with an independent map, so reserved JavaScript object names cannot corrupt shared prototypes or misclassify Ignited status.
- Preserve each awarded Shard Throne's stored title/date on repeat visits, and refuse damaged throne registries rather than silently inventing or replacing historical claims.
- Make Rootrite's faction switch nondestructive: preserve all earned throne records and the sigil, label the action accurately, and show storage failure instead of falsely reporting success.
- Restore Councilfire, Reflective Shard, Living Sigil, Pantheon, Ritual Trail and Shard Thrones; render saved text inertly, preserve malformed sigil lists, and preflight history before mutation.
- Restore Rootcraft’s missing local fragment bridge and explicit failure reporting; render browser-saved fragments as inert text instead of interpreting authored markup as HTML.
- Render Firestore echoes and Territory names as inert text; reject damaged Territory/Echoform counts without overwriting stored records, and count reserved names literally.
- Ignore non-string echo messages so malformed entries do not crash a shard feed.
- Add dependency-free Node 20/22 checks, focused regression tests, and usage, engineering and security guidance.

Earlier historical uploads and archive files are preserved as-is; their original development history is not reconstructed here.
