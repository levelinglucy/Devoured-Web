// fragments.js — Browser-local Lore Fragment System.
// A missing key starts empty; a present unreadable archive is not replaced.
// All tracked writes use a same-origin exclusive Web Lock; without one, refuse
// rather than silently race another modern tab. Historic/noncooperating writers
// and unexpected browser termination remain outside this guarantee.

const key = "aletheFragments";
const writeLockName = "aletheFragments:write:v1";

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

async function withFragmentWriteLock(operation) {
  // Web Locks is secure-context only. No unchecked localStorage fallback:
  // a rejected write must not claim that a fragment was saved.
  const manager = globalThis.navigator?.locks;
  if (!manager || typeof manager.request !== "function") {
    throw new Error("Safe fragment saving requires Web Locks on a secure site. The archive was not changed.");
  }
  return manager.request(writeLockName, { mode: "exclusive" }, operation);
}

function persistFragments(fragments) {
  localStorage.setItem(key, JSON.stringify(fragments));
}

// Returns true when inserted, false when the title was already present.
// Name conflicts are checked while holding the same lock as numbered writes.
export async function addFragment(title, text) {
  if (typeof title !== "string" || typeof text !== "string") {
    throw new Error("Fragment title and text must be strings");
  }
  return withFragmentWriteLock(() => {
    const existing = getFragments();
    if (existing.some(fragment => fragment.title === title)) return false;
    existing.push({ title, text });
    persistFragments(existing);
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
    const existing = getFragments();
    const titles = new Set(existing.map(fragment => fragment.title));
    let next = 1;
    while (titles.has(prefix + next)) {
      if (next === Number.MAX_SAFE_INTEGER) {
        throw new Error("No safe fragment number is available");
      }
      next += 1;
    }
    const title = prefix + next;
    existing.push({ title, text });
    persistFragments(existing);
    return title;
  });
}

export async function clearFragments() {
  return withFragmentWriteLock(() => localStorage.removeItem(key));
}
