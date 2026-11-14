// fragments.js — Browser-local Lore Fragment System.
// A missing key starts empty; a present unreadable archive is not replaced.

const key = "aletheFragments";

export function getFragments() {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Saved fragment archive is unreadable");
  }
  // Only the shape emitted by addFragment is writable. Keep additional
  // historical object fields instead of discarding them during an append.
  if (!Array.isArray(parsed) || parsed.some(entry =>
      !entry || typeof entry !== "object" || Array.isArray(entry) ||
      typeof entry.title !== "string" || typeof entry.text !== "string")) {
    throw new Error("Saved fragment archive has invalid entries or shape");
  }
  return parsed;
}

export function addFragment(title, text) {
  if (typeof title !== "string" || typeof text !== "string") {
    throw new Error("Fragment title and text must be strings");
  }
  const existing = getFragments();
  if (!existing.some(fragment => fragment.title === title)) {
    existing.push({ title, text });
    localStorage.setItem(key, JSON.stringify(existing));
  }
}

export function clearFragments() {
  localStorage.removeItem(key);
}
