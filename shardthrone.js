// shardthrone.js — Throne Claiming + Registry

import { getEchoquest } from './echoquest.js';
import { getOrCreateSigil } from './sigil.js';

const key = "aletheThroneRegistry";

export function claimThrone() {
  const sigil = getOrCreateSigil();
  const registry = getThroneRegistry();
  const existing = registry.find(record => record.sigil === sigil);
  // A crown is an earned historical fact, not today's recalculated quest result.
  if (existing) return existing;

  const quest = getEchoquest();
  if (!quest.complete) return null;

  const titleMap = {
    witness: "Archivist",
    fire: "Emberkin",
    lost: "Drifter",
    split: "Mirrorbound"
  };

  const crown = {
    sigil,
    title: titleMap[quest.id] || "Wanderer",
    crowned: new Date().toISOString()
  };

  registry.push(crown);
  localStorage.setItem(key, JSON.stringify(registry));
  return crown;
}

export function getThroneRegistry() {
  const raw = localStorage.getItem(key);
  if (raw === null) return [];

  let records;
  try {
    records = JSON.parse(raw);
  } catch {
    throw new Error("Saved throne registry is unreadable");
  }
  // Historical entries may have extra fields or missing optional display fields.
  // Reject only shapes unsafe for finding a sigil, rather than silently resetting.
  if (!Array.isArray(records) ||
      records.some(record =>
        !record || typeof record !== "object" || Array.isArray(record) ||
        typeof record.sigil !== "string" || record.sigil.length === 0)) {
    throw new Error("Saved throne registry has invalid records");
  }
  return records;
}
