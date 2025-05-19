// faction.js — Visitor Faction Assignment

import { getSigilPath } from './sigilpath.js';
import { claimThrone } from './shardthrone.js';

const key = "visitorFaction";

export function determineFaction() {
  const path = getSigilPath();
  const throne = claimThrone();
  const title = throne?.title || "";

  if (title === "Emberkin" || path.id === "fire") return "The Flamebound";
  if (title === "Mirrorbound" || path.id === "split") return "The Reflected";
  if (title === "Archivist" || path.id === "witness") return "The Bound Eye";
  if (title === "Drifter" || path.id === "lost") return "The Dreaming Fold";
  return "Unaffiliated";
}

export function storeFaction(faction) {
  localStorage.setItem(key, faction);
}

export function getFaction() {
  return localStorage.getItem(key) || "Unaffiliated";
}
