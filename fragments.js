// fragments.js — Browser-local Lore Fragment System.
// A missing key starts empty; a present unreadable archive is not replaced.
// All tracked writes use a same-origin exclusive Web Lock; without one, refuse
// rather than silently race another modern tab. Historic/noncooperating writers
// and unexpected browser termination remain outside this guarantee.

const key = "aletheFragments";
const writeLockName = "aletheFragments:write:v1";

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

async function withFragmentWriteLock(operation) {
  // Web Locks is secure-context only. No unchecked localStorage fallback:
  // a rejected write must not claim that a fragment was saved.
  const manager = globalThis.navigator?.locks;
  if (!manager || typeof manager.request !== "function") {
    throw new Error("Safe fragment saving requires Web Locks on a secure site. The archive was not changed.");
  }
  return manager.request(writeLockName, { mode: "exclusive" }, operation);
}

function appendFragment(raw, entries, fragment) {
  const serialized = JSON.stringify(fragment);
  // The parsed entries validate the archive and provide a title index, but
  // may have rounded numbers or dropped duplicate keys. Only splice the new
  // serialized fragment into the original raw bytes inside the exclusive lock.
  const close = raw === null ? -1 : raw.lastIndexOf("]");
  const updated = raw === null ? "[" + serialized + "]" :
    raw.slice(0, close) + (entries.length ? "," : "") + serialized + raw.slice(close);
  localStorage.setItem(key, updated);
}

// Returns true when inserted, false when the title was already present.
// Name conflicts are checked while holding the same lock as numbered writes.
export async function addFragment(title, text) {
  if (typeof title !== "string" || typeof text !== "string") {
    throw new Error("Fragment title and text must be strings");
  }
  return withFragmentWriteLock(() => {
    const { raw, entries } = readFragmentArchive();
    if (entries.some(fragment => fragment.title === title)) return false;
    appendFragment(raw, entries, { title, text });
    return true;
  });
}

// Choose the first unused Root-script title AND persist it in one critical
// section. Do not read the title outside the lock or call addFragment inside it.
export async function addNumberedFragment(prefix, text) {
  if (typeof prefix !== "string" || !prefix || typeof text !== "string") {
    throw new Error("Fragment prefix and text must be strings");
  }
  return withFragmentWriteLock(() => {
    const { raw, entries } = readFragmentArchive();
    const titles = new Set(entries.map(fragment => fragment.title));
    let next = 1;
    while (titles.has(prefix + next)) {
      if (next === Number.MAX_SAFE_INTEGER) {
        throw new Error("No safe fragment number is available");
      }
      next += 1;
    }
    const title = prefix + next;
    appendFragment(raw, entries, { title, text });
    return title;
  });
}

export async function clearFragments() {
  return withFragmentWriteLock(() => localStorage.removeItem(key));
}
