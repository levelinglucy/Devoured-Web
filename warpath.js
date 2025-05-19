// warpath.js — Faction Strength & Dominance System

import { getFaction } from './faction.js';

const key = "warpathTally";

export function contributeToFaction() {
  const faction = getFaction();
  const power = JSON.parse(localStorage.getItem(key) || "{}");
  power[faction] = (power[faction] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(power));
}

export function getDominantFaction() {
  const power = JSON.parse(localStorage.getItem(key) || "{}");
  const sorted = Object.entries(power).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "None";
}

export function getAllFactionPower() {
  return JSON.parse(localStorage.getItem(key) || "{}");
}
