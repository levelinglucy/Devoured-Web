// pagespawn.js — Browser-local ritual trail; existing saved bytes are never rewritten on append.

const trailKey = "aletheSpawnTrail";

function readTrail() {
  const raw = localStorage.getItem(trailKey);
  if (raw === null) return { raw, entries: [] };

  let entries;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error("Saved ritual trail is unreadable; existing data was not changed");
  }
  if (!Array.isArray(entries)) {
    throw new Error("Saved ritual trail is not an array; existing data was not changed");
  }
  return { raw, entries };
}

export function getTrail() {
  return readTrail().entries;
}

export function registerSpawn(title, filename, content) {
  if (typeof title !== "string" || typeof filename !== "string" ||
      typeof content !== "string") {
    throw new TypeError("Spawn title, filename and content must be strings");
  }
  const { raw, entries } = readTrail();
  // The reader tolerates old partial records; the writer must not normalize them.
  if (!entries.every(entry =>
    entry !== null && typeof entry === "object" && !Array.isArray(entry) &&
    typeof entry.title === "string" && typeof entry.filename === "string" &&
    typeof entry.content === "string" && typeof entry.created === "string"
  )) {
    throw new Error("Saved ritual trail has invalid entries; existing data was not changed");
  }
  const entry = { title, filename, content, created: new Date().toISOString() };
  const serialized = JSON.stringify(entry);
  // Insert at the closing array bracket instead of serializing old records again.
  // This preserves historical whitespace, duplicate keys and unrecognized fields verbatim.
  const close = raw === null ? -1 : raw.lastIndexOf("]");
  const updated = raw === null ? `[${serialized}]` :
    raw.slice(0, close) + (entries.length ? "," : "") + serialized + raw.slice(close);
  localStorage.setItem(trailKey, updated);
  return entry;
}
