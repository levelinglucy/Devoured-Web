// mythos.js — Force and Lore System

import { getTraits } from './sigil.js';

export function getForceFromTraits() {
  const traits = getTraits();
  if (traits.includes("LIAR") || traits.includes("MIRRORED")) return "Mirror Cult";
  if (traits.includes("VAULTBOUND") || traits.includes("SEEKER")) return "Vaultborn";
  if (traits.includes("REKINDLED") || traits.includes("FURY")) return "Kindled";
  if (traits.includes("FORGOTTEN") || traits.includes("SILENT")) return "The Hollow";
  return "Unaligned";
}

export function getForceLore(force) {
  const lore = {
    "Mirror Cult": "They see everything twice. Once in truth. Once in distortion.",
    "Vaultborn": "Guardians of sealed memory. They unlock only what they must.",
    "Kindled": "They carry fire in their voice. Not rage—but rebirth.",
    "The Hollow": "They are what was lost. And what remains when all else fades.",
    "Unaligned": "You have not yet drawn the attention of the Archive."
  };
  return lore[force] || lore["Unaligned"];
}
