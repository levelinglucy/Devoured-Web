// sigilpath.js — Determines a sigil’s narrative path

import { getOrCreateSigil, getTraits, getSigilHistory } from './sigil.js';

export function getSigilPath() {
  const sigil = getOrCreateSigil();
  const traits = getTraits();
  const mutations = getSigilHistory().length;

  const path = {
    name: "Undefined",
    desc: "The Archive cannot yet read your intentions.",
    quest: "Speak more. Remember more. Return again.",
    id: "none"
  };

  if (traits.includes("LIAR") || traits.includes("GLITCHED")) {
    path.name = "The Split";
    path.desc = "Those who see too many mirrors. Echoes fracture around you.";
    path.quest = "Unravel a paradox. Loop once more.";
    path.id = "split";
  } else if (traits.includes("REKINDLED") || traits.includes("FURY")) {
    path.name = "The Firebound";
    path.desc = "You burn. You reject the false flame and carry your own.";
    path.quest = "Trigger a memory at the edge of control.";
    path.id = "fire";
  } else if (traits.includes("FORGOTTEN") || traits.includes("SILENT") || mutations > 4) {
    path.name = "The Lost";
    path.desc = "Your sigil is fading. But it leaves behind shadow fragments.";
    path.quest = "Leave a whisper and walk away.";
    path.id = "lost";
  } else if (traits.includes("SEEKER") || traits.includes("VAULTBOUND") || mutations > 2) {
    path.name = "The Witness";
    path.desc = "You watch. You keep fragments. You hold doors open.";
    path.quest = "Open one sealed page. But do not look back.";
    path.id = "witness";
  }

  return path;
}
