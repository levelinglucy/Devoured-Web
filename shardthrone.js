// shardthrone.js — Throne Claiming + Registry

import { getEchoquest } from './echoquest.js';
import { getOrCreateSigil } from './sigil.js';

const key = "aletheThroneRegistry";

export function claimThrone() {
  const sigil = getOrCreateSigil();
  const quest = getEchoquest();

  if (!quest.complete) return null;

  const titleMap = {
    witness: "Archivist",
    fire: "Emberkin",
    lost: "Drifter",
    split: "Mirrorbound"
  };

  const crown = {
    sigil: sigil,
    title: titleMap[quest.id] || "Wanderer",
    crowned: new Date().toISOString()
  };

  const registry = JSON.parse(localStorage.getItem(key) || "[]");
  const exists = registry.find(r => r.sigil === sigil);
  if (!exists) {
    registry.push(crown);
    localStorage.setItem(key, JSON.stringify(registry));
  }

  return crown;
}

export function getThroneRegistry() {
  return JSON.parse(localStorage.getItem(key) || "[]");
}
