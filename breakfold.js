// breakfold.js — conservative local Rootcraft bridge.
// This restores the two exports used by rootcraft.html, not a recovered historical implementation.
import { getFaction } from "./faction.js";
import { addFragment, getFragments } from "./fragments.js";

const MAX_FRAGMENT_LENGTH = 2000;

export function isWanderer() {
  // Story gate only: browser localStorage can be changed by its owner.
  return getFaction() === "Wanderer";
}

export function injectFragment(text) {
  if (!isWanderer()) throw new Error("Only Wanderers can rootwrite.");
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Write a fragment before saving.");
  }
  if (text.length > MAX_FRAGMENT_LENGTH) {
    throw new Error("Root-scripts must be 2000 characters or fewer.");
  }

  // Read and validate before choosing a title; never silently reset damaged storage.
  const fragments = getFragments();
  if (!Array.isArray(fragments) ||
      fragments.some((entry) => !entry || typeof entry !== "object" ||
        typeof entry.title !== "string")) {
    throw new Error("The local fragment archive is unreadable. Preserve it before repair.");
  }

  const titles = new Set(fragments.map((entry) => entry.title));
  let next = 1;
  while (titles.has("Root-script " + next)) next += 1;
  const title = "Root-script " + next;
  // addFragment uses the existing browser-local aletheFragments collection.
  // Storage failures propagate; the page must not claim a save on failure.
  addFragment(title, text.trim());
  return title;
}
