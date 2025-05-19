// warlock.js — Page Gate & Redirect Logic

import { getFaction } from './faction.js';
import { getDominantFaction } from './warpath.js';

export async function enforceFaction(requiredFaction) {
  const visitorFaction = getFaction();
  if (visitorFaction !== requiredFaction) {
    window.location.href = "banned.html";
  }
}

export async function lockIfRival() {
  const visitorFaction = getFaction();
  const dominantFaction = getDominantFaction();
  if (visitorFaction !== dominantFaction) {
    window.location.href = "banned.html";
  }
}
