// fragments.js — Browser-local Lore Fragment System.
// A missing key starts empty; a present unreadable archive is not replaced.

const key = "aletheFragments";

function readFragmentArchive() {
  const raw = localStorage.getItem(key);
  if (raw === null) return { raw, entries: [] };

  let entries;
  try {
    entries = JSON.parse(raw);
  } catch {
    throw new Error("Saved fragment archive is unreadable");
  }
  // Only the shape emitted by addFragment is writable. Keep additional
  // historical object fields instead of discarding them during an append.
  if (!Array.isArray(entries) || entries.some(entry =>
      !entry || typeof entry !== "object" || Array.isArray(entry) ||
      typeof entry.title !== "string" || typeof entry.text !== "string")) {
    throw new Error("Saved fragment archive has invalid entries or shape");
  }
  return { raw, entries };
}

export function getFragments() {
  return readFragmentArchive().entries;
}

export function addFragment(title, text) {
  if (typeof title !== "string" || typeof text !== "string") {
    throw new Error("Fragment title and text must be strings");
  }
  const { raw, entries } = readFragmentArchive();
  if (!entries.some(fragment => fragment.title === title)) {
    const serialized = JSON.stringify({ title, text });
    // Only insert the new record; reparsing/reserializing older entries can
    // silently round large numbers, change nonfinite values or drop duplicate keys.
    const close = raw === null ? -1 : raw.lastIndexOf("]");
    const updated = raw === null ? `[${serialized}]` :
      raw.slice(0, close) + (entries.length ? "," : "") + serialized + raw.slice(close);
    localStorage.setItem(key, updated);
  }
}

export function clearFragments() {
  localStorage.removeItem(key);
}
