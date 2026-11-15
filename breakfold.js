// breakfold.js — conservative local Rootcraft bridge.
// This restores the two exports used by rootcraft.html, not a recovered historical implementation.
import { getFaction } from "./faction.js";
import { addNumberedFragment } from "./fragments.js";

const MAX_FRAGMENT_LENGTH = 2000;

export function isWanderer() {
  // Story gate only: browser localStorage can be changed by its owner.
  return getFaction() === "Wanderer";
}

export async function injectFragment(text) {
  if (!isWanderer()) throw new Error("Only Wanderers can rootwrite.");
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Write a fragment before saving.");
  }
  if (text.length > MAX_FRAGMENT_LENGTH) {
    throw new Error("Root-scripts must be 2000 characters or fewer.");
  }

  // Allocation and commit must share the exclusive write lock. This also
  // preserves corrupted archives untouched and makes a rejected write fail.
  return addNumberedFragment("Root-script ", text.trim());
}
