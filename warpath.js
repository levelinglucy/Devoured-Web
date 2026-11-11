// warpath.js — Faction Strength & Dominance System

import { getFaction } from './faction.js';

const key = "warpathTally";

// Reject damaged local records instead of overwriting them with a new tally.
// A null-prototype map treats even "__proto__" and "constructor" as literal keys.
function readFactionPower() {
  const saved = localStorage.getItem(key);
  if (saved === null) return Object.create(null);

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error("Saved faction tally is unreadable");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.values(parsed).some(count => !Number.isSafeInteger(count) || count < 0)) {
    throw new Error("Saved faction tally has invalid counts or shape");
  }
  return Object.assign(Object.create(null), parsed);
}

export function contributeToFaction() {
  const faction = getFaction();
  const power = readFactionPower();
  const current = power[faction] ?? 0;
  if (current === Number.MAX_SAFE_INTEGER) {
    throw new Error("Saved faction tally count cannot be incremented safely");
  }
  power[faction] = current + 1;
  localStorage.setItem(key, JSON.stringify(power));
}

export function getDominantFaction() {
  const power = readFactionPower();
  const sorted = Object.entries(power).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "None";
}

export function getAllFactionPower() {
  return readFactionPower();
}
